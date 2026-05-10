import { describe, expect, it } from "vitest";
import { selectHomepageStreamers } from "./tachiya-homepage-streamers";
import type { TachiyaStreamerSummary } from "./tachiya-streamer-catalog";

const streamers: TachiyaStreamerSummary[] = [
	{ slug: "alpha", displayName: "Alpha", saleorCollectionId: "collection-a" },
	{ slug: "beta", displayName: "Beta", saleorCollectionId: null },
	{ slug: "gamma", displayName: "Gamma", saleorCollectionId: "collection-g" },
	{ slug: "delta", displayName: "Delta", saleorCollectionId: null },
	{ slug: "epsilon", displayName: "Epsilon", saleorCollectionId: null },
];

describe("selectHomepageStreamers", () => {
	it("keeps the homepage streamer section compact", () => {
		expect(selectHomepageStreamers(streamers).map((streamer) => streamer.slug)).toEqual([
			"alpha",
			"beta",
			"gamma",
			"delta",
		]);
	});

	it("supports a smaller explicit limit", () => {
		expect(selectHomepageStreamers(streamers, 2).map((streamer) => streamer.slug)).toEqual(["alpha", "beta"]);
	});
});
