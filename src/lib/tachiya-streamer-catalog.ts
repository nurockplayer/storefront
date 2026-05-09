export interface TachiyaStreamerCatalog {
	streamer: {
		slug: string;
		displayName: string;
		saleorCollectionId: string | null;
	};
	saleorProductIds: string[];
}

export type TachiyaStreamerCatalogResult =
	| { ok: true; catalog: TachiyaStreamerCatalog }
	| { ok: false; reason: "missing-config" | "missing-slug" | "not-found" | "request-failed" };

type FetchImpl = typeof fetch;

interface FetchTachiyaStreamerCatalogOptions {
	slug: string;
	baseUrl: string | undefined;
	internalSecret: string | undefined;
	fetchImpl?: FetchImpl;
}

export function buildTachiyaStreamerCatalogUrl(baseUrl: string, slug: string): string {
	const normalizedBaseUrl = baseUrl.replace(/\/+$/, "");
	return `${normalizedBaseUrl}/streamers/${encodeURIComponent(slug)}/catalog`;
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

	if (!baseUrl || !internalSecret) {
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

export async function getTachiyaStreamerCatalog(slug: string): Promise<TachiyaStreamerCatalogResult> {
	return fetchTachiyaStreamerCatalog({
		slug,
		baseUrl: process.env.TACHIYA_API_URL ?? process.env.NEXT_PUBLIC_TACHIYA_API_URL,
		internalSecret: process.env.TACHIYA_INTERNAL_SHARED_SECRET,
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

	const streamer = body.streamer as Record<string, unknown>;
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
	const saleorProductIds = body.saleor_product_ids;
	if (!saleorProductIds.every((id): id is string => typeof id === "string")) {
		return null;
	}

	return {
		streamer: {
			slug: streamer.slug,
			displayName: streamer.display_name,
			saleorCollectionId: streamer.saleor_collection_id ?? null,
		},
		saleorProductIds,
	};
}
