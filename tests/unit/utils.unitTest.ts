import { DynamoDBRecord } from "aws-lambda";
import { StreamService } from "../../src/services/StreamService";
import { Utils } from "../../src/utils/Utils";
import * as event from "../resources/stream-event.json";

describe("utils", () => {
  let expandedRecords: any[];

  beforeEach(() => {
    expandedRecords = StreamService.getTestResultStream(
      event.Records[0] as DynamoDBRecord
    );
  });

  afterAll(() => {
    jest.restoreAllMocks();
    jest.resetModules();
  });

  describe("when filtering dynamoDB streams events", () => {
    it("should filter correctly cancelled tests", () => {
      expandedRecords[0].testStatus = "cancelled";
      const filteredRecords: any[] =
        Utils.filterCertificateGenerationRecords(expandedRecords);

      expect(filteredRecords.length).toBe(0);
    });

    it("should filter correctly abandoned testTypes", () => {
      console.log(expandedRecords[0]);
      expandedRecords[0].testTypes.testResult = "abandoned";
      const filteredRecords: any[] =
        Utils.filterCertificateGenerationRecords(expandedRecords);

      expect(filteredRecords.length).toBe(0);
    });

    it("should not remove events which have to generate a certificate", () => {
      const filteredRecords: any[] =
        Utils.filterCertificateGenerationRecords(expandedRecords);

      expect(filteredRecords).toEqual(expandedRecords);
    });

    it("should filter correctly events without a testTypeClassification ", () => {
      delete expandedRecords[0].testTypes.testTypeClassification;
      const filteredRecords: any[] =
        Utils.filterCertificateGenerationRecords(expandedRecords);

      expect(filteredRecords.length).toBe(0);
    });

    it("should filter correctly events that have IVA With Certificate, requiredStandards populated but not test result fail", () => {
      expandedRecords[0].testTypes.testTypeClassification =
        "IVA With Certificate";
      expandedRecords[0].testTypes.requiredStandards = [{}];
      expandedRecords[0].testTypes.testResult = "pass";
      const filteredRecords: any[] =
        Utils.filterCertificateGenerationRecords(expandedRecords);

      expect(filteredRecords.length).toBe(0);
    });

    it("should filter correctly events that have IVA With Certificate, test result fail but no requiredStandards", () => {
      expandedRecords[0].testTypes.testTypeClassification =
        "IVA With Certificate";
      expandedRecords[0].testTypes.testResult = "fail";
      const filteredRecords: any[] =
        Utils.filterCertificateGenerationRecords(expandedRecords);

      expect(filteredRecords.length).toBe(0);
    });

    it("should filter correctly events that have IVA With Certificate, test result fail but empty requiredStandards", () => {
      expandedRecords[0].testTypes.testTypeClassification =
        "IVA With Certificate";
      expandedRecords[0].testTypes.testResult = "fail";
      expandedRecords[0].testTypes.requiredStandards = [];
      const filteredRecords: any[] =
        Utils.filterCertificateGenerationRecords(expandedRecords);

      expect(filteredRecords.length).toBe(0);
    });

    it("should not remove events which have IVA With Certificate, requiredStandards and test result fail", () => {
      expandedRecords[0].testTypes.testTypeClassification =
        "IVA With Certificate";
      expandedRecords[0].testTypes.testResult = "fail";
      expandedRecords[0].testTypes.requiredStandards = [{}];
      const filteredRecords: any[] =
        Utils.filterCertificateGenerationRecords(expandedRecords);

      expect(filteredRecords).toEqual(expandedRecords);
    });

    it("should not remove events which have Annual With Certificate, no requiredStandards and test result fail", () => {
      expandedRecords[0].testTypes.testResult = "fail";
      const filteredRecords: any[] =
        Utils.filterCertificateGenerationRecords(expandedRecords);

      expect(filteredRecords).toEqual(expandedRecords);
    });

    it("should not remove events which have Annual With Certificate, empty requiredStandards and test result fail", () => {
      expandedRecords[0].testTypes.requiredStandards = [];
      expandedRecords[0].testTypes.testResult = "fail";
      const filteredRecords: any[] =
        Utils.filterCertificateGenerationRecords(expandedRecords);

      expect(filteredRecords).toEqual(expandedRecords);
    });

    it("should not remove events which have Annual With Certificate, populated requiredStandards and test result fail", () => {
      expandedRecords[0].testTypes.requiredStandards = [{}];
      expandedRecords[0].testTypes.testResult = "fail";
      const filteredRecords: any[] =
        Utils.filterCertificateGenerationRecords(expandedRecords);

      expect(filteredRecords).toEqual(expandedRecords);
    });

    it("should filter correctly events that have MSVA With Certificate, requiredStandards populated but not test result fail", () => {
      expandedRecords[0].testTypes.testTypeClassification =
        "MSVA With Certificate";
      expandedRecords[0].testTypes.requiredStandards = [{}];
      expandedRecords[0].testTypes.testResult = "pass";
      const filteredRecords: any[] =
        Utils.filterCertificateGenerationRecords(expandedRecords);

      expect(filteredRecords.length).toBe(0);
    });

    it("should filter correctly events that have MSVA With Certificate, test result fail but no requiredStandards", () => {
      expandedRecords[0].testTypes.testTypeClassification =
        "MSVA With Certificate";
      expandedRecords[0].testTypes.testResult = "fail";
      const filteredRecords: any[] =
        Utils.filterCertificateGenerationRecords(expandedRecords);

      expect(filteredRecords.length).toBe(0);
    });

    it("should filter correctly events that have MSVA With Certificate, test result fail but empty requiredStandards", () => {
      expandedRecords[0].testTypes.testTypeClassification =
        "MSVA With Certificate";
      expandedRecords[0].testTypes.testResult = "fail";
      expandedRecords[0].testTypes.requiredStandards = [];
      const filteredRecords: any[] =
        Utils.filterCertificateGenerationRecords(expandedRecords);

      expect(filteredRecords.length).toBe(0);
    });

    it("should not remove events which have MSVA With Certificate, requiredStandards and test result fail", () => {
      expandedRecords[0].testTypes.testTypeClassification =
        "MSVA With Certificate";
      expandedRecords[0].testTypes.testResult = "fail";
      expandedRecords[0].testTypes.requiredStandards = [{}];
      const filteredRecords: any[] =
        Utils.filterCertificateGenerationRecords(expandedRecords);

      expect(filteredRecords).toEqual(expandedRecords);
    });
  });
});
