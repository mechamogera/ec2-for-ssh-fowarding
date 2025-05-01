import { defaultRegion, defaultStackName } from "../src/config";
import { Command } from 'commander';
import { createStack, deleteStack } from "../src/cloudformationUtils";

async function main() {
    const command = new Command();
    command.option('-r, --region <region>', 'AWS region', defaultRegion);
    command.option('-s, --stack-name <stackName>', 'Stack name', defaultStackName);
    command.option('-w, --wait', 'Wait for stack action', true);
    command.option('-c, --allowed-cidr <allowedCidr>', 'Allowed CIDR(ex: 203.0.113.5/32,203.0.113.6/32)', '0.0.0.0/0');
    command.command('create').description('Create aws infrastructure').action(async () => {
        createStack(command.opts().region, command.opts().stackName, command.opts().wait, command.opts().allowedCidr);
    });
    command.command('delete').description('Destroy aws infrastructure').action(async () => {
        deleteStack(command.opts().region, command.opts().stackName, command.opts().wait);
    });
    command.parse();
}

main();