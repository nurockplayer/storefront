import type { TachiyaStreamerSummary } from "./tachiya-streamer-catalog";

export function buildStreamerCatalogDescription(streamer: TachiyaStreamerSummary): string {
	return `Curated products from ${streamer.displayName}.`;
}
