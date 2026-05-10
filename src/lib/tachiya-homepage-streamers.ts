import type { TachiyaStreamerSummary } from "./tachiya-streamer-catalog";

export function selectHomepageStreamers(
	streamers: TachiyaStreamerSummary[],
	limit = 4,
): TachiyaStreamerSummary[] {
	if (!Number.isFinite(limit) || limit <= 0) {
		return [];
	}

	return streamers.slice(0, Math.trunc(limit));
}
