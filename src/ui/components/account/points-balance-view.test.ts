import { describe, expect, it } from "vitest";
import { buildPointsBalanceView } from "./points-balance-view";

const messages = {
	label: "Points",
	emptyValue: "0",
	emptyDescription: "No points yet",
	unavailableLabel: "Points unavailable",
	unavailableDescription: "Try again later",
	notConfiguredDescription: "Points are not configured",
};

describe("buildPointsBalanceView", () => {
	it("formats a positive balance", () => {
		expect(buildPointsBalanceView({ ok: true, userId: "user-1", balance: 1234 }, messages)).toEqual({
			status: "ready",
			label: "Points",
			value: "1,234",
			description: null,
		});
	});

	it("returns an empty state for zero balance", () => {
		expect(buildPointsBalanceView({ ok: true, userId: "user-1", balance: 0 }, messages)).toEqual({
			status: "empty",
			label: "Points",
			value: "0",
			description: "No points yet",
		});
	});

	it("returns a not-configured state for missing server config", () => {
		expect(buildPointsBalanceView({ ok: false, reason: "missing-config" }, messages)).toEqual({
			status: "not-configured",
			label: "Points unavailable",
			value: null,
			description: "Points are not configured",
		});
	});

	it("returns a not-configured state for missing user context", () => {
		expect(buildPointsBalanceView({ ok: false, reason: "missing-user" }, messages)).toEqual({
			status: "not-configured",
			label: "Points unavailable",
			value: null,
			description: "Points are not configured",
		});
	});

	it("returns an unavailable state for request failures", () => {
		expect(buildPointsBalanceView({ ok: false, reason: "request-failed" }, messages)).toEqual({
			status: "unavailable",
			label: "Points unavailable",
			value: null,
			description: "Try again later",
		});
	});
});
