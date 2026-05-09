import { describe, expect, it, vi } from "vitest";
import { buildTachiyaPointsBalanceUrl, fetchTachiyaPointsBalance } from "./tachiya-points";

describe("buildTachiyaPointsBalanceUrl", () => {
	it("builds an encoded points balance URL", () => {
		expect(buildTachiyaPointsBalanceUrl("http://localhost:8001/", "user with spaces")).toBe(
			"http://localhost:8001/points/balance?user_id=user%20with%20spaces",
		);
	});
});

describe("fetchTachiyaPointsBalance", () => {
	it("fetches the balance with the internal secret header", async () => {
		const fetchImpl = vi.fn(async () => Response.json({ user_id: "user-1", balance: 120 }));

		const result = await fetchTachiyaPointsBalance({
			userId: "user-1",
			baseUrl: "http://localhost:8001",
			internalSecret: "shared-secret",
			fetchImpl,
		});

		expect(result).toEqual({ ok: true, userId: "user-1", balance: 120 });
		expect(fetchImpl).toHaveBeenCalledWith("http://localhost:8001/points/balance?user_id=user-1", {
			cache: "no-store",
			headers: { "X-Tachiya-Internal-Secret": "shared-secret" },
		});
	});

	it("returns a skipped result when config is missing", async () => {
		const fetchImpl = vi.fn();

		const result = await fetchTachiyaPointsBalance({
			userId: "user-1",
			baseUrl: "",
			internalSecret: "",
			fetchImpl,
		});

		expect(result).toEqual({ ok: false, reason: "missing-config" });
		expect(fetchImpl).not.toHaveBeenCalled();
	});

	it("returns a skipped result when user id is missing", async () => {
		const fetchImpl = vi.fn();

		const result = await fetchTachiyaPointsBalance({
			userId: "",
			baseUrl: "http://localhost:8001",
			internalSecret: "shared-secret",
			fetchImpl,
		});

		expect(result).toEqual({ ok: false, reason: "missing-user" });
		expect(fetchImpl).not.toHaveBeenCalled();
	});

	it("returns a failed result when Tachiya returns an error", async () => {
		const fetchImpl = vi.fn(async () => new Response("nope", { status: 500 }));

		const result = await fetchTachiyaPointsBalance({
			userId: "user-1",
			baseUrl: "http://localhost:8001",
			internalSecret: "shared-secret",
			fetchImpl,
		});

		expect(result).toEqual({ ok: false, reason: "request-failed" });
	});
});
