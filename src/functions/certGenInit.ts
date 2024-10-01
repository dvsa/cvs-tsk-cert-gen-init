import { SQSClient } from "@aws-sdk/client-sqs";
import {
  Callback,
  Context,
  DynamoDBBatchItemFailure,
  DynamoDBBatchResponse,
  DynamoDBStreamEvent,
  Handler
} from "aws-lambda";
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
  event: DynamoDBStreamEvent,
  context?: Context,
  callback?: Callback
): Promise<DynamoDBBatchResponse> => {
  if (!event) {
    console.error("ERROR: event is not defined.");
    throw new Error("ERROR: event is not defined");
  }

  const batchItemFailures: DynamoDBBatchItemFailure[] = [];
  let expandedRecords: any[];
  let certGenFilteredRecords: any[];

  event.Records.forEach(async (record) => {
    try {
      expandedRecords = StreamService.getTestResultStream(record);
      console.log(`Number of Retrieved records: ${expandedRecords.length}`);

      certGenFilteredRecords =
        Utils.filterCertificateGenerationRecords(expandedRecords);
      console.log(
        `Number of Filtered Retrieved Records: ${certGenFilteredRecords.length}`
      );

      // Instantiate the Simple Queue Service
      const sqService: SQService = new SQService(new SQSClient());

      for (const record of certGenFilteredRecords) {
        const stringifiedRecord = JSON.stringify(record);
        console.log(stringifiedRecord);
        await sqService.sendCertGenMessage(stringifiedRecord);
      }

      console.log(`event ${record.dynamodb?.SequenceNumber} successfully processed`);
    } catch (err) {
      console.error(err);
      console.log("expandedRecords");
      console.log(JSON.stringify(expandedRecords));
      console.log("certGenFilteredRecords");
      console.log(JSON.stringify(certGenFilteredRecords));
      batchItemFailures.push({ itemIdentifier: record.dynamodb?.SequenceNumber ?? "" });
    }
  });

  return { batchItemFailures };
};

export { certGenInit };
