import { describe, expect, it, vi } from "vitest";
import {
	buildTachiyaPointsBalanceUrl,
	buildTachiyaPointsLedgerUrl,
	fetchTachiyaPointsBalance,
	fetchTachiyaPointsLedger,
} from "./tachiya-points";

describe("buildTachiyaPointsBalanceUrl", () => {
	it("builds an encoded points balance URL", () => {
		expect(buildTachiyaPointsBalanceUrl("http://localhost:8001/", "user with spaces")).toBe(
			"http://localhost:8001/points/balance?user_id=user%20with%20spaces",
		);
	});
});

describe("buildTachiyaPointsLedgerUrl", () => {
	it("builds an encoded points ledger URL with a bounded limit", () => {
		expect(buildTachiyaPointsLedgerUrl("http://localhost:8001/", "user with spaces", 3)).toBe(
			"http://localhost:8001/points/ledger?user_id=user%20with%20spaces&limit=3",
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

describe("fetchTachiyaPointsLedger", () => {
	it("fetches recent ledger entries with the internal secret header", async () => {
		const fetchImpl = vi.fn(async () =>
			Response.json({
				user_id: "user-1",
				entries: [
					{
						id: "entry-1",
						amount: 120,
						entry_type: "credit",
						source_type: "tachigo",
						reference_id: "tachigo:redemption-1",
						expires_at: "2026-12-31T23:59:59",
						created_at: "2026-01-02T00:00:00",
					},
				],
			}),
		);

		const result = await fetchTachiyaPointsLedger({
			userId: "user-1",
			baseUrl: "http://localhost:8001",
			internalSecret: "shared-secret",
			limit: 3,
			fetchImpl,
		});

		expect(result).toEqual({
			ok: true,
			userId: "user-1",
			entries: [
				{
					id: "entry-1",
					amount: 120,
					entryType: "credit",
					sourceType: "tachigo",
					referenceId: "tachigo:redemption-1",
					expiresAt: "2026-12-31T23:59:59",
					createdAt: "2026-01-02T00:00:00",
				},
			],
		});
		expect(fetchImpl).toHaveBeenCalledWith("http://localhost:8001/points/ledger?user_id=user-1&limit=3", {
			cache: "no-store",
			headers: { "X-Tachiya-Internal-Secret": "shared-secret" },
		});
	});

	it("returns a failed result when the ledger payload is invalid", async () => {
		const fetchImpl = vi.fn(async () => Response.json({ user_id: "user-1", entries: [{ amount: "bad" }] }));

		const result = await fetchTachiyaPointsLedger({
			userId: "user-1",
			baseUrl: "http://localhost:8001",
			internalSecret: "shared-secret",
			fetchImpl,
		});

		expect(result).toEqual({ ok: false, reason: "request-failed" });
	});
});
