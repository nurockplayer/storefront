import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
	testDir: "./tests/e2e",
	timeout: 30_000,
	expect: {
		timeout: 5_000,
	},
	use: {
		baseURL: "http://127.0.0.1:3000",
		trace: "on-first-retry",
	},
	webServer: {
		command: "pnpm exec next dev --webpack --hostname 127.0.0.1 --port 3000",
		url: "http://127.0.0.1:3000",
		reuseExistingServer: !process.env.CI,
		timeout: 120_000,
		env: {
			NEXT_PUBLIC_SALEOR_API_URL: "https://storefront1.saleor.cloud/graphql/",
			NEXT_PUBLIC_STOREFRONT_URL: "http://localhost:3000",
			NEXT_PUBLIC_DEFAULT_CHANNEL: "default-channel",
			NEXT_TELEMETRY_DISABLED: "1",
			TACHIYA_API_URL: "",
			TACHIYA_INTERNAL_SHARED_SECRET: "",
		},
	},
	projects: [
		{
			name: "chromium",
			use: { ...devices["Desktop Chrome"] },
		},
	],
});
