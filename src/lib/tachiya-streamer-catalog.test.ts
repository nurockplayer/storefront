import { describe, expect, it, vi } from "vitest";
import { buildTachiyaStreamerCatalogUrl, fetchTachiyaStreamerCatalog } from "./tachiya-streamer-catalog";

describe("buildTachiyaStreamerCatalogUrl", () => {
	it("builds an encoded streamer catalog URL", () => {
		expect(buildTachiyaStreamerCatalogUrl("http://localhost:8001/", "Streamer One")).toBe(
			"http://localhost:8001/streamers/Streamer%20One/catalog",
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
});
