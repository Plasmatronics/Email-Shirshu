import z from "zod";

export const SerperResult = z.object({
	title: z.string(),
	link: z.string(),
	date: z.string().optional(),
	snippet: z.string().optional(),
	position: z.number(),
});

export const SerperResponseSchema = z.object({
	organic: z.array(SerperResult),
});

export type WebSearchResult = z.infer<typeof SerperResult>;
