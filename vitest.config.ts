import { defineConfig } from "vitest/config";
import path from "path";

export default defineConfig({
	test: {
		globals: true,
		environment: "node",
		include: ["src/**/*.test.ts", "src/**/*.test.tsx"],
		setupFiles: ["src/test/setup.ts"],
		coverage: {
			provider: "v8",
			include: [
				"src/app/api/auth/**/*.ts",
				"src/app/api/revalidate/route.ts",
				"src/checkout/lib/tachiya-coupons.ts",
				"src/checkout/views/saleor-checkout/confirmation-reference.ts",
				"src/checkout/views/saleor-checkout/flow.ts",
				"src/checkout/views/saleor-checkout/mobile-sticky-action.tsx",
				"src/i18n/routing.ts",
				"src/lib/tachiya-*.ts",
				"src/ui/components/account/points-balance*.{ts,tsx}",
				"src/ui/components/cart/actions.ts",
				"src/ui/components/nav/components/fixed-nav-links.ts",
				"src/ui/components/pdp/variant-selection/utils.ts",
				"src/ui/components/plp/filter-utils.ts",
			],
			exclude: [
				"src/**/*.test.{ts,tsx}",
				"src/**/*.d.ts",
				"src/gql/**",
				"src/checkout/graphql/**",
				"src/_reference/**",
				"src/**/loading.tsx",
				"src/**/not-found.tsx",
			],
			thresholds: {
				lines: 80,
				functions: 75,
				branches: 70,
				statements: 80,
			},
		},
	},
	resolve: {
		alias: {
			"@": path.resolve(__dirname, "./src"),
		},
	},
});
