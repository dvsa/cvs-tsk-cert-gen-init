import { DynamoDBRecord } from "aws-lambda";
import { DynamoDB } from "aws-sdk";

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
  public static getTestResultStream(event: any) {
    // Create from a test result with multiple test types, multiple test result with one test type each
    const records: any[] = event.Records.filter((record: DynamoDBRecord) => {
      // Retrieve "INSERT" events
      return record.eventName === "INSERT" || record.eventName === "MODIFY";
    }).map((record: DynamoDBRecord) => {
      // Convert to JS object
      if (record.dynamodb && record.dynamodb.NewImage) {
        return DynamoDB.Converter.unmarshall(record.dynamodb.NewImage);
      }
    });

    return StreamService.expandRecords(records);
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

        record.testTypes.forEach((testType: any, i: number, array: any[]) => {
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
        });

        return splittedRecords;
      })
      .reduce((acc: any[], val: any) => acc.concat(val), []); // Flatten the array
  }
}

export { StreamService };
