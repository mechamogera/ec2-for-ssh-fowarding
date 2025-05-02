import {
    CloudFormationClient,
    CreateStackCommand,
    DeleteStackCommand,
    waitUntilStackCreateComplete,
    waitUntilStackDeleteComplete,
    DescribeStacksCommand
} from "@aws-sdk/client-cloudformation";
import { EC2Client, waitUntilInstanceStatusOk } from "@aws-sdk/client-ec2";
import { load } from "js-yaml";
import { readFileSync } from "fs";
import scheme from "cloudformation-schema-js-yaml";

export async function createStack(region: string, stackName: string, isWait: boolean, allowedCidr: string = "0.0.0.0/0") {
    const client = new CloudFormationClient({ region });
    const template = load(readFileSync("cloudformation-template.yaml", "utf8"), { schema: scheme }) as any;

    await client.send(new CreateStackCommand({
        StackName: stackName,
        TemplateBody: JSON.stringify(template),
        Parameters: [
            {
                ParameterKey: "AllowedCidr",
                ParameterValue: allowedCidr
            }
        ],
        Capabilities: ["CAPABILITY_IAM"] // CAPABILITY_IAM を追加
    }));
    console.log("create ec2 started");

    if (isWait) {
        await waitUntilStackCreateComplete({ client, maxWaitTime: 60 * 5 }, { StackName: stackName });
        console.log("create ec2 completed");

        const response = await client.send(new DescribeStacksCommand({ StackName: stackName }));
        const outputs = new Map();
        response.Stacks[0].Outputs.forEach(x => outputs.set(x.OutputKey, x.OutputValue));

        console.log(`InstanceId: ${outputs.get("InstanceId")}`);
        console.log(`PublicIP: ${outputs.get("PublicIP")}`);
        console.log(`KeyPairId: ${outputs.get("KeyPairId")}`);

        const ec2Client = new EC2Client({ region });
        console.log("instance status check start");
        await waitUntilInstanceStatusOk({ client: ec2Client, maxWaitTime: 60 * 5 }, { InstanceIds: [outputs.get("InstanceId")] });
        console.log("instance status ok");
    }
}

export async function deleteStack(region: string, stackName: string, isWait: boolean) {
    const client = new CloudFormationClient({ region });
    await client.send(new DeleteStackCommand({ StackName: stackName }));
    console.log("delete started");

    if (isWait) {
        await waitUntilStackDeleteComplete({ client, maxWaitTime: 60 * 5 }, { StackName: stackName });
        console.log("delete completed");
    }
}

export async function getCloudFormationOutputs(region: string, stackName: string) {
    const clientCF = new CloudFormationClient({ region });
    const response = await clientCF.send(new DescribeStacksCommand({ StackName: stackName }));
    const outputs = {};
    response.Stacks[0].Outputs.forEach(x => {
        outputs[x.OutputKey] = x.OutputValue;
    });
    return outputs;
}