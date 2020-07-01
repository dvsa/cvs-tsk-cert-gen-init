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
const certGenInit: Handler = async (
  event: any,
  context?: Context,
  callback?: Callback
): Promise<void | Array<PromiseResult<SendMessageResult, AWSError>>> => {
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
  const sqService: SQService = new SQService(new SQS());
  const sendMessagePromises: Array<Promise<
    PromiseResult<SendMessageResult, AWSError>
  >> = [];

  certGenFilteredRecords.forEach((record: any) => {
    try {
      sendMessagePromises.push(
        sqService.sendCertGenMessage(JSON.stringify(record))
      );
    } catch (error) {
      console.log("failed on forEach for certGenFilteredRecords");
      console.log(record);
      throw error;
    }
  });

  expandedRecords.forEach((record: any) => {
    try {
      sendMessagePromises.push(
        sqService.sendUpdateStatusMessage(JSON.stringify(record))
      );
    } catch (error) {
      console.log("failed on forEach for expandedRecords");
      console.log(record);
      throw error;
    }
  });

  return Promise.all(sendMessagePromises).catch((error: AWSError) => {
    console.error(error);
    console.log("expandedRecords");
    console.log(expandedRecords);
    console.log("certGenFilteredRecords");
    console.log(certGenFilteredRecords);
    throw error;
  });
};

export { certGenInit };
