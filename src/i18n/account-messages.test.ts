import { describe, expect, it } from "vitest";
import enMessages from "../checkout/content/locales/en-US.json";
import zhMessages from "../checkout/content/locales/zh-Hant.json";

describe("account points balance messages", () => {
	it.each([enMessages, zhMessages])("defines the points balance message contract", (messages) => {
		expect(messages).toHaveProperty("account.pointsBalance.label");
		expect(messages).toHaveProperty("account.pointsBalance.emptyValue");
		expect(messages).toHaveProperty("account.pointsBalance.emptyDescription");
		expect(messages).toHaveProperty("account.pointsBalance.unavailableLabel");
		expect(messages).toHaveProperty("account.pointsBalance.unavailableDescription");
		expect(messages).toHaveProperty("account.pointsBalance.notConfiguredDescription");
	});
});
