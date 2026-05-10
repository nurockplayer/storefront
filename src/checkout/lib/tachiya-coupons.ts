export const TACHIYA_REDEMPTION_TOKEN_PARAM = "tachiya_redemption_token";
export const TACHIYA_REDEMPTION_TOKEN_STORAGE_KEY = "tachiya:redemption-token";

export interface TachiyaCouponResponseItem {
	voucher_code: string;
	status: "active";
}

interface RedemptionTokenStorage {
	getItem(key: string): string | null;
	setItem(key: string, value: string): void;
}

export function resolveTachiyaRedemptionToken(
	params: URLSearchParams,
	storage: RedemptionTokenStorage | null,
): string | null {
	const fromUrl = params.get(TACHIYA_REDEMPTION_TOKEN_PARAM)?.trim();
	if (fromUrl) {
		try {
			storage?.setItem(TACHIYA_REDEMPTION_TOKEN_STORAGE_KEY, fromUrl);
		} catch {
			// Token persistence is best-effort; the URL token is still usable.
		}
		return fromUrl;
	}

	try {
		const stored = storage?.getItem(TACHIYA_REDEMPTION_TOKEN_STORAGE_KEY)?.trim();
		return stored || null;
	} catch {
		return null;
	}
}

export function buildTachiyaCouponsUrl(baseUrl: string, redemptionToken: string): string | null {
	const normalizedBaseUrl = baseUrl.trim().replace(/\/+$/, "");
	const normalizedRedemptionToken = redemptionToken.trim();

	if (!normalizedBaseUrl || !normalizedRedemptionToken) {
		return null;
	}

	return `${normalizedBaseUrl}/coupons?redemption_token=${encodeURIComponent(normalizedRedemptionToken)}`;
}

export function selectActiveTachiyaCoupon(payload: unknown): TachiyaCouponResponseItem | null {
	if (!Array.isArray(payload)) {
		return null;
	}

	for (const item of payload) {
		if (!item || typeof item !== "object") {
			continue;
		}

		const coupon = item as Record<string, unknown>;
		const voucherCode = normalizeNonBlankString(coupon.voucher_code);
		const status = normalizeNonBlankString(coupon.status)?.toLowerCase();
		if (voucherCode && status === "active") {
			return { voucher_code: voucherCode, status: "active" };
		}
	}

	return null;
}

function normalizeNonBlankString(value: unknown): string | null {
	if (typeof value !== "string") {
		return null;
	}

	const normalized = value.trim();
	return normalized || null;
}
