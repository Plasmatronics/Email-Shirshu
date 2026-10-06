import { configDefaults, defineConfig } from "vitest/config";

export default defineConfig({
	test: {
		include: [...configDefaults.exclude, "**/*.integration.test.ts"],
		clearMocks: true,
	},
});

