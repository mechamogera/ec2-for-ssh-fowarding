import { Command } from 'commander';
import { defaultRegion, defaultStackName } from "../src/config.js";
import { getCloudFormationOutputs } from "../src/cloudformationUtils.js";
import { getPrivateKey, sshRemoteForwarding } from "../src/sshUtils.js";
import { parseMyInt } from "../src/commandHelper.js";

async function main() {
    const command = new Command();
    command.option('-r, --region <region>', 'AWS region', defaultRegion);
    command.option('-s, --stack-name <stackName>', 'Stack name', defaultStackName);
    command.option('-p, --target-port <port>', 'Target port', parseMyInt, 8888);
    command.requiredOption('-a, --target-address <address>', 'Target address');
    command.parse();

    const outputs = await getCloudFormationOutputs(command.opts().region, command.opts().stackName);
    console.log(`InstanceId: ${outputs["InstanceId"]}`);
    console.log(`PublicIP: ${outputs["PublicIP"]}`);
    console.log(`SSMKeyName: /ec2/keypair/${outputs["KeyPairId"]}`);
    console.log("");

    const privateKey = await getPrivateKey(command.opts().region, outputs["KeyPairId"]);
    
    console.log(`RemoteForward: ${outputs['PublicIP']}:8888 to ${command.opts().targetAddress}:${command.opts().targetPort}`);

    sshRemoteForwarding(
        outputs['PublicIP'], 
        22, 
        'ec2-user', 
        privateKey, 
        'localhost', 
        8888, 
        command.opts().targetAddress,
        command.opts().targetPort);
}

main();
