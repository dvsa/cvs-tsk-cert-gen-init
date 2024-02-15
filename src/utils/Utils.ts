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

        const isAnnualWithCertificate = testTypes?.testTypeClassification === "Annual With Certificate";
        const isIvaWithCertificate = testTypes?.testTypeClassification === "IVA With Certificate";
        const isTestResultFail = testTypes?.testResult === "fail";
        const hasNonEmptyRequiredStandards = !!(testTypes?.requiredStandards?.length);

        return isAnnualWithCertificate || (isIvaWithCertificate && isTestResultFail && hasNonEmptyRequiredStandards);
      });
  }
}
