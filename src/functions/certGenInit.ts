import { Callback, Context, Handler } from "aws-lambda";
import { AWSError, SQS } from "aws-sdk";
import { SQService } from "../services/SQService";
import { PromiseResult } from "aws-sdk/lib/request";
import { SendMessageResult } from "aws-sdk/clients/sqs";
import { StreamService } from "../services/StreamService";
import { Utils } from "../utils/Utils";

/**
 * λ function to process a DynamoDB stream of test results into a queue for certificate generation.
 * @param event - DynamoDB Stream event
 * @param context - λ Context
 * @param callback - callback function
 */
const certGenInit: Handler = async (event: any, context?: Context, callback?: Callback):
Promise<void | Array<PromiseResult<SendMessageResult, AWSError>>> => {
  if (!event) {
    console.error("ERROR: event is not defined.");
    return;
  }

  // Convert the received event into a readable array of filtered test results
  const expandedRecords: any[] = StreamService.getTestResultStream(event);
  const certGenFilteredRecords: any[] = Utils.filterCertificateGenerationRecords(
    expandedRecords
  );

  // Instantiate the Simple Queue Service
  // const sqService: SQService = new SQService(new SQS());
  console.log(process.env);
  console.log("process.env");
  const sqsQueue = new SQS({
    endpoint: `http://${process.env.LOCALSTACK_HOSTNAME}:4566`,
    region: "eu-west-1",
    apiVersion: "2012-11-05"

  });
  const sqService: SQService = new SQService(sqsQueue);
  const sendMessagePromises: Array<Promise<PromiseResult<SendMessageResult, AWSError>>> = [];

  certGenFilteredRecords.forEach((record: any) => {
      sendMessagePromises.push(
        sqService.sendCertGenMessage(JSON.stringify(record))
      );
  });

  expandedRecords.forEach((record: any) => {
      sendMessagePromises.push(
        sqService.sendUpdateStatusMessage(JSON.stringify(record))
      );

  });

  return Promise.all(sendMessagePromises).catch((error: AWSError) => {
    console.error(error);
    console.log("expandedRecords");
    console.log(JSON.stringify(expandedRecords));
    console.log("certGenFilteredRecords");
    console.log(JSON.stringify(certGenFilteredRecords));
    if (error.code !== "InvalidParameterValue") {
        throw error;
    }
  });
};

export { certGenInit };
