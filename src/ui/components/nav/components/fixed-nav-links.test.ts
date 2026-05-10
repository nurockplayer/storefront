import { describe, expect, it } from "vitest";
import { FIXED_NAV_LINKS } from "./fixed-nav-links";

describe("FIXED_NAV_LINKS", () => {
	it("keeps storefront entry points available when Saleor navigation is unavailable", () => {
		expect(FIXED_NAV_LINKS).toEqual([
			{ href: "/products", label: "All" },
			{ href: "/streamers", label: "Streamers" },
		]);
	});
});
