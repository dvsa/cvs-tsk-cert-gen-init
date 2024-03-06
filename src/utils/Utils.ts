/**
 * Utils functions
 */
export class Utils {
  /**
   * Filter records to be sent to SQS
   * @param records
   */
  public static filterCertificateGenerationRecords(records: any[]) {
    return records
      .filter((record: any) => {
        // Filter by testStatus
        return record.testStatus === "submitted";
      })
      .filter((record: any) => {
        // Filter by testResult (abandoned tests are not allowed)
        return (
          record.testTypes.testResult === "pass" ||
          record.testTypes.testResult === "fail" ||
          record.testTypes.testResult === "prs"
        );
      })
      .filter((record: any) => {
        // Filter by testTypeClassification or testTypeClassification, testResult and requiredStandards present and populated
        const testTypes = record.testTypes;

        const { testTypeClassification, testResult, requiredStandards } =
          record.testTypes;
        const isTestResultFail = testResult === "fail";
        const hasNonEmptyRequiredStandards = !!requiredStandards?.length;

        const isAnnualWithCertificate =
          testTypeClassification === "Annual With Certificate";
        const isIvaWithCertificate =
          testTypeClassification === "IVA With Certificate" &&
          isTestResultFail &&
          hasNonEmptyRequiredStandards;
        const isMsvaWithCertificate =
          testTypeClassification === "MSVA With Certificate" &&
          isTestResultFail &&
          hasNonEmptyRequiredStandards;

        return (
          isAnnualWithCertificate ||
          isIvaWithCertificate ||
          isMsvaWithCertificate
        );
      });
  }
}
