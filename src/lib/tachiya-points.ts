export type TachiyaPointsBalanceResult =
	| { ok: true; userId: string; balance: number }
	| { ok: false; reason: "missing-config" | "request-failed" };

type FetchImpl = typeof fetch;

interface FetchTachiyaPointsBalanceOptions {
	userId: string;
	baseUrl: string | undefined;
	internalSecret: string | undefined;
	fetchImpl?: FetchImpl;
}

export function buildTachiyaPointsBalanceUrl(baseUrl: string, userId: string): string {
	const normalizedBaseUrl = baseUrl.replace(/\/+$/, "");
	return `${normalizedBaseUrl}/points/balance?user_id=${encodeURIComponent(userId)}`;
}

export async function fetchTachiyaPointsBalance({
	userId,
	baseUrl,
	internalSecret,
	fetchImpl = fetch,
}: FetchTachiyaPointsBalanceOptions): Promise<TachiyaPointsBalanceResult> {
	if (!baseUrl || !internalSecret) {
		return { ok: false, reason: "missing-config" };
	}

	try {
		const response = await fetchImpl(buildTachiyaPointsBalanceUrl(baseUrl, userId), {
			cache: "no-store",
			headers: { "X-Tachiya-Internal-Secret": internalSecret },
		});
		if (!response.ok) {
			return { ok: false, reason: "request-failed" };
		}

		const body = (await response.json()) as { user_id?: string; balance?: unknown };
		if (typeof body.balance !== "number") {
			return { ok: false, reason: "request-failed" };
		}

		return {
			ok: true,
			userId: body.user_id ?? userId,
			balance: body.balance,
		};
	} catch {
		return { ok: false, reason: "request-failed" };
	}
}

export async function getTachiyaPointsBalance(userId: string): Promise<TachiyaPointsBalanceResult> {
	return fetchTachiyaPointsBalance({
		userId,
		baseUrl: process.env.TACHIYA_API_URL ?? process.env.NEXT_PUBLIC_TACHIYA_API_URL,
		internalSecret: process.env.TACHIYA_INTERNAL_SHARED_SECRET,
	});
}
