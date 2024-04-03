import { ServiceException } from "@smithy/smithy-client";

import {
  GetQueueUrlCommand,
  GetQueueUrlCommandOutput,
  MessageAttributeValue,
  ReceiveMessageCommand,
  ReceiveMessageCommandOutput,
  SQSClient,
  SendMessageCommand,
  SendMessageCommandInput,
  SendMessageCommandOutput,
} from "@aws-sdk/client-sqs";

import { Service } from "../models/injector/ServiceDecorator";
import { Configuration } from "../utils/Configuration";
// import { PromiseResult } from "aws-sdk/lib/request";
import { config as AWSConfig } from "aws-sdk";
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
    this.sqsClient = AWSXRay.captureAWSv3Client(sqsClient);

    if (!config.sqs) {
      throw new Error("SQS config is not defined in the config file.");
    }

    // Not defining BRANCH will default to local
    const env: string =
      !process.env.BRANCH || process.env.BRANCH === "local"
        ? "local"
        : "remote";
    this.config = config.sqs[env];

    AWSConfig.sqs = this.config.params;
  }

  /**
   * Send a message to cert-gen queue
   * @param messageBody
   */
  public sendCertGenMessage(messageBody: string) {
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
  ): Promise<SendMessageCommandOutput | ServiceException> {
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
    return this.sqsClient.send(
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
    const queueUrlResult: GetQueueUrlCommandOutput = await this.sqsClient.send(
      new GetQueueUrlCommand({ QueueName: this.config.queueName[0] })
    );
    // Get the messages from the queue
    return this.sqsClient.send(
      new ReceiveMessageCommand({ QueueUrl: queueUrlResult.QueueUrl! })
    );
  }
}

export { SQService };
