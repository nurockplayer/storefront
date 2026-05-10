import { describe, expect, it, vi } from "vitest";
import {
	buildTachiyaStreamerCatalogUrl,
	buildTachiyaStreamerListUrl,
	fetchTachiyaStreamerCatalog,
	fetchTachiyaStreamerList,
} from "./tachiya-streamer-catalog";

describe("buildTachiyaStreamerCatalogUrl", () => {
	it("builds an encoded streamer catalog URL", () => {
		expect(buildTachiyaStreamerCatalogUrl("http://localhost:8001/", "Streamer One")).toBe(
			"http://localhost:8001/streamers/Streamer%20One/catalog",
		);
	});
});

describe("buildTachiyaStreamerListUrl", () => {
	it("builds a bounded active streamer list URL", () => {
		expect(buildTachiyaStreamerListUrl("http://localhost:8001/", 100)).toBe(
			"http://localhost:8001/streamers?limit=100",
		);
		expect(buildTachiyaStreamerListUrl("http://localhost:8001", 0)).toBe(
			"http://localhost:8001/streamers?limit=1",
		);
		expect(buildTachiyaStreamerListUrl("http://localhost:8001", 999)).toBe(
			"http://localhost:8001/streamers?limit=100",
		);
	});
});

describe("fetchTachiyaStreamerCatalog", () => {
	it("fetches a streamer catalog with the internal secret header", async () => {
		const fetchImpl = vi.fn(async () =>
			Response.json({
				streamer: {
					slug: "streamer-one",
					display_name: "Streamer One",
					saleor_collection_id: "collection-1",
				},
				saleor_product_ids: ["product-1", "product-2"],
			}),
		);

		const result = await fetchTachiyaStreamerCatalog({
			slug: "streamer-one",
			baseUrl: "http://localhost:8001",
			internalSecret: "shared-secret",
			fetchImpl,
		});

		expect(result).toEqual({
			ok: true,
			catalog: {
				streamer: {
					slug: "streamer-one",
					displayName: "Streamer One",
					saleorCollectionId: "collection-1",
				},
				saleorProductIds: ["product-1", "product-2"],
			},
		});
		expect(fetchImpl).toHaveBeenCalledWith("http://localhost:8001/streamers/streamer-one/catalog", {
			cache: "no-store",
			headers: { "X-Tachiya-Internal-Secret": "shared-secret" },
		});
	});

	it("trims configured catalog URL and internal secret before fetching", async () => {
		const fetchImpl = vi.fn(async () =>
			Response.json({
				streamer: {
					slug: "streamer-one",
					display_name: "Streamer One",
					saleor_collection_id: "collection-1",
				},
				saleor_product_ids: ["product-1"],
			}),
		);

		const result = await fetchTachiyaStreamerCatalog({
			slug: "streamer-one",
			baseUrl: " http://localhost:8001/ ",
			internalSecret: " shared-secret ",
			fetchImpl,
		});

		expect(result.ok).toBe(true);
		expect(fetchImpl).toHaveBeenCalledWith("http://localhost:8001/streamers/streamer-one/catalog", {
			cache: "no-store",
			headers: { "X-Tachiya-Internal-Secret": "shared-secret" },
		});
	});

	it("returns missing-config when the API URL or secret is not configured", async () => {
		const fetchImpl = vi.fn();

		const result = await fetchTachiyaStreamerCatalog({
			slug: "streamer-one",
			baseUrl: "",
			internalSecret: "",
			fetchImpl,
		});

		expect(result).toEqual({ ok: false, reason: "missing-config" });
		expect(fetchImpl).not.toHaveBeenCalled();
	});

	it("returns missing-config when the API URL or secret is blank", async () => {
		const fetchImpl = vi.fn();

		const result = await fetchTachiyaStreamerCatalog({
			slug: "streamer-one",
			baseUrl: "   ",
			internalSecret: "   ",
			fetchImpl,
		});

		expect(result).toEqual({ ok: false, reason: "missing-config" });
		expect(fetchImpl).not.toHaveBeenCalled();
	});

	it("returns missing-slug when slug is blank", async () => {
		const fetchImpl = vi.fn();

		const result = await fetchTachiyaStreamerCatalog({
			slug: " ",
			baseUrl: "http://localhost:8001",
			internalSecret: "shared-secret",
			fetchImpl,
		});

		expect(result).toEqual({ ok: false, reason: "missing-slug" });
		expect(fetchImpl).not.toHaveBeenCalled();
	});

	it("maps 404 responses to not-found", async () => {
		const fetchImpl = vi.fn(async () => new Response("missing", { status: 404 }));

		const result = await fetchTachiyaStreamerCatalog({
			slug: "streamer-one",
			baseUrl: "http://localhost:8001",
			internalSecret: "shared-secret",
			fetchImpl,
		});

		expect(result).toEqual({ ok: false, reason: "not-found" });
	});

	it("returns request-failed when the response payload is invalid", async () => {
		const fetchImpl = vi.fn(async () =>
			Response.json({
				streamer: { slug: "streamer-one", display_name: "Streamer One" },
				saleor_product_ids: ["product-1", 2],
			}),
		);

		const result = await fetchTachiyaStreamerCatalog({
			slug: "streamer-one",
			baseUrl: "http://localhost:8001",
			internalSecret: "shared-secret",
			fetchImpl,
		});

		expect(result).toEqual({ ok: false, reason: "request-failed" });
	});

	it("returns request-failed when the catalog payload has blank strings", async () => {
		const fetchImpl = vi.fn(async () =>
			Response.json({
				streamer: {
					slug: "   ",
					display_name: "Streamer One",
					saleor_collection_id: "collection-1",
				},
				saleor_product_ids: ["product-1"],
			}),
		);

		const blankSlug = await fetchTachiyaStreamerCatalog({
			slug: "streamer-one",
			baseUrl: "http://localhost:8001",
			internalSecret: "shared-secret",
			fetchImpl,
		});

		expect(blankSlug).toEqual({ ok: false, reason: "request-failed" });

		const blankDisplayNameFetch = vi.fn(async () =>
			Response.json({
				streamer: {
					slug: "streamer-one",
					display_name: "   ",
					saleor_collection_id: "collection-1",
				},
				saleor_product_ids: ["product-1"],
			}),
		);

		const blankDisplayName = await fetchTachiyaStreamerCatalog({
			slug: "streamer-one",
			baseUrl: "http://localhost:8001",
			internalSecret: "shared-secret",
			fetchImpl: blankDisplayNameFetch,
		});

		expect(blankDisplayName).toEqual({ ok: false, reason: "request-failed" });

		const blankProductIdFetch = vi.fn(async () =>
			Response.json({
				streamer: {
					slug: "streamer-one",
					display_name: "Streamer One",
					saleor_collection_id: "collection-1",
				},
				saleor_product_ids: ["product-1", "   "],
			}),
		);

		const blankProductId = await fetchTachiyaStreamerCatalog({
			slug: "streamer-one",
			baseUrl: "http://localhost:8001",
			internalSecret: "shared-secret",
			fetchImpl: blankProductIdFetch,
		});

		expect(blankProductId).toEqual({ ok: false, reason: "request-failed" });
	});
});

