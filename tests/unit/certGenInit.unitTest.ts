import {
  CreateQueueCommand,
  DeleteQueueCommand,
  GetQueueUrlCommand,
  ReceiveMessageCommand,
  ReceiveMessageCommandOutput,
  SQSClient,
  SendMessageCommand,
  SendMessageCommandOutput,
} from "@aws-sdk/client-sqs";
import { marshall, unmarshall } from "@aws-sdk/util-dynamodb";
import { DynamoDBRecord } from "aws-lambda";
import { mockClient } from "aws-sdk-client-mock";
import { Injector } from "../../src/models/injector/Injector";
import { SQService } from "../../src/services/SQService";
import { StreamService } from "../../src/services/StreamService";
import { Configuration } from "../../src/utils/Configuration";
import { SQMockClient } from "../models/SQMockClient";
import event from "../resources/stream-event.json";

const record = {
  testerStaffId: "1",
  testStartTimestamp: "2019-01-21T10:36:33.987Z",
  odometerReadingUnits: "kilometres",
  order: {
    current: 1,
    total: 1,
  },
  testEndTimestamp: "2019-01-21T10:37:33.987Z",
  testStatus: "submitted",
  testTypes: {
    testTypeClassification: "Annual With Certificate",
    prohibitionIssued: false,
    certificateNumber: "1234",
    testCode: "aas",
    lastUpdatedAt: "2019-02-21T12:06:29.194Z",
    additionalCommentsForAbandon: "none",
    numberOfSeatbeltsFitted: 2,
    testTypeEndTimestamp: "2019-01-14T10:36:33.987Z",
    reasonForAbandoning: "none",
    lastSeatbeltInstallationCheckDate: "2019-01-14",
    createdAt: "2019-02-21T12:06:29.194Z",
    testTypeId: "1",
    testTypeStartTimestamp: "2019-01-14T10:36:33.987Z",
    testTypeName: "Annual test",
    seatbeltInstallationCheckDate: true,
    additionalNotesRecorded: "VEHICLE FRONT REGISTRATION PLATE MISSING",
    defects: [
      {
        additionalInformation: {
          location: {
            axleNumber: null,
            horizontal: null,
            lateral: null,
            longitudinal: "front",
            rowNumber: null,
            seatNumber: null,
            vertical: null,
          },
          notes: "None",
        },
        deficiencyCategory: "major",
        deficiencyId: "a",
        deficiencyRef: "1.1.a",
        deficiencySubId: null,
        deficiencyText: "missing.",
        imDescription: "Registration Plate",
        imNumber: 1,
        itemDescription: "A registration plate:",
        itemNumber: 1,
        prs: false,
        stdForProhibition: false,
      },
    ],
    name: "Annual test",
    certificateLink: "http://dvsagov.co.uk",
    testResult: "fail",
  },
  vehicleClass: {
    code: "2",
    description: "over 200cc or with a sidecar",
  },
  testResultId: "1",
  vehicleSize: "small",
  vin: "XMGDE02FS0H012345",
  testStationName: "Rowe, Wunsch and Wisoky",
  vehicleId: "JY58FPP",
  countryOfRegistration: "united kingdom",
  vehicleType: "psv",
  preparerId: "ak4434",
  preparerName: "Durrell Vehicles Limited",
  odometerReading: 100000,
  vehicleConfiguration: "rigid",
  testStationType: "gvts",
  reasonForCancellation: "none",
  testerName: "Dorel",
  vrm: "JY58FPP",
  testStationPNumber: "87-1369569",
  numberOfSeats: 45,
  testerEmailAddress: "dorel.popescu@dvsagov.uk",
  euVehicleCategory: "m1",
};
describe("cert-gen-init", () => {
  let processedEvent: any;

  context("StreamService", () => {
    const expectedResult: any[] = [record];

    context(
      "when fetching test result stream and the eventName is INSERT",
      () => {
        it("should result in an array of filtered js objects", () => {
          processedEvent = StreamService.getTestResultStream(
            event.Records[0] as DynamoDBRecord
          );
          expect(processedEvent).toEqual(expectedResult);
        });
      }
    );

    context(
      "when fetching test result stream and the eventName is MODIFY",
      () => {
        it("shouldn't result in an array of filtered js objects when PROCESS_MODIFY_EVENTS is false", () => {
          process.env.PROCESS_MODIFY_EVENTS = "false";
          event.Records[0].eventName = "MODIFY";
          processedEvent = StreamService.getTestResultStream(
            event.Records[0] as DynamoDBRecord
          );
          expect(processedEvent).toHaveLength(0);
        });

        it("should result in an array of filtered js objects when PROCESS_MODIFY_EVENTS is true", () => {
          process.env.PROCESS_MODIFY_EVENTS = "true";
          event.Records[0].eventName = "MODIFY";
          processedEvent = StreamService.getTestResultStream(
            event.Records[0] as DynamoDBRecord
          );
          expect(processedEvent).toHaveLength(1);
          expect(processedEvent).toEqual(expectedResult);
        });

        it("should result in an empty array when the test type is an object", () => {
          process.env.PROCESS_MODIFY_EVENTS = "true";
          const eventWithTestTypeObject = unmarshall(
            { ...event }.Records[0].dynamodb.NewImage
          );
          eventWithTestTypeObject.testTypes = {};
          event.Records[0].eventName = "MODIFY";
          const mainEvent = { ...event };
          mainEvent.Records[0].dynamodb.NewImage = marshall(
            eventWithTestTypeObject
          ) as any;
          processedEvent = StreamService.getTestResultStream(
            mainEvent.Records[0] as DynamoDBRecord
          );
          expect(processedEvent).toEqual([]);
        });

        it("should throw an error if PROCESS_MODIFY_EVENTS is not true or false", () => {
          process.env.PROCESS_MODIFY_EVENTS = "";
          event.Records[0].eventName = "MODIFY";
          expect(() => {
            StreamService.getTestResultStream(
              event.Records[0] as DynamoDBRecord
            );
          }).toThrowError();
        });
      }
    );
  });

  context("SQService", () => {
    const client = mockClient(SQSClient);
    const mock = new SQMockClient();
    const sqService = new SQService(client as unknown as SQSClient);
    const config = Configuration.getInstance().getConfig();
    mock.createQueue({ QueueName: config.sqs.local.queueName[0] });
    beforeEach(() => {
      // client.reset();
      client
        .on(GetQueueUrlCommand)
        .resolves(mock.getQueueUrl(config.sqs.local.queueName[0]));
      client
        .on(SendMessageCommand)
        .resolves(
          mock.sendMessage({
            QueueUrl: config.sqs.local.queueName[0],
            MessageBody: JSON.stringify(record),
          })
        )
        .on(ReceiveMessageCommand)
        .resolves(
          mock.receiveMessage({ QueueUrl: config.sqs.local.queueName[0] })
        );
    });
    context("when adding a record to the queue", () => {
      context("and the queue does not exist", () => {
        it("should successfully add the records to the certGen queue", () => {
          const sendMessagePromises: Array<
            Promise<any | SendMessageCommandOutput>
          > = [];
          processedEvent.forEach(async (record: any) => {
            sendMessagePromises.push(
              sqService.sendCertGenMessage(JSON.stringify(record))
            );
          });
          return Promise.all(sendMessagePromises).catch((error: any) => {
            expect(error).toBeInstanceOf(Error);
            expect(error.message).toEqual("Queue cert-gen-q was not found.");
          });
        });

        it("should fail to read any records from the queue", () => {
          return sqService.getMessages().catch((error: any) => {
            expect(error).toBeInstanceOf(Error);
            expect(error.message).toEqual("Queue cert-gen-q was not found.");
          });
        });
      });

      context("and the queue does exist", () => {
        it("should successfully add the records to the certGen queue", () => {
          const sendMessagePromises: Array<Promise<any>> = [];
          sqService.sqsClient.send(
            new CreateQueueCommand({
              QueueName: "cert-gen-q",
            })
          );

          processedEvent.forEach(async (record: any) => {
            sendMessagePromises.push(
              sqService.sendCertGenMessage(JSON.stringify(record))
            );
          });

          expect.assertions(0);
          return Promise.all(sendMessagePromises).catch((error: any) => {
            console.error(error);
            expect(error).toBeFalsy();
          });
        });

        it("should successfully read the added records from the queue", async () => {
          return sqService
            .getMessages()
            .then((messages: ReceiveMessageCommandOutput) => {
              expect(
                messages.Messages?.map((message) =>
                  JSON.parse(message.Body as string)
                )
              ).toEqual(processedEvent);
              sqService.sqsClient.send(
                new DeleteQueueCommand({
                  QueueUrl: "sqs://queue/cert-gen-q",
                })
              );
            })
            .catch((error) => {
              console.log(error);
            });
        });

        it("should log an error when SQS config is not defined", () => {
          const logSpy = jest.spyOn(console, "error");
          Configuration.prototype.getConfig = jest
            .fn()
            .mockReturnValue({ sqs: undefined });

          try {
            Injector.resolve<SQService>(SQService, [SQMockClient]);
            expect(logSpy).toHaveBeenCalledTimes(1);
            expect(logSpy).toHaveBeenCalledWith(
              "SQS config is not defined in the config file."
            );
          } catch (error) {
            // do nothing
          }

          logSpy.mockClear();
          jest.clearAllMocks();
        });
      });
    });
  });
});
