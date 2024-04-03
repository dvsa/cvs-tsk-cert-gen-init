import { SQS, SQSServiceException, SendMessageCommandOutput } from "@aws-sdk/client-sqs";
import { Callback, Context, Handler } from "aws-lambda";
import { SQService } from "../services/SQService";
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
): Promise<void | Array<SendMessageCommandOutput | SQSServiceException>> => {
  if (!event) {
    console.error("ERROR: event is not defined.");
    return;
  }

  // Convert the received event into a readable array of filtered test results
  const expandedRecords: any[] = StreamService.getTestResultStream(event);
  const certGenFilteredRecords: any[] =
    Utils.filterCertificateGenerationRecords(expandedRecords);

  // Instantiate the Simple Queue Service
  const sqService: SQService = new SQService(new SQS());
  const sendMessagePromises: Array<
    Promise<SendMessageCommandOutput | SQSServiceException>
  > = [];

  certGenFilteredRecords.forEach((record: any) => {
    sendMessagePromises.push(
      sqService.sendCertGenMessage(JSON.stringify(record))
    );
  });

  return Promise.all(sendMessagePromises).catch((error: any) => {
    console.error(error);
    console.log("expandedRecords");
    console.log(JSON.stringify(expandedRecords));
    console.log("certGenFilteredRecords");
    console.log(JSON.stringify(certGenFilteredRecords));
    if (error.message !== "InvalidParameterValue") {
      throw error;
    }
  });
};

export { certGenInit };
