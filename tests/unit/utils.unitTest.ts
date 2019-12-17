import {Utils} from "../../src/utils/Utils";
import {StreamService} from "../../src/services/StreamService";
import * as event from "../resources/stream-event.json";

describe("utils", () => {
    let expandedRecords: any[];

    beforeEach(() => {
        expandedRecords = StreamService.getTestResultStream(event);
    });

    afterAll(() => {
        jest.restoreAllMocks();
        jest.resetModuleRegistry();
    });

    describe("when filtering dynamoDB streams events", () => {

        it("should filter correctly cancelled tests", async () => {
            expandedRecords[0].testStatus = "cancelled";
            const filteredRecords: any[] = Utils.filterCertificateGenerationRecords(expandedRecords);

            expect(filteredRecords.length).toBe(0);
        });

        it("should not remove events which have to generate a certificate", async () => {
            const filteredRecords: any[] = Utils.filterCertificateGenerationRecords(expandedRecords);

            expect(filteredRecords).toEqual(expandedRecords);
        });

        it("should filter correctly events without a testTypeClassification ", async () => {
            delete expandedRecords[0].testTypes.testTypeClassification;
            const filteredRecords: any[] = Utils.filterCertificateGenerationRecords(expandedRecords);

            expect(filteredRecords.length).toBe(0);
        });
    });
});
