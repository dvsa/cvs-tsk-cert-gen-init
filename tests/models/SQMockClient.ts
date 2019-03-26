import {AWSError} from "aws-sdk";
import SQS, {CreateQueueRequest, DeleteQueueRequest} from "aws-sdk/clients/sqs";

interface IQueue {
    queueName: string;
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
            queueMessages: []
        });
    }

    /**
     * Removes a queue
     * @param params - the delete queue request
     */
    public deleteQueue(params: DeleteQueueRequest) {
        const foundQueueIndex = this.queues.findIndex((queue) => queue.queueURL === params.QueueUrl);
        this.queues.splice(foundQueueIndex, 1);
    }

    /**
     * Get a mock queue URL
     * @param params - GetQueueUrlRequest parameters
     * @param callback - optional callback function
     */
    public getQueueUrl(params: SQS.Types.GetQueueUrlRequest, callback?: (err: AWSError, data: SQS.Types.GetQueueUrlResult) => void): any {
        return {
            promise: () => {
                return new Promise((resolve, reject) => {
                    const foundQueue = this.queues.find((queue) => queue.queueName === params.QueueName);

                    if (foundQueue) {
                        resolve({ QueueUrl: foundQueue.queueURL });
                    }

                    reject(new Error(`Queue ${params.QueueName} was not found.`));
                });
            }
        };
    }

    /**
     * Send a message to the mock queue
     * @param params - SendMessageRequest parameters
     * @param callback - optional callback function
     */
    public sendMessage(params: SQS.Types.SendMessageRequest, callback?: (err: AWSError, data: SQS.Types.SendMessageResult) => void): any {
        return {
            promise: () => {
                return new Promise((resolve, reject) => {
                    const foundQueue = this.queues.find((queue) => queue.queueURL === params.QueueUrl);

                    if (foundQueue) {
                        foundQueue.queueMessages.push(params.MessageBody);
                        resolve({
                            MessageId: "mock"
                        });
                    }

                    reject(new Error(`Queue ${params.QueueUrl} was not found.`));
                });
            }
        };
    }

    /**
     * Get messages from the mock queue
     * @param params - ReceiveMessageRequest parameters
     * @param callback - optional callback function
     */
    public receiveMessage(params: SQS.Types.ReceiveMessageRequest, callback?: (err: AWSError, data: SQS.Types.ReceiveMessageResult) => void): any {
        return {
            promise: () => {
                return new Promise((resolve, reject) => {
                    const foundQueue = this.queues.find((queue) => queue.queueURL === params.QueueUrl);

                    if (foundQueue) {
                        resolve({ Messages: [{ Body: foundQueue.queueMessages }] });
                    }

                    reject(new Error(`Queue ${params.QueueUrl} was not found.`));
                });
            }
        };
    }

}

export {SQMockClient};