describe("fetchTachiyaStreamerList", () => {
	it("fetches active streamers with the internal secret header", async () => {
		const fetchImpl = vi.fn(async () =>
			Response.json({
				streamers: [
					{
						slug: "streamer-one",
						display_name: "Streamer One",
						saleor_collection_id: "collection-1",
					},
				],
			}),
		);

		const result = await fetchTachiyaStreamerList({
			baseUrl: "http://localhost:8001",
			internalSecret: "shared-secret",
			limit: 100,
			fetchImpl,
		});

		expect(result).toEqual({
			ok: true,
			streamers: [
				{
					slug: "streamer-one",
					displayName: "Streamer One",
					saleorCollectionId: "collection-1",
				},
			],
		});
		expect(fetchImpl).toHaveBeenCalledWith("http://localhost:8001/streamers?limit=100", {
			cache: "no-store",
			headers: { "X-Tachiya-Internal-Secret": "shared-secret" },
		});
	});

	it("returns missing-config when list config is missing", async () => {
		const fetchImpl = vi.fn();

		const result = await fetchTachiyaStreamerList({
			baseUrl: "",
			internalSecret: "",
			fetchImpl,
		});

		expect(result).toEqual({ ok: false, reason: "missing-config" });
		expect(fetchImpl).not.toHaveBeenCalled();
	});

	it("returns missing-config when list config is blank", async () => {
		const fetchImpl = vi.fn();

		const result = await fetchTachiyaStreamerList({
			baseUrl: "   ",
			internalSecret: "   ",
			fetchImpl,
		});

		expect(result).toEqual({ ok: false, reason: "missing-config" });
		expect(fetchImpl).not.toHaveBeenCalled();
	});

	it("returns request-failed when the list payload is invalid", async () => {
		const fetchImpl = vi.fn(async () =>
			Response.json({
				streamers: [{ slug: "streamer-one", display_name: 1, saleor_collection_id: null }],
			}),
		);

		const result = await fetchTachiyaStreamerList({
			baseUrl: "http://localhost:8001",
			internalSecret: "shared-secret",
			fetchImpl,
		});

		expect(result).toEqual({ ok: false, reason: "request-failed" });
	});

	it("returns request-failed when the list payload has blank streamer strings", async () => {
		const fetchImpl = vi.fn(async () =>
			Response.json({
				streamers: [{ slug: "streamer-one", display_name: "   ", saleor_collection_id: null }],
			}),
		);

		const result = await fetchTachiyaStreamerList({
			baseUrl: "http://localhost:8001",
			internalSecret: "shared-secret",
			fetchImpl,
		});

		expect(result).toEqual({ ok: false, reason: "request-failed" });
	});
});
