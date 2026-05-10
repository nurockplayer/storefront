import { describe, expect, it } from "vitest";
import { buildStreamerCatalogDescription } from "./tachiya-streamer-display";
import type { TachiyaStreamerSummary } from "./tachiya-streamer-catalog";

describe("buildStreamerCatalogDescription", () => {
	it("keeps internal Saleor collection ids out of storefront copy", () => {
		const streamer: TachiyaStreamerSummary = {
			slug: "streamer-one",
			displayName: "Streamer One",
			saleorCollectionId: "collection-1",
		};

		const description = buildStreamerCatalogDescription(streamer);

		expect(description).toBe("Curated products from Streamer One.");
		expect(description).not.toContain("collection-1");
		expect(description).not.toContain("Saleor collection");
	});
});
