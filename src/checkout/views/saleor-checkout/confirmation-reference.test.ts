import { describe, expect, it } from "vitest";
import { buildCheckoutConfirmationReference } from "./confirmation-reference";

describe("buildCheckoutConfirmationReference", () => {
	it("builds a Tachiya fallback reference from the checkout id", () => {
		expect(buildCheckoutConfirmationReference("Q2hlY2tvdXQ6MTIzNDU2")).toBe("TACHIYA-MTIZNDU2");
	});

	it("uses a safe random-looking suffix when the checkout id is missing", () => {
		expect(buildCheckoutConfirmationReference("")).toMatch(/^TACHIYA-[A-Z0-9]{6}$/);
	});

	it("sanitizes the optional prefix", () => {
		expect(buildCheckoutConfirmationReference("checkout-1", " live drop! ")).toBe("LIVEDROP-HECKOUT1");
	});
});
