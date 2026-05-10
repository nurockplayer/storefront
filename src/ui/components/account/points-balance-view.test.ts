import { describe, expect, it } from "vitest";
import { buildPointsBalanceView } from "./points-balance-view";

const messages = {
	label: "Points",
	emptyValue: "0",
	emptyDescription: "No points yet",
	unavailableLabel: "Points unavailable",
	unavailableDescription: "Try again later",
	notConfiguredDescription: "Points are not configured",
	recentActivityLabel: "Recent activity",
	ledgerEmptyDescription: "No recent activity",
	ledgerUnavailableDescription: "Recent activity is unavailable",
	creditLabel: "Earned",
	debitLabel: "Used",
	sourceLabels: {
		tachigo: "Tachigo redemption",
		orderReward: "Order reward",
		checkout: "Checkout",
		manual: "Manual adjustment",
		referral: "Referral reward",
	},
};

describe("buildPointsBalanceView", () => {
	it("formats a positive balance", () => {
		expect(
			buildPointsBalanceView({ ok: true, userId: "user-1", balance: 1234 }, messages, {
				ok: true,
				userId: "user-1",
				entries: [
					{
						id: "entry-1",
						amount: 120,
						entryType: "credit",
						sourceType: "tachigo",
						referenceId: "tachigo:redemption-1",
						expiresAt: null,
						createdAt: "2026-01-02T00:00:00",
					},
				],
			}),
		).toEqual({
			status: "ready",
			label: "Points",
			value: "1,234",
			description: null,
			ledger: {
				status: "ready",
				label: "Recent activity",
				description: null,
				entries: [
					{
						id: "entry-1",
						amount: "+120",
						kindLabel: "Earned",
						sourceLabel: "Tachigo redemption",
						referenceId: "tachigo:redemption-1",
						createdAt: "2026-01-02T00:00:00",
					},
				],
			},
		});
	});

	it("falls back to the raw source type for unknown ledger sources", () => {
		const view = buildPointsBalanceView({ ok: true, userId: "user-1", balance: 1234 }, messages, {
			ok: true,
			userId: "user-1",
			entries: [
				{
					id: "entry-1",
					amount: 120,
					entryType: "credit",
					sourceType: "campaign-drop",
					referenceId: "campaign:drop-1",
					expiresAt: null,
					createdAt: "2026-01-02T00:00:00",
				},
			],
		});

		if (view.status !== "ready") {
			throw new Error("expected ready points view");
		}
		expect(view.ledger.entries[0]?.sourceLabel).toBe("campaign-drop");
	});

	it("returns an empty state for zero balance", () => {
		expect(buildPointsBalanceView({ ok: true, userId: "user-1", balance: 0 }, messages)).toEqual({
			status: "empty",
			label: "Points",
			value: "0",
			description: "No points yet",
			ledger: {
				status: "empty",
				label: "Recent activity",
				description: "No recent activity",
				entries: [],
			},
		});
	});

	it("returns a not-configured state for missing server config", () => {
		expect(buildPointsBalanceView({ ok: false, reason: "missing-config" }, messages)).toEqual({
			status: "not-configured",
			label: "Points unavailable",
			value: null,
			description: "Points are not configured",
			ledger: null,
		});
	});

	it("returns a not-configured state for missing user context", () => {
		expect(buildPointsBalanceView({ ok: false, reason: "missing-user" }, messages)).toEqual({
			status: "not-configured",
			label: "Points unavailable",
			value: null,
			description: "Points are not configured",
			ledger: null,
		});
	});

	it("returns an unavailable state for request failures", () => {
		expect(buildPointsBalanceView({ ok: false, reason: "request-failed" }, messages)).toEqual({
			status: "unavailable",
			label: "Points unavailable",
			value: null,
			description: "Try again later",
			ledger: null,
		});
	});

	it("keeps the balance card usable when ledger request fails", () => {
		expect(
			buildPointsBalanceView({ ok: true, userId: "user-1", balance: 123 }, messages, {
				ok: false,
				reason: "request-failed",
			}),
		).toEqual({
			status: "ready",
			label: "Points",
			value: "123",
			description: null,
			ledger: {
				status: "unavailable",
				label: "Recent activity",
				description: "Recent activity is unavailable",
				entries: [],
			},
		});
	});
});
