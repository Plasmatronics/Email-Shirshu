import dns from "node:dns/promises";
import type { MxRecord } from "node:dns";
import { beforeEach, describe, expect, test, vi } from "vitest";
import { MXRecordRetriever } from "./MXRecordRetriever.ts";

vi.mock("node:dns/promises", () => ({
	default: {
		resolveMx: vi.fn(),
	},
}));

const resolveMx = vi.mocked(dns.resolveMx);
const mxRecords: MxRecord[] = [
	{ exchange: "mx-6.example.com", priority: 60 },
	{ exchange: "mx-1.example.com", priority: 10 },
	{ exchange: "mx-4.example.com", priority: 40 },
	{ exchange: "mx-2.example.com", priority: 20 },
	{ exchange: "mx-5.example.com", priority: 50 },
	{ exchange: "mx-3.example.com", priority: 30 },
];

describe("MXRecordRetriever", () => {
	beforeEach(() => {
		resolveMx.mockReset();
		resolveMx.mockResolvedValue(mxRecords);
	});

	test("rejects an invalid email address", () => {
		expect(() => new MXRecordRetriever("not-an-email")).toThrow();
	});

	test("queries MX records for the recipient domain", async () => {
		const retriever = new MXRecordRetriever("user@example.com");

		await retriever.findMXRecords();

		expect(resolveMx).toHaveBeenCalledWith("example.com");
	});

	test("returns MX records in ascending priority order", async () => {
		const retriever = new MXRecordRetriever("user@example.com", 3);

		await expect(retriever.findMXRecords()).resolves.toEqual([
			"mx-1.example.com",
			"mx-2.example.com",
			"mx-3.example.com",
		]);
	});

	test.each([
		{ label: "the default", maxRecords: undefined, expectedCount: 3 },
		{ label: "zero", maxRecords: 0, expectedCount: 1 },
		{ label: "a negative value", maxRecords: -10, expectedCount: 1 },
		{ label: "a fractional value", maxRecords: 2.9, expectedCount: 2 },
		{ label: "NaN", maxRecords: Number.NaN, expectedCount: 3 },
		{ label: "positive infinity", maxRecords: Infinity, expectedCount: 5 },
		{ label: "negative infinity", maxRecords: -Infinity, expectedCount: 1 },
		{ label: "a value above the maximum", maxRecords: 10, expectedCount: 5 },
	])("normalizes $label record cap", async ({ maxRecords, expectedCount }) => {
		const retriever = new MXRecordRetriever("user@example.com", maxRecords);

		const records = await retriever.findMXRecords();

		expect(records).toHaveLength(expectedCount);
	});

	test("returns every available record when fewer exist than requested", async () => {
		resolveMx.mockResolvedValue(mxRecords.slice(0, 2));
		const retriever = new MXRecordRetriever("user@example.com", 5);

		const records = await retriever.findMXRecords();

		expect(records).toHaveLength(2);
	});

	test("rejects an empty MX response", async () => {
		resolveMx.mockResolvedValue([]);
		const retriever = new MXRecordRetriever("user@example.com");

		await expect(retriever.findMXRecords()).rejects.toThrow(
			"Could not find any MX Records for this domain.",
		);
	});

	test.each([
		{ label: "root-label exchange", exchange: "." },
		{ label: "empty exchange returned by Node DNS", exchange: "" },
	])("rejects a null MX response with $label", async ({ exchange }) => {
		resolveMx.mockResolvedValue([{ exchange, priority: 0 }]);
		const retriever = new MXRecordRetriever("user@example.com");

		await expect(retriever.findMXRecords()).rejects.toThrow(
			"Could not find any MX Records for this domain.",
		);
	});

	test("propagates DNS resolver failures", async () => {
		const dnsError = new Error("DNS lookup failed");
		resolveMx.mockRejectedValue(dnsError);
		const retriever = new MXRecordRetriever("user@example.com");

		await expect(retriever.findMXRecords()).rejects.toBe(dnsError);
	});
});
