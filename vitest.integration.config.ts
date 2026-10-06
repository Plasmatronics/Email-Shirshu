import { configDefaults, defineConfig } from "vitest/config";

export default defineConfig({
	test: {
		include: [...configDefaults.include, "**/*.integration.test.ts"],
		clearMocks: true,
	},
});

