// import { DynamoDB } from "aws-sdk";
import { unmarshall } from "@aws-sdk/util-dynamodb";
import { DynamoDBRecord } from "aws-lambda";

/**
 * Service class for interpreting and formatting
 * incoming DynamoDB streams
 */
class StreamService {
  /**
   * Extract INSERT events from the DynamoDB Stream, convert them
   * to a JS object and expand the test results into multiple ones for each test type
   * Example:
   * Convert
   * test-result
   *  ├── test-type-1
   *  ├── test-type-2
   *  └── test-type-3
   *  into
   *  test-result
   *  └── test-type-1
   *  test-result
   *  └── test-type-2
   *  test-result
   *  └── test-type-3
   * @param event
   */
  public static getTestResultStream(record: DynamoDBRecord) {
    console.log(record);
    let records = [];
    // Create from a test result with multiple test types, multiple test result with one test type each
    if (
      record.eventName === "INSERT" ||
      (record.eventName === "MODIFY" &&
        StreamService.isProcessModifyEventsEnabled())
    ) {
      if (record.dynamodb && record.dynamodb.NewImage) {
        const unmarshalledRecord = unmarshall(
          (record as any).dynamodb.NewImage
        );
        records = StreamService.expandRecords([unmarshalledRecord]);
      }
    } else {
      console.log("event name was not of correct type");
    }
    return records;
  }

  /**
   * Returns true or false as a boolean based on PROCESS_MODIFY_EVENTS, if
   * it is not a valid value then it should throw an error
   */
  private static isProcessModifyEventsEnabled(): boolean {
    if (
      process.env.PROCESS_MODIFY_EVENTS !== "true" &&
      process.env.PROCESS_MODIFY_EVENTS !== "false"
    ) {
      throw Error(
        "PROCESS_MODIFY_EVENTS environment variable must be true or false"
      );
    }
    return process.env.PROCESS_MODIFY_EVENTS === "true";
  }

  /**
   * Helper method for expanding a single record with multiple test types
   * into multiple records with a single test type
   * @param records
   */
  private static expandRecords(records: any): any[] {
    return records
      .map((record: any) => {
        // Separate each test type in a record to form multiple records
        const splittedRecords: any[] = [];
        const templateRecord: any = Object.assign({}, record);
        Object.assign(templateRecord, {});
        console.log("before for each");
        if (record.testTypes instanceof Array) {
          record.testTypes?.forEach(
            (testType: any, i: number, array: any[]) => {
              console.log("in for each");
              const clonedRecord: any = Object.assign({}, templateRecord); // Create record from template
              Object.assign(clonedRecord, { testTypes: testType }); // Assign it the test type
              Object.assign(clonedRecord, {
                // Assign certificate order number
                order: {
                  current: i + 1,
                  total: array.length,
                },
              });

              splittedRecords.push(clonedRecord);
            }
          );
        }

        console.log("after for each");
        return splittedRecords;
      })
      .reduce((acc: any[], val: any) => acc.concat(val), []); // Flatten the array
  }
}

export { StreamService };
