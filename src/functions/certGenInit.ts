import {Callback, Context, Handler} from "aws-lambda";
import {AWSError, SQS} from "aws-sdk";
import {SQService} from "../services/SQService";
import {PromiseResult} from "aws-sdk/lib/request";
import {SendMessageResult} from "aws-sdk/clients/sqs";
import {StreamService} from "../services/StreamService";

/**
 * λ function to process a DynamoDB stream of test results into a queue for certificate generation.
 * @param event - DynamoDB Stream event
 * @param context - λ Context
 * @param callback - callback function
 */
const certGenInit: Handler = async (event: any, context?: Context, callback?: Callback): Promise<void | Array<PromiseResult<SendMessageResult, AWSError>>> => {
    if (!event) {
        console.error("ERROR: event is not defined.");
        return;
    }

    // Convert the received event into a readable array of filtered test results
    const records: any[] = StreamService.getTestResultStream(event);

    // Instantiate the Simple Queue Service
    const sqService: SQService = new SQService(new SQS());
    const sendMessagePromises: Array<Promise<PromiseResult<SendMessageResult, AWSError>>> = [];

    // Add each record to the queue
    records.forEach(async (record: any) => {
        sendMessagePromises.push(sqService.sendMessage(JSON.stringify(record)));
    });

    return Promise.all(sendMessagePromises)
    .catch((error: AWSError) => {
        console.error(error);
        throw error;
    });
};

export {certGenInit};
