import { describe, expect, it } from "vitest";
import { homepageMetadata } from "./tachiya-site-metadata";

describe("homepageMetadata", () => {
	it("uses Tachiya product copy instead of starter-store copy", () => {
		expect(homepageMetadata.title).toContain("Tachiya");
		expect(homepageMetadata.description).toContain("streamer");
		expect(homepageMetadata.title).not.toContain("ACME");
		expect(homepageMetadata.description).not.toContain("Storefront Next.js Example");
	});
});
