import { beforeEach, describe, expect, test, vi } from "vitest";
import { SerperClient } from "./SerperClient";

const apiResponse = {
	organic: [
		{
			title: "Wonder",
			link: "https://wonder.com/",
			snippet: "Wonder's official website.",
			position: 1,
		},
	],
	peopleAlsoAsk: [],
	relatedSearches: [],
};

describe("SerperClient", () => {
	const post = vi.fn();

	beforeEach(() => {
		post.mockReset();
		post.mockResolvedValue(apiResponse);
	});

	test("sends the query and API key to Serper", async () => {
		const client = new SerperClient("test-api-key", { post });

		await client.search("OpenAI");

		expect(post).toHaveBeenCalledWith(
			"https://google.serper.dev/search",
			JSON.stringify({ q: "OpenAI" }),
			{
				"X-API-KEY": "test-api-key",
				"Content-Type": "application/json",
			},
		);
	});

	test("returns validated organic search results", async () => {
		const client = new SerperClient("test-api-key", { post });

		await expect(client.search("Wonder")).resolves.toEqual(apiResponse.organic);
	});

	test("rejects a malformed API response", async () => {
		post.mockResolvedValue({
			...apiResponse,
			organic: [{ link: "https://wonder.com/", position: 1 }],
		});
		const client = new SerperClient("test-api-key", { post });

		await expect(client.search("Wonder")).rejects.toThrow(
			"An error has occurred during web search",
		);
	});

	test("reports HTTP failures", async () => {
		post.mockRejectedValue(new Error("request failed"));
		const client = new SerperClient("test-api-key", { post });

		await expect(client.search("Wonder")).rejects.toThrow(
			"An error has occurred during web search: request failed",
		);
	});
});
