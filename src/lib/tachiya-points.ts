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
		const responseUserId = resolveResponseUserId(body.user_id, normalizedUserId);
		if (responseUserId === null) {
			return { ok: false, reason: "request-failed" };
		}

		return {
			ok: true,
			userId: responseUserId,
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
		const responseUserId = resolveResponseUserId(body.user_id, normalizedUserId);
		if (responseUserId === null) {
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
			userId: responseUserId,
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
	const id = normalizeNonBlankString(payload.id);
	const entryType = normalizeNonBlankString(payload.entry_type);
	const sourceType = normalizeNonBlankString(payload.source_type);
	const referenceId = normalizeNonBlankString(payload.reference_id);
	const createdAt = normalizeNonBlankString(payload.created_at);
	if (
		id === null ||
		typeof payload.amount !== "number" ||
		entryType === null ||
		sourceType === null ||
		referenceId === null ||
		createdAt === null
	) {
		return null;
	}
	const expiresAt =
		payload.expires_at === null || payload.expires_at === undefined
			? null
			: normalizeNonBlankString(payload.expires_at);
	if (payload.expires_at !== null && payload.expires_at !== undefined && expiresAt === null) {
		return null;
	}
	return {
		id,
		amount: payload.amount,
		entryType,
		sourceType,
		referenceId,
		expiresAt,
		createdAt,
	};
}

function resolveResponseUserId(value: unknown, fallback: string): string | null {
	if (value === undefined) {
		return fallback;
	}
	return normalizeNonBlankString(value);
}

function normalizeNonBlankString(value: unknown): string | null {
	if (typeof value !== "string") {
		return null;
	}
	const normalizedValue = value.trim();
	return normalizedValue || null;
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
