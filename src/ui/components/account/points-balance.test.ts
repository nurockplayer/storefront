import type { ReactElement } from "react";
import { describe, expect, it, vi } from "vitest";

vi.mock("@/lib/tachiya-points", () => ({
	getTachiyaPointsBalance: vi.fn(async () => ({ ok: true, userId: "user-1", balance: 120 })),
	getTachiyaPointsLedger: vi.fn(async () => ({ ok: true, userId: "user-1", entries: [] })),
}));

vi.mock("next-intl/server", () => ({
	getTranslations: vi.fn(async () => (key: string) => {
		const messages: Record<string, string> = {
			label: "Points",
			emptyValue: "0",
			emptyDescription: "No points yet",
			unavailableLabel: "Points unavailable",
			unavailableDescription: "Try again later.",
			notConfiguredDescription: "Points are not available yet.",
			recentActivityLabel: "Recent activity",
			ledgerEmptyDescription: "No recent points activity",
			ledgerUnavailableDescription: "Recent activity is unavailable.",
			creditLabel: "Earned",
			debitLabel: "Used",
			expiresLabel: "Expires",
			"sourceLabels.tachigo": "Tachigo redemption",
			"sourceLabels.orderReward": "Order reward",
			"sourceLabels.checkout": "Checkout",
			"sourceLabels.manual": "Manual adjustment",
			"sourceLabels.referral": "Referral reward",
		};
		return messages[key] ?? key;
	}),
}));

import { PointsBalance, PointsBalanceSkeleton } from "./points-balance";

describe("PointsBalance", () => {
	it("keeps the loaded points card visible on mobile", async () => {
		const element = (await PointsBalance({ userId: "user-1" })) as ReactElement<{ className?: string }>;

		expect(element.props.className).not.toMatch(/\bhidden\b/);
	});

	it("keeps the skeleton visible on mobile", () => {
		const element = PointsBalanceSkeleton() as ReactElement<{ className?: string }>;

		expect(element.props.className).not.toMatch(/\bhidden\b/);
	});
});
