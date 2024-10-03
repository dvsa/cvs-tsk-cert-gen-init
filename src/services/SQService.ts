import { ServiceException } from "@smithy/smithy-client";

import {
  GetQueueUrlCommand,
  GetQueueUrlCommandOutput,
  MessageAttributeValue,
  ReceiveMessageCommand,
  ReceiveMessageCommandOutput,
  SQSClient,
  SendMessageCommand,
  SendMessageCommandInput
} from "@aws-sdk/client-sqs";

import { Service } from "../models/injector/ServiceDecorator";
import { Configuration } from "../utils/Configuration";

/* tslint:disable */
const AWSXRay = require("aws-xray-sdk");
/* tslint:enable */

/**
 * Service class for interfacing with the Simple Queue Service
 */
@Service()
class SQService {
  public readonly sqsClient: SQSClient;
  private readonly config: any;

  /**
   * Constructor for the ActivityService class
   * @param sqsClient - The Simple Queue Service client
   */
  constructor(sqsClient: SQSClient) {
    const config: any = Configuration.getInstance().getConfig();

    const env: string =
      !process.env.BRANCH || process.env.BRANCH === "local"
        ? "local"
        : "remote";
    this.config = config.sqs[env];

    this.sqsClient = new SQSClient({ ...sqsClient, ...this.config });

    if (!config.sqs) {
      throw new Error("SQS config is not defined in the config file.");
    }

    // AWSConfig.sqs = this.config.params;
  }

  /**
   * Send a message to cert-gen queue
   * @param messageBody
   */
  public sendCertGenMessage(messageBody: string) {
    console.log(`Message Body to be sent: ${messageBody}`);
    return this.sendMessage(messageBody, this.config.queueName[0]);
  }

  /**
   * Send a message to the specified queue (the AWS SQS queue URL is resolved based on the queueName for each message )
   * @param messageBody - A string message body
   * @param messageAttributes - A MessageAttributeMap
   * @param queueName - The queue name
   */
  private async sendMessage(
    messageBody: string,
    queueName: string,
    messageAttributes?: Record<string, MessageAttributeValue>
  ) {
    // Get the queue URL for the provided queue name
    const queueUrlResult: GetQueueUrlCommandOutput = await this.sqsClient.send(
      new GetQueueUrlCommand({ QueueName: queueName })
    );
    // .promise();

    const params = {
      QueueUrl: queueUrlResult.QueueUrl,
      MessageBody: messageBody,
    };

    if (messageAttributes) {
      Object.assign(params, { MessageAttributes: messageAttributes });
    }

    // Send a message to the queue
    await this.sqsClient.send(
      new SendMessageCommand(params as SendMessageCommandInput)
    );
  }

  /**
   * Get the messages in the queue
   */
  public async getMessages(): Promise<
    ReceiveMessageCommandOutput | ServiceException
  > {
    // Get the queue URL for the provided queue name
    console.log("here in getMessages");
    const queueUrlResult: GetQueueUrlCommandOutput = await this.sqsClient.send(
      new GetQueueUrlCommand({ QueueName: this.config.queueName[0] })
    );
    console.log("after get queueurl");
    // Get the messages from the queue
    return this.sqsClient.send(
      new ReceiveMessageCommand({ QueueUrl: queueUrlResult.QueueUrl! })
    );
  }
}

export { SQService };
