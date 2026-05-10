export type TachiyaPointsBalanceResult =
	| { ok: true; userId: string; balance: number }
	| { ok: false; reason: "missing-config" | "missing-user" | "request-failed" };

export interface TachiyaPointsLedgerEntry {
	id: string;
	amount: number;
	entryType: string;
	sourceType: string;
	referenceId: string;
	expiresAt: string | null;
	createdAt: string;
}

export type TachiyaPointsLedgerResult =
	| { ok: true; userId: string; entries: TachiyaPointsLedgerEntry[] }
	| { ok: false; reason: "missing-config" | "missing-user" | "request-failed" };

type FetchImpl = typeof fetch;

interface FetchTachiyaPointsBalanceOptions {
	userId: string;
	baseUrl: string | undefined;
	internalSecret: string | undefined;
	fetchImpl?: FetchImpl;
}

interface FetchTachiyaPointsLedgerOptions extends FetchTachiyaPointsBalanceOptions {
	limit?: number;
}

interface TachiyaInternalConfig {
	baseUrl: string;
	internalSecret: string;
}

export function buildTachiyaPointsBalanceUrl(baseUrl: string, userId: string): string {
	const normalizedBaseUrl = baseUrl.trim().replace(/\/+$/, "");
	const normalizedUserId = userId.trim();
	return `${normalizedBaseUrl}/points/balance?user_id=${encodeURIComponent(normalizedUserId)}`;
}

export function buildTachiyaPointsLedgerUrl(baseUrl: string, userId: string, limit = 3): string {
	const normalizedBaseUrl = baseUrl.trim().replace(/\/+$/, "");
	const normalizedUserId = userId.trim();
	return `${normalizedBaseUrl}/points/ledger?user_id=${encodeURIComponent(
		normalizedUserId,
	)}&limit=${normalizeLedgerLimit(limit)}`;
}

export async function fetchTachiyaPointsBalance({
	userId,
	baseUrl,
	internalSecret,
	fetchImpl = fetch,
}: FetchTachiyaPointsBalanceOptions): Promise<TachiyaPointsBalanceResult> {
	const normalizedUserId = userId.trim();
	if (!normalizedUserId) {
		return { ok: false, reason: "missing-user" };
	}

	const config = normalizeTachiyaConfig(baseUrl, internalSecret);
	if (config === null) {
		return { ok: false, reason: "missing-config" };
	}

	try {
		const response = await fetchImpl(buildTachiyaPointsBalanceUrl(config.baseUrl, normalizedUserId), {
			cache: "no-store",
			headers: { "X-Tachiya-Internal-Secret": config.internalSecret },
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
			userId: body.user_id ?? normalizedUserId,
			balance: body.balance,
		};
	} catch {
		return { ok: false, reason: "request-failed" };
	}
}

export async function fetchTachiyaPointsLedger({
	userId,
	baseUrl,
	internalSecret,
	limit = 3,
	fetchImpl = fetch,
}: FetchTachiyaPointsLedgerOptions): Promise<TachiyaPointsLedgerResult> {
	const normalizedUserId = userId.trim();
	if (!normalizedUserId) {
		return { ok: false, reason: "missing-user" };
	}

	const config = normalizeTachiyaConfig(baseUrl, internalSecret);
	if (config === null) {
		return { ok: false, reason: "missing-config" };
	}

	try {
		const response = await fetchImpl(buildTachiyaPointsLedgerUrl(config.baseUrl, normalizedUserId, limit), {
			cache: "no-store",
			headers: { "X-Tachiya-Internal-Secret": config.internalSecret },
		});
		if (!response.ok) {
			return { ok: false, reason: "request-failed" };
		}

		const body = (await response.json()) as { user_id?: string; entries?: unknown };
		if (!Array.isArray(body.entries)) {
			return { ok: false, reason: "request-failed" };
		}

		const entries: TachiyaPointsLedgerEntry[] = [];
		for (const entry of body.entries) {
			const mappedEntry = mapLedgerEntry(entry);
			if (mappedEntry === null) {
				return { ok: false, reason: "request-failed" };
			}
			entries.push(mappedEntry);
		}

		return {
			ok: true,
			userId: body.user_id ?? normalizedUserId,
			entries,
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

export async function getTachiyaPointsLedger(userId: string, limit = 3): Promise<TachiyaPointsLedgerResult> {
	return fetchTachiyaPointsLedger({
		userId,
		baseUrl: process.env.TACHIYA_API_URL ?? process.env.NEXT_PUBLIC_TACHIYA_API_URL,
		internalSecret: process.env.TACHIYA_INTERNAL_SHARED_SECRET,
		limit,
	});
}

function mapLedgerEntry(entry: unknown): TachiyaPointsLedgerEntry | null {
	if (!entry || typeof entry !== "object") {
		return null;
	}
	const payload = entry as Record<string, unknown>;
	if (
		typeof payload.id !== "string" ||
		typeof payload.amount !== "number" ||
		typeof payload.entry_type !== "string" ||
		typeof payload.source_type !== "string" ||
		typeof payload.reference_id !== "string" ||
		typeof payload.created_at !== "string"
	) {
		return null;
	}
	if (
		payload.expires_at !== null &&
		payload.expires_at !== undefined &&
		typeof payload.expires_at !== "string"
	) {
		return null;
	}
	return {
		id: payload.id,
		amount: payload.amount,
		entryType: payload.entry_type,
		sourceType: payload.source_type,
		referenceId: payload.reference_id,
		expiresAt: payload.expires_at ?? null,
		createdAt: payload.created_at,
	};
}

function normalizeLedgerLimit(limit: number): number {
	if (!Number.isFinite(limit)) {
		return 3;
	}
	return Math.min(100, Math.max(1, Math.trunc(limit)));
}

function normalizeTachiyaConfig(
	baseUrl: string | undefined,
	internalSecret: string | undefined,
): TachiyaInternalConfig | null {
	const normalizedBaseUrl = baseUrl?.trim();
	const normalizedInternalSecret = internalSecret?.trim();

	if (!normalizedBaseUrl || !normalizedInternalSecret) {
		return null;
	}

	return {
		baseUrl: normalizedBaseUrl,
		internalSecret: normalizedInternalSecret,
	};
}
