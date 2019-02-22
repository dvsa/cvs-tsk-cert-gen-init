import {DynamoDBRecord} from "aws-lambda";
import {DynamoDB} from "aws-sdk";

/**
 * Service class for interpreting and formatting
 * incoming DynamoDB streams
 */
class StreamService {

    /**
     * Extract INSERT events from the DynamoDB Stream, convert them
     * to a JS object, filter by testStatus, certificateNumber
     * and expand the test results into multiple ones for each test type
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
        const records: any[] = event.Records.filter((record: DynamoDBRecord) => { // Retrieve "INSERT" events
            return record.eventName === "INSERT";
        })
        .map((record: DynamoDBRecord) => { // Convert to JS object
            if (record.dynamodb && record.dynamodb.NewImage) {
                return DynamoDB.Converter.unmarshall(record.dynamodb.NewImage);
            }
        });

        const expandedRecords: any[] = StreamService.expandRecords(records);

        return expandedRecords
        .filter((record: any) => { // Filter by testStatus
            return record.testStatus === "submitted";
        })
        .filter((record: any) => { // Filter by testResult (abandoned tests are not allowed)
            return (record.testTypes.testResult === "pass" || record.testTypes.testResult === "fail" || record.testTypes.testResult === "prs");
        })
        .filter((record: any) => { // Filter by testTypeClassification
            if (record.testTypes && record.testTypes.testTypeClassification) {
                return record.testTypes.testTypeClassification === "Annual With Certificate";
            }

            return false;
        });
    }

    /**
     * Helper method for expanding a single record with multiple test types
     * into multiple records with a single test type
     * @param records
     */
    private static expandRecords(records: any): any[] {
        return records
        .map((record: any) => { // Separate each test type in a record to form multiple records
            const splittedRecords: any[] = [];
            const templateRecord: any = Object.assign({}, record);
            Object.assign(templateRecord, {});

            record.testTypes.forEach((testType: any, i: number, array: any[]) => {
                const clonedRecord: any = Object.assign({}, templateRecord); // Create record from template
                Object.assign(clonedRecord, { testTypes: testType }); // Assign it the test type
                Object.assign(clonedRecord, { // Assign certificate order number
                    order: {
                        current: i + 1,
                        total: array.length
                    }
                });

                splittedRecords.push(clonedRecord);
            });

            return splittedRecords;
        })
        .reduce((acc: any[], val: any) => acc.concat(val), []); // Flatten the array
    }

}

export {StreamService};
