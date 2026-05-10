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

export function buildTachiyaStreamerCatalogUrl(baseUrl: string, slug: string): string {
	const normalizedBaseUrl = baseUrl.replace(/\/+$/, "");
	return `${normalizedBaseUrl}/streamers/${encodeURIComponent(slug)}/catalog`;
}

export function buildTachiyaStreamerListUrl(baseUrl: string, limit = 100): string {
	const normalizedBaseUrl = baseUrl.replace(/\/+$/, "");
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

	if (!hasTachiyaConfig(baseUrl, internalSecret)) {
		return { ok: false, reason: "missing-config" };
	}

	try {
		const response = await fetchImpl(buildTachiyaStreamerCatalogUrl(baseUrl, normalizedSlug), {
			cache: "no-store",
			headers: { "X-Tachiya-Internal-Secret": internalSecret },
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
	if (!hasTachiyaConfig(baseUrl, internalSecret)) {
		return { ok: false, reason: "missing-config" };
	}

	try {
		const response = await fetchImpl(buildTachiyaStreamerListUrl(baseUrl, limit), {
			cache: "no-store",
			headers: { "X-Tachiya-Internal-Secret": internalSecret },
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

	const saleorProductIds = body.saleor_product_ids;
	if (!saleorProductIds.every((id): id is string => typeof id === "string")) {
		return null;
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
	if (typeof streamer.slug !== "string" || typeof streamer.display_name !== "string") {
		return null;
	}
	if (
		streamer.saleor_collection_id !== null &&
		streamer.saleor_collection_id !== undefined &&
		typeof streamer.saleor_collection_id !== "string"
	) {
		return null;
	}

	return {
		slug: streamer.slug,
		displayName: streamer.display_name,
		saleorCollectionId: streamer.saleor_collection_id ?? null,
	};
}

function normalizeLimit(limit: number): number {
	if (!Number.isFinite(limit)) {
		return 100;
	}
	return Math.min(100, Math.max(1, Math.trunc(limit)));
}

function hasTachiyaConfig(baseUrl: string | undefined, internalSecret: string | undefined): boolean {
	return Boolean(baseUrl?.trim() && internalSecret?.trim());
}
