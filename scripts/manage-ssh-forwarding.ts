import { Command } from 'commander';
import { defaultRegion, defaultStackName } from "../src/config";
import { createStack, deleteStack, getCloudFormationOutputs } from "../src/cloudformationUtils";
import { getPrivateKey, sshRemoteForwarding } from "../src/sshUtils";

async function main() {
    const command = new Command();
    command.option('-r, --region <region>', 'AWS region', defaultRegion);
    command.option('-s, --stack-name <stackName>', 'Stack name', defaultStackName);
    command.option('-p, --target-port <port>', 'Target port', parseInt, 8888);
    command.requiredOption('-a, --target-address <address>', 'Target address');
    command.option('-c, --allowed-cidr <allowedCidr>', 'Allowed CIDR(ex: 203.0.113.5/32,203.0.113.6/32)', '0.0.0.0/0');
    command.parse();

    const options = command.opts();

    console.log("Creating CloudFormation stack...");
    await createStack(options.region, options.stackName, true, options.allowedCidr);

    const outputs = await getCloudFormationOutputs(options.region, options.stackName);

    const privateKey = await getPrivateKey(options.region, outputs["KeyPairId"]);

    console.log(`RemoteForward: ${outputs['PublicIP']}:8888 to ${options.targetAddress}:${options.targetPort}`);

    sshRemoteForwarding(
        outputs['PublicIP'],
        22,
        'ec2-user',
        privateKey,
        'localhost',
        8888,
        options.targetAddress,
        options.targetPort
    );

    process.on('SIGINT', async () => {
        console.log("Stopping SSH forwarding and deleting CloudFormation stack...");
        await deleteStack(options.region, options.stackName, false);
        process.exit(0);
    });
}

main();