import {
  CreateQueueRequest,
  DeleteQueueRequest,
  GetQueueUrlRequest,
  GetQueueUrlResult,
  SendMessageRequest,
  SendMessageResult,
  ReceiveMessageRequest,
  ReceiveMessageResult,
} from "@aws-sdk/client-sqs";

interface IQueue {
  queueName?: string;
  queueURL: string;
  queueMessages: string[];
}

/**
 * Mock class that mocks the functionality of the SQService class
 */
class SQMockClient {
  private readonly queues: IQueue[] = [];

  /**
   * Creates a new queue
   * @param queue - a CreateQueueRequest
   */
  public createQueue(queue: CreateQueueRequest) {
    this.queues.push({
      queueName: queue.QueueName,
      queueURL: `sqs://queue/${queue.QueueName}`, // This is a mock value. It doesn't mean anything.
      queueMessages: [],
    });
  }

  /**
   * Removes a queue
   * @param params - the delete queue request
   */
  public deleteQueue(params: DeleteQueueRequest) {
    const foundQueueIndex = this.queues.findIndex(
      (queue) => queue.queueURL === params.QueueUrl
    );
    this.queues.splice(foundQueueIndex, 1);
  }

  /**
   * Get a mock queue URL
   * @param params - GetQueueUrlRequest parameters
   * @param callback - optional callback function
   */
  public getQueueUrl(
    params: GetQueueUrlRequest,
    callback?: (err: any, data: GetQueueUrlResult) => void
  ): any {
    return {
      promise: () => {
        return new Promise((resolve, reject) => {
          const foundQueue = this.queues.find(
            (queue) => queue.queueName === params.QueueName
          );

          if (foundQueue) {
            resolve({ QueueUrl: foundQueue.queueURL });
          }

          reject(new Error(`Queue ${params.QueueName} was not found.`));
        });
      },
    };
  }

  /**
   * Send a message to the mock queue
   * @param params - SendMessageRequest parameters
   * @param callback - optional callback function
   */
  public sendMessage(
    params: SendMessageRequest,
    callback?: (err: any, data: SendMessageResult) => void
  ): any {
    return {
      promise: () => {
        return new Promise((resolve, reject) => {
          const foundQueue = this.queues.find(
            (queue) => queue.queueURL === params.QueueUrl
          );

          if (foundQueue && params.MessageBody) {
            foundQueue.queueMessages.push(params.MessageBody);
            resolve({
              MessageId: "mock",
            });
          }

          reject(new Error(`Queue ${params.QueueUrl} was not found.`));
        });
      },
    };
  }

  /**
   * Get messages from the mock queue
   * @param params - ReceiveMessageRequest parameters
   * @param callback - optional callback function
   */
  public receiveMessage(
    params: ReceiveMessageRequest,
    callback?: (err: any, data: ReceiveMessageResult) => void
  ): any {
    return {
      promise: () => {
        return new Promise((resolve, reject) => {
          const foundQueue = this.queues.find(
            (queue) => queue.queueURL === params.QueueUrl
          );

          if (foundQueue) {
            resolve({ Messages: [{ Body: foundQueue.queueMessages }] });
          }

          reject(new Error(`Queue ${params.QueueUrl} was not found.`));
        });
      },
    };
  }

  /**
   * Mock function required to support XRay capture. The XRay wrapper invokes this function, but doesn't care about the response.
   * @returns {{}}
   */
  public customizeRequests(): any {
    return {};
  }
}

export { SQMockClient };
