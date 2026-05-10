export interface TachiyaStreamerCatalog {
	streamer: TachiyaStreamerSummary;
	saleorProductIds: string[];
}

export interface TachiyaStreamerSummary {
	slug: string;
	displayName: string;
	saleorCollectionId: string | null;
}

export type TachiyaStreamerCatalogResult =
	| { ok: true; catalog: TachiyaStreamerCatalog }
	| { ok: false; reason: "missing-config" | "missing-slug" | "not-found" | "request-failed" };

export type TachiyaStreamerListResult =
	| { ok: true; streamers: TachiyaStreamerSummary[] }
	| { ok: false; reason: "missing-config" | "request-failed" };

type FetchImpl = typeof fetch;

interface FetchTachiyaStreamerCatalogOptions {
	slug: string;
	baseUrl: string | undefined;
	internalSecret: string | undefined;
	fetchImpl?: FetchImpl;
}

interface FetchTachiyaStreamerListOptions {
	baseUrl: string | undefined;
	internalSecret: string | undefined;
	limit?: number;
	fetchImpl?: FetchImpl;
}

interface TachiyaInternalConfig {
	baseUrl: string;
	internalSecret: string;
}

export function buildTachiyaStreamerCatalogUrl(baseUrl: string, slug: string): string {
	const normalizedBaseUrl = baseUrl.trim().replace(/\/+$/, "");
	return `${normalizedBaseUrl}/streamers/${encodeURIComponent(slug)}/catalog`;
}

export function buildTachiyaStreamerListUrl(baseUrl: string, limit = 100): string {
	const normalizedBaseUrl = baseUrl.trim().replace(/\/+$/, "");
	return `${normalizedBaseUrl}/streamers?limit=${normalizeLimit(limit)}`;
}

export async function fetchTachiyaStreamerCatalog({
	slug,
	baseUrl,
	internalSecret,
	fetchImpl = fetch,
}: FetchTachiyaStreamerCatalogOptions): Promise<TachiyaStreamerCatalogResult> {
	const normalizedSlug = slug.trim();
	if (!normalizedSlug) {
		return { ok: false, reason: "missing-slug" };
	}

	const config = normalizeTachiyaConfig(baseUrl, internalSecret);
	if (config === null) {
		return { ok: false, reason: "missing-config" };
	}

	try {
		const response = await fetchImpl(buildTachiyaStreamerCatalogUrl(config.baseUrl, normalizedSlug), {
			cache: "no-store",
			headers: { "X-Tachiya-Internal-Secret": config.internalSecret },
		});
		if (response.status === 404) {
			return { ok: false, reason: "not-found" };
		}
		if (!response.ok) {
			return { ok: false, reason: "request-failed" };
		}

		const catalog = mapStreamerCatalog(await response.json());
		if (catalog === null) {
			return { ok: false, reason: "request-failed" };
		}

		return { ok: true, catalog };
	} catch {
		return { ok: false, reason: "request-failed" };
	}
}

export async function fetchTachiyaStreamerList({
	baseUrl,
	internalSecret,
	limit = 100,
	fetchImpl = fetch,
}: FetchTachiyaStreamerListOptions): Promise<TachiyaStreamerListResult> {
	const config = normalizeTachiyaConfig(baseUrl, internalSecret);
	if (config === null) {
		return { ok: false, reason: "missing-config" };
	}

	try {
		const response = await fetchImpl(buildTachiyaStreamerListUrl(config.baseUrl, limit), {
			cache: "no-store",
			headers: { "X-Tachiya-Internal-Secret": config.internalSecret },
		});
		if (!response.ok) {
			return { ok: false, reason: "request-failed" };
		}

		const streamers = mapStreamerList(await response.json());
		if (streamers === null) {
			return { ok: false, reason: "request-failed" };
		}

		return { ok: true, streamers };
	} catch {
		return { ok: false, reason: "request-failed" };
	}
}

export async function getTachiyaStreamerCatalog(slug: string): Promise<TachiyaStreamerCatalogResult> {
	return fetchTachiyaStreamerCatalog({
		slug,
		baseUrl: process.env.TACHIYA_API_URL ?? process.env.NEXT_PUBLIC_TACHIYA_API_URL,
		internalSecret: process.env.TACHIYA_INTERNAL_SHARED_SECRET,
	});
}

export async function getTachiyaStreamerList(limit = 100): Promise<TachiyaStreamerListResult> {
	return fetchTachiyaStreamerList({
		baseUrl: process.env.TACHIYA_API_URL ?? process.env.NEXT_PUBLIC_TACHIYA_API_URL,
		internalSecret: process.env.TACHIYA_INTERNAL_SHARED_SECRET,
		limit,
	});
}

function mapStreamerCatalog(payload: unknown): TachiyaStreamerCatalog | null {
	if (!payload || typeof payload !== "object") {
		return null;
	}
	const body = payload as Record<string, unknown>;
	if (!body.streamer || typeof body.streamer !== "object" || !Array.isArray(body.saleor_product_ids)) {
		return null;
	}

	const streamer = mapStreamerSummary(body.streamer);
	if (streamer === null) {
		return null;
	}

	const saleorProductIds: string[] = [];
	for (const id of body.saleor_product_ids) {
		const normalizedId = normalizeNonBlankString(id);
		if (normalizedId === null) {
			return null;
		}
		saleorProductIds.push(normalizedId);
	}

	return {
		streamer,
		saleorProductIds,
	};
}

function mapStreamerList(payload: unknown): TachiyaStreamerSummary[] | null {
	if (!payload || typeof payload !== "object") {
		return null;
	}
	const body = payload as Record<string, unknown>;
	if (!Array.isArray(body.streamers)) {
		return null;
	}

	const streamers: TachiyaStreamerSummary[] = [];
	for (const streamer of body.streamers) {
		const mappedStreamer = mapStreamerSummary(streamer);
		if (mappedStreamer === null) {
			return null;
		}
		streamers.push(mappedStreamer);
	}

	return streamers;
}

function mapStreamerSummary(payload: unknown): TachiyaStreamerSummary | null {
	if (!payload || typeof payload !== "object") {
		return null;
	}
	const streamer = payload as Record<string, unknown>;
	const slug = normalizeNonBlankString(streamer.slug);
	const displayName = normalizeNonBlankString(streamer.display_name);
	const saleorCollectionId = normalizeOptionalNonBlankString(streamer.saleor_collection_id);
	if (slug === null || displayName === null) {
		return null;
	}
	if (saleorCollectionId === undefined) {
		return null;
	}

	return {
		slug,
		displayName,
		saleorCollectionId,
	};
}

function normalizeNonBlankString(value: unknown): string | null {
	if (typeof value !== "string") {
		return null;
	}
	const normalizedValue = value.trim();
	return normalizedValue || null;
}

function normalizeOptionalNonBlankString(value: unknown): string | null | undefined {
	if (value === null || value === undefined) {
		return null;
	}
	return normalizeNonBlankString(value) ?? undefined;
}

function normalizeLimit(limit: number): number {
	if (!Number.isFinite(limit)) {
		return 100;
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
