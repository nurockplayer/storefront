import { describe, expect, it } from "vitest";
import { parseRuntimeInteger } from "./graphql";

describe("parseRuntimeInteger", () => {
	it("falls back when the value is blank or not finite", () => {
		const options = { fallback: 3, min: 1, max: 20 };

		expect(parseRuntimeInteger(undefined, options)).toBe(3);
		expect(parseRuntimeInteger("", options)).toBe(3);
		expect(parseRuntimeInteger("not-a-number", options)).toBe(3);
	});

	it("falls back below the minimum and clamps above the maximum", () => {
		const options = { fallback: 3, min: 1, max: 20 };

		expect(parseRuntimeInteger("0", options)).toBe(3);
		expect(parseRuntimeInteger("-2", options)).toBe(3);
		expect(parseRuntimeInteger("21", options)).toBe(20);
		expect(parseRuntimeInteger("6", options)).toBe(6);
	});
});
