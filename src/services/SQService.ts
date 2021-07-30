import SQS, {GetQueueUrlResult, MessageBodyAttributeMap, ReceiveMessageResult, SendMessageResult} from "aws-sdk/clients/sqs";
import {Service} from "../models/injector/ServiceDecorator";
import {Configuration} from "../utils/Configuration";
import {PromiseResult} from "aws-sdk/lib/request";
import {AWSError, config as AWSConfig} from "aws-sdk";
/* tslint:disable */
// const AWSXRay = require("aws-xray-sdk");
/* tslint:enable */

/**
 * Service class for interfacing with the Simple Queue Service
 */
@Service()
class SQService {
    public readonly sqsClient: SQS;
    private readonly config: any;

    /**
     * Constructor for the ActivityService class
     * @param sqsClient - The Simple Queue Service client
     */
    constructor(sqsClient: SQS) {
        // const config: any = Configuration.getInstance().getConfig();
        // // this.sqsClient = AWSXRay.captureAWSClient(sqsClient);
        this.sqsClient = sqsClient;
        console.log("sqsClient");
        console.log(sqsClient);
    }

    /**
     * Send a message to cert-gen queue
     * @param messageBody
     */
    public sendCertGenMessage(messageBody: string) {
        return this.sendMessage(messageBody, "cert-gen-localstack-queue");
    }

    /**
     * Send a message to update-status queue
     * @param messageBody
     */
    public sendUpdateStatusMessage(messageBody: string) {
        return this.sendMessage(messageBody, "update-status-localstack-queue");
    }

    /**
     * Send a message to the specified queue (the AWS SQS queue URL is resolved based on the queueName for each message )
     * @param messageBody - A string message body
     * @param messageAttributes - A MessageAttributeMap
     * @param queueName - The queue name
     */
    private async sendMessage(messageBody: string, queueName: string, messageAttributes?: MessageBodyAttributeMap): Promise<PromiseResult<SendMessageResult, AWSError>> {
        // Get the queue URL for the provided queue name
        console.log({queueName});
        const queueUrlResult: GetQueueUrlResult = await this.sqsClient.getQueueUrl({ QueueName: queueName })
        .promise();
        console.log("sendMessage() queueUrlResult");
        console.log(queueUrlResult);

        const params = {
            QueueUrl: `http://${process.env.LOCALSTACK_HOSTNAME}:4566`,
            MessageBody: messageBody
        };

        if (messageAttributes) {
            Object.assign(params, { MessageAttributes: messageAttributes });
        }

        // Send a message to the queue
        return this.sqsClient.sendMessage(params as SQS.Types.SendMessageRequest).promise();
    }

    /**
     * Get the messages in the queue
     */
    public async getMessages(): Promise<PromiseResult<ReceiveMessageResult, AWSError>> {
        // Get the queue URL for the provided queue name
        const queueUrlResult: GetQueueUrlResult = await this.sqsClient.getQueueUrl({ QueueName: "cert-gen-localstack-queue" })
        .promise();
        console.log("getMessages(): queueUrlResult");
        console.log(queueUrlResult);

        // Get the messages from the queue
        return this.sqsClient.receiveMessage({ QueueUrl: `http://${process.env.LOCALSTACK_HOSTNAME}:4566` })
        .promise();
    }

}

export {SQService};
