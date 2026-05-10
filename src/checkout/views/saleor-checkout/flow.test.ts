import { describe, expect, it } from "vitest";
import {
	getCheckoutSteps,
	getCurrentStepFromParams,
	getStepByNumber,
	getStepBySlug,
	getStepNumber,
} from "./flow";

const searchParams = (step?: string) =>
	new URLSearchParams(step ? { step } : {}) as unknown as Parameters<typeof getCurrentStepFromParams>[0];

describe("checkout flow steps", () => {
	it("includes shipping when the checkout requires shipping", () => {
		expect(getCheckoutSteps(true).map((step) => [step.id, step.index, step.slug])).toEqual([
			["INFO", 1, "contact"],
			["SHIPPING", 2, "shipping"],
			["PAYMENT", 3, "payment"],
			["CONFIRMATION", 4, "confirmation"],
		]);
	});

	it("skips shipping for digital-only checkouts", () => {
		expect(getCheckoutSteps(false).map((step) => [step.id, step.index, step.slug])).toEqual([
			["INFO", 1, "contact"],
			["PAYMENT", 2, "payment"],
			["CONFIRMATION", 3, "confirmation"],
		]);
	});

	it("resolves step helpers and falls back to the first step for invalid URL state", () => {
		expect(getStepNumber("PAYMENT", true)).toBe(3);
		expect(getStepByNumber(2, true)?.id).toBe("SHIPPING");
		expect(getStepBySlug("payment", false)?.index).toBe(2);
		expect(getCurrentStepFromParams(searchParams("unknown"), true).id).toBe("INFO");
		expect(getCurrentStepFromParams(searchParams(), true).id).toBe("INFO");
	});
});
