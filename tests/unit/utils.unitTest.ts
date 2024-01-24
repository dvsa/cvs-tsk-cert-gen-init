import { StreamService } from "../../src/services/StreamService";
import { Utils } from "../../src/utils/Utils";
import * as event from "../resources/stream-event.json";

describe("utils", () => {
  let expandedRecords: any[];

  beforeEach(() => {
    expandedRecords = StreamService.getTestResultStream(event);
  });

  afterAll(() => {
    jest.restoreAllMocks();
    jest.resetModules();
  });

  describe("when filtering dynamoDB streams events", () => {
    it("should filter correctly cancelled tests", async () => {
      expandedRecords[0].testStatus = "cancelled";
      const filteredRecords: any[] =
        Utils.filterCertificateGenerationRecords(expandedRecords);

      expect(filteredRecords.length).toBe(0);
    });

    it("should filter correctly abandoned testTypes", async () => {
      console.log(expandedRecords[0]);
      expandedRecords[0].testTypes.testResult = "abandoned";
      const filteredRecords: any[] =
        Utils.filterCertificateGenerationRecords(expandedRecords);

      expect(filteredRecords.length).toBe(0);
    });

    it("should not remove events which have to generate a certificate", async () => {
      const filteredRecords: any[] =
        Utils.filterCertificateGenerationRecords(expandedRecords);

      expect(filteredRecords).toEqual(expandedRecords);
    });

    it("should filter correctly events without a testTypeClassification ", async () => {
      delete expandedRecords[0].testTypes.testTypeClassification;
      const filteredRecords: any[] =
        Utils.filterCertificateGenerationRecords(expandedRecords);

      expect(filteredRecords.length).toBe(0);
    });

    it("should filter correctly events that have IVA With Certificate, ivaDefects populated but not test result fail", async () => {
      expandedRecords[0].testTypes.testTypeClassification = "IVA With Certificate";
      expandedRecords[0].testTypes.ivaDefects = [{}];
      expandedRecords[0].testTypes.testResult = "pass";
      const filteredRecords: any[] = Utils.filterCertificateGenerationRecords(expandedRecords);

      expect(filteredRecords.length).toBe(0);
    });

    it("should filter correctly events that have IVA With Certificate, test result fail but no ivaDefects", async () => {
        expandedRecords[0].testTypes.testTypeClassification = "IVA With Certificate";
        expandedRecords[0].testTypes.testResult = "fail";
        const filteredRecords: any[] = Utils.filterCertificateGenerationRecords(expandedRecords);

        expect(filteredRecords.length).toBe(0);
    });

    it("should filter correctly events that have IVA With Certificate, test result fail but empty ivaDefects", async () => {
        expandedRecords[0].testTypes.testTypeClassification = "IVA With Certificate";
        expandedRecords[0].testTypes.testResult = "fail";
        expandedRecords[0].testTypes.ivaDefects = [];
        const filteredRecords: any[] = Utils.filterCertificateGenerationRecords(expandedRecords);

        expect(filteredRecords.length).toBe(0);
    });

    it("should not remove events which have IVA With Certificate, ivaDefects and test result fail", async () => {
      expandedRecords[0].testTypes.testTypeClassification = "IVA With Certificate";
      expandedRecords[0].testTypes.testResult = "fail";
      expandedRecords[0].testTypes.ivaDefects = [{}];
      const filteredRecords: any[] = Utils.filterCertificateGenerationRecords(expandedRecords);

      expect(filteredRecords).toEqual(expandedRecords);
    });

    it("should not remove events which have Annual With Certificate, no ivaDefects and test result fail", async () => {
        expandedRecords[0].testTypes.testResult = "fail";
        const filteredRecords: any[] = Utils.filterCertificateGenerationRecords(expandedRecords);

        expect(filteredRecords).toEqual(expandedRecords);
    });

    it("should not remove events which have Annual With Certificate, empty ivaDefects and test result fail", async () => {
        expandedRecords[0].testTypes.ivaDefects = [];
        expandedRecords[0].testTypes.testResult = "fail";
        const filteredRecords: any[] = Utils.filterCertificateGenerationRecords(expandedRecords);

        expect(filteredRecords).toEqual(expandedRecords);
    });

    it("should not remove events which have Annual With Certificate, populated ivaDefects and test result fail", async () => {
        expandedRecords[0].testTypes.ivaDefects = [{}];
        expandedRecords[0].testTypes.testResult = "fail";
        const filteredRecords: any[] = Utils.filterCertificateGenerationRecords(expandedRecords);

        expect(filteredRecords).toEqual(expandedRecords);
    });
  });
});
