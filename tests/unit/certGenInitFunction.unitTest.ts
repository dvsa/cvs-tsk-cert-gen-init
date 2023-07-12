import { certGenInit } from "../../src/functions/certGenInit";
import mockContext from "aws-lambda-mock-context";
import { SQService } from "../../src/services/SQService";
import { StreamService } from "../../src/services/StreamService";
import { Utils } from "../../src/utils/Utils";
import { AWSError } from "aws-sdk";

describe("certGenInit Function", () => {
  const ctx = mockContext();
  afterAll(() => {
    jest.restoreAllMocks();
    jest.resetModuleRegistry();
  });

  describe("if the event is undefined", () => {
    it("should return undefined", async () => {
      expect.assertions(1);
      try {
        const result = await certGenInit(undefined, ctx, () => {
          return;
        });
        expect(result).toBe(undefined);
      } catch (e) {
        console.log(e);
      }
    });
  });

  describe("with good event", () => {
    it("should invoke SQS service with correct params", async () => {
      const sendCertGenMessage = jest.fn();
      SQService.prototype.sendCertGenMessage = sendCertGenMessage;
      StreamService.getTestResultStream = jest
        .fn()
        .mockReturnValue([{ TestRecord: "updateStatusMessage" }]);
      Utils.filterCertificateGenerationRecords = jest
        .fn()
        .mockReturnValue([{ TestRecord: "certGenMessage" }]);

      try {
        await certGenInit({}, ctx, () => {
          return;
        });
      } catch (e) {
        console.log(e);
      }
      expect(sendCertGenMessage).toHaveBeenCalledWith(
        JSON.stringify({ TestRecord: "certGenMessage" })
      );
      expect(sendCertGenMessage).toHaveBeenCalledTimes(1);
    });
  });

  describe("when SQService throws error", () => {
    it("should throw error if code is not InvalidParameterValue", async () => {
      StreamService.getTestResultStream = jest.fn().mockReturnValue([{}]);
      const myError = new Error("It Broke!") as AWSError;
      myError.code = "SomeError";
      SQService.prototype.sendCertGenMessage = jest
        .fn()
        .mockRejectedValue(myError);
      StreamService.getTestResultStream = jest
        .fn()
        .mockReturnValue([{ test: "thing" }]);
      Utils.filterCertificateGenerationRecords = jest
        .fn()
        .mockReturnValue([{ test: "thing" }]);

      expect.assertions(2);
      try {
        await certGenInit({}, ctx, () => {
          return;
        });
      } catch (e: any) {
        expect(e.message).toEqual(myError.message);
        expect(e.code).toEqual(myError.code);
      }
    });
    it("should not throw error if code is InvalidParameterValue", async () => {
      StreamService.getTestResultStream = jest.fn().mockReturnValue([{}]);
      const myError = new Error("It Broke!") as AWSError;
      myError.code = "InvalidParameterValue";
      SQService.prototype.sendCertGenMessage = jest
        .fn()
        .mockRejectedValue(myError);
      StreamService.getTestResultStream = jest
        .fn()
        .mockReturnValue([{ test: "thing" }]);
      Utils.filterCertificateGenerationRecords = jest
        .fn()
        .mockReturnValue([{ test: "thing" }]);

      expect.assertions(1);
      try {
        const result = await certGenInit({}, ctx, () => {
          return;
        });
        expect(result).toBe({});
      } catch (e) {
        console.log(e);
      }
    });
  });
});
