import { Client } from "ssh2";
import { Socket } from "net";
import { SSMClient, GetParameterCommand } from "@aws-sdk/client-ssm";

export async function getPrivateKey(region: string, keyId: string) {
    const ssmClient = new SSMClient({ region });
    const response = await ssmClient.send(new GetParameterCommand({
        Name: `/ec2/keypair/${keyId}`,
        WithDecryption: true,
    }));
    return response.Parameter.Value;
}

export async function sshRemoteForwarding(
    sshHost: string,
    sshPort: number,
    sshUser: string,
    sshKey: string,
    srcAddr: string,
    srcPort: number,
    targetAddr: string,
    targetPort: number
) {
    const sshOptions = {
        host: sshHost,
        port: sshPort,
        username: sshUser,
        privateKey: sshKey,
    };

    const conn = new Client();
    conn.on("ready", () => {
        console.log("Client :: ready");
        conn.forwardIn(srcAddr, srcPort, err => {
            if (err) throw err;

            process.on("SIGINT", () => {
                conn.unforwardIn(srcAddr, srcPort, () => {});
            });
        });
    });

    conn.on("tcp connection", (info, accept, reject) => {
        console.log("TCP :: INCOMING CONNECTION: ");
        console.dir(info);

        const tcpClient = new Socket();
        tcpClient.connect(targetPort, targetAddr, () => {
            console.log("LOCAL TCP :: CONNECTED TO:");
            const serverStream = accept();
            serverStream.pipe(tcpClient);
            tcpClient.pipe(serverStream);
        });

        tcpClient.on("error", err => {
            console.log("TCP :: ERROR: " + err);
        });
    });

    conn.connect(sshOptions);
}