import {certGenInit} from "../../src/functions/certGenInit";
import mockContext from "aws-lambda-mock-context";
import {SQService} from "../../src/services/SQService";
import {StreamService} from "../../src/services/StreamService";
import {Utils} from "../../src/utils/Utils";


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
        const result = await certGenInit(undefined, ctx, () => { return; });
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
      SQService.prototype.sendUpdateStatusMessage = jest.fn();
      StreamService.getTestResultStream = jest.fn().mockReturnValue([{test: "thing"}]);
      Utils.filterCertificateGenerationRecords = jest.fn().mockReturnValue([{test: "thing"}]);

      try {
      await certGenInit({}, ctx, () => { return; });
      } catch (e) {
        console.log(e);
      }
      expect(sendCertGenMessage).toHaveBeenCalledWith(JSON.stringify({test: "thing"}));
      expect(sendCertGenMessage).toHaveBeenCalledTimes(1);
    });
  });

  describe("when SQService throws error", () => {
    it("should throw error", async () => {
      StreamService.getTestResultStream = jest.fn().mockReturnValue([{}]);
      const myError = new Error("It Broke!");
      SQService.prototype.sendCertGenMessage = jest.fn().mockRejectedValue(myError);
      SQService.prototype.sendUpdateStatusMessage = jest.fn();
      StreamService.getTestResultStream = jest.fn().mockReturnValue([{test: "thing"}]);
      Utils.filterCertificateGenerationRecords = jest.fn().mockReturnValue([{test: "thing"}]);


      expect.assertions(1);
      try {
        await certGenInit({}, ctx, () => { return; });
      } catch (e) {
        expect(e.message).toEqual(myError.message);
      }
    });
  });
});
