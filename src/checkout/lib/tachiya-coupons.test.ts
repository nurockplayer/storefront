import { describe, expect, it, vi } from "vitest";
import {
	buildTachiyaCouponsUrl,
	resolveTachiyaRedemptionToken,
	TACHIYA_REDEMPTION_TOKEN_STORAGE_KEY,
} from "./tachiya-coupons";

function createStorage(initialValue: string | null = null) {
	let value = initialValue;
	return {
		getItem: vi.fn(() => value),
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
});
