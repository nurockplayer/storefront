import { describe, expect, it, vi } from "vitest";
import {
	buildTachiyaCouponsUrl,
	clearTachiyaRedemptionToken,
	resolveTachiyaRedemptionToken,
	selectActiveTachiyaCoupon,
	TACHIYA_REDEMPTION_TOKEN_STORAGE_KEY,
} from "./tachiya-coupons";

function createStorage(initialValue: string | null = null) {
	let value = initialValue;
	return {
		getItem: vi.fn(() => value),
		removeItem: vi.fn(() => {
			value = null;
		}),
		setItem: vi.fn((_key: string, nextValue: string) => {
			value = nextValue;
		}),
	};
}

describe("resolveTachiyaRedemptionToken", () => {
	it("prefers the URL token and persists it", () => {
		const storage = createStorage("stored-token");

		const token = resolveTachiyaRedemptionToken(
			new URLSearchParams("tachiya_redemption_token=url-token"),
			storage,
		);

		expect(token).toBe("url-token");
		expect(storage.setItem).toHaveBeenCalledWith(TACHIYA_REDEMPTION_TOKEN_STORAGE_KEY, "url-token");
	});

	it("falls back to the stored token", () => {
		const storage = createStorage("stored-token");

		const token = resolveTachiyaRedemptionToken(new URLSearchParams(), storage);

		expect(token).toBe("stored-token");
		expect(storage.setItem).not.toHaveBeenCalled();
	});

	it("returns null without a URL or stored token", () => {
		const storage = createStorage();

		const token = resolveTachiyaRedemptionToken(new URLSearchParams(), storage);

		expect(token).toBeNull();
	});

	it("still returns the URL token when storage writes fail", () => {
		const storage = {
			getItem: vi.fn(() => null),
			setItem: vi.fn(() => {
				throw new Error("storage unavailable");
			}),
		};

		const token = resolveTachiyaRedemptionToken(
			new URLSearchParams("tachiya_redemption_token=url-token"),
			storage,
		);

		expect(token).toBe("url-token");
	});
});

describe("buildTachiyaCouponsUrl", () => {
	it("builds a scoped coupons URL with an encoded redemption token", () => {
		expect(buildTachiyaCouponsUrl("http://localhost:8001/", "token with spaces")).toBe(
			"http://localhost:8001/coupons?redemption_token=token%20with%20spaces",
		);
	});

	it("trims the redemption token before encoding it", () => {
		expect(buildTachiyaCouponsUrl("http://localhost:8001/", " token-1 ")).toBe(
			"http://localhost:8001/coupons?redemption_token=token-1",
		);
	});

	it("returns null when the API URL is blank", () => {
		expect(buildTachiyaCouponsUrl("   ", "token-1")).toBeNull();
	});

	it("returns null when the redemption token is blank", () => {
		expect(buildTachiyaCouponsUrl("http://localhost:8001/", "   ")).toBeNull();
	});
});

describe("selectActiveTachiyaCoupon", () => {
	it("selects and normalizes the first active coupon with a voucher code", () => {
		expect(
			selectActiveTachiyaCoupon([
				{ voucher_code: "   ", status: "active" },
				{ voucher_code: " TACHIYA-ABC123 ", status: " active " },
			]),
		).toEqual({ voucher_code: "TACHIYA-ABC123", status: "active" });
	});

	it.each([
		null,
		{},
		[{ voucher_code: "TACHIYA-ABC123", status: "redeemed" }],
		[{ voucher_code: "   ", status: "active" }],
		[{ voucher_code: 123, status: "active" }],
		[{ voucher_code: "TACHIYA-ABC123", status: 1 }],
	])("returns null for malformed payload %#", (payload) => {
		expect(selectActiveTachiyaCoupon(payload)).toBeNull();
	});
});

describe("clearTachiyaRedemptionToken", () => {
	it("removes the stored redemption token", () => {
		const storage = createStorage("stored-token");

		clearTachiyaRedemptionToken(storage);

		expect(storage.removeItem).toHaveBeenCalledWith(TACHIYA_REDEMPTION_TOKEN_STORAGE_KEY);
		expect(resolveTachiyaRedemptionToken(new URLSearchParams(), storage)).toBeNull();
	});

	it("does not throw when storage removal fails", () => {
		const storage = {
			removeItem: vi.fn(() => {
				throw new Error("storage unavailable");
			}),
		};

		expect(() => clearTachiyaRedemptionToken(storage)).not.toThrow();
	});
});
