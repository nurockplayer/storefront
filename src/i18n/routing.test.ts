import { describe, expect, it } from "vitest";
import { defaultLocale, localePrefix, locales } from "./routing";

describe("i18n routing", () => {
	it("keeps existing channel routes unprefixed", () => {
		expect(localePrefix).toBe("never");
	});

	it("supports English and Traditional Chinese locales", () => {
		expect(defaultLocale).toBe("en-US");
		expect(locales).toEqual(["en-US", "zh-Hant"]);
	});
});
