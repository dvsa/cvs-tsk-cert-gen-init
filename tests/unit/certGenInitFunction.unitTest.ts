import { certGenInit } from "../../src/functions/certGenInit";
import { SQService } from "../../src/services/SQService";
import { StreamService } from "../../src/services/StreamService";
import { Utils } from "../../src/utils/Utils";

describe("certGenInit Function", () => {
  const ctx = "" as unknown as any;
  afterAll(() => {
    jest.restoreAllMocks();
    jest.resetModules();
  });

  describe("if the event is undefined", () => {
    it("should return undefined", async () => {
      expect.assertions(1);
      try {
        const result = await certGenInit(undefined, ctx, () => {
          return;
        });
      } catch (e: any) {
        expect(e.message).toBe("ERROR: event is not defined");
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
        await certGenInit({Records: ["this is an event"]}, ctx, () => {
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
      const myError = new Error("It Broke!") as any;
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

      expect.assertions(1);
      try {
        const returnedInfo = await certGenInit({Records: ["this is an event"]}, ctx, () => {
          return;
        });
        expect(returnedInfo.batchItemFailures.length).toBe(1);
      } catch (e: any) {
        throw e;
      }
    });
    it("should not throw error if code is InvalidParameterValue", async () => {
      StreamService.getTestResultStream = jest.fn().mockReturnValue([{}]);
      const myError = new Error("It Broke!") as any;
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
        const result = await certGenInit({Records: ["this is an event"]}, ctx, () => {
          return;
        });
        expect(result).toBe({});
      } catch (e) {
        console.log(e);
      }
    });
  });
});
