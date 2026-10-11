import { describe, expect, test } from "vitest";
import { SerperClient } from "./SerperClient";

const apiKey = process.env.SERPER_API_KEY;

describe("SerperClient integration", () => {
	test("returns live organic search results", async () => {
		if (!apiKey) throw new Error("SERPER_API_KEY is required");
		const client = new SerperClient(apiKey);

		const results = await client.search("Obama Foundation");

		expect(results.length).toBeGreaterThan(0);
	});
});
