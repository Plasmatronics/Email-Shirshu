import { describe, expect, test } from "vitest";
import {
	MIN_RECORDS,
	MXRecordRetriever,
	NUM_RECORDS_DEFAULT,
} from "./MXRecordRetriever.ts";

describe("MXRecordRetriever integration", () => {
	test("resolves live MX records for a mail-enabled domain", async () => {
		const retriever = new MXRecordRetriever("user@gmail.com");

		const records = await retriever.findMXRecords();

		expect(records.length).toBeGreaterThanOrEqual(MIN_RECORDS);
		expect(records.length).toBeLessThanOrEqual(NUM_RECORDS_DEFAULT);
		expect(records.every((record) => record.length > 0)).toBe(true);
	});

	test("rejects a domain that publishes a null MX record", async () => {
		const retriever = new MXRecordRetriever(
			"user@thisIsASuperObviouslyFakeDomainNameForEmailSniffersIntegreationTest.com",
		);

		await expect(retriever.findMXRecords()).rejects.toThrow(
			"Could not find any MX Records for this domain.",
		);
	});
});
