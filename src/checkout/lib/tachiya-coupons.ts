export const TACHIYA_REDEMPTION_TOKEN_PARAM = "tachiya_redemption_token";
export const TACHIYA_REDEMPTION_TOKEN_STORAGE_KEY = "tachiya:redemption-token";

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

export function buildTachiyaCouponsUrl(baseUrl: string, redemptionToken: string): string {
	const normalizedBaseUrl = baseUrl.replace(/\/+$/, "");
	return `${normalizedBaseUrl}/coupons?redemption_token=${encodeURIComponent(redemptionToken)}`;
}
