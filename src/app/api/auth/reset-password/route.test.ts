import { beforeEach, describe, expect, it, vi } from "vitest";

const executeRawGraphQL = vi.fn();

vi.mock("@/lib/graphql", () => ({
	executeRawGraphQL,
	getUserMessage: vi.fn(() => "Unable to complete request"),
}));

function buildJsonRequest(body: unknown) {
	return {
		json: async () => body,
	} as Request;
}

describe("POST /api/auth/reset-password", () => {
	beforeEach(() => {
		vi.resetModules();
		vi.clearAllMocks();
	});

	it("rejects blank required fields before calling Saleor", async () => {
		executeRawGraphQL.mockResolvedValue({
			ok: true,
			data: { requestPasswordReset: { errors: [] } },
		});
		const { POST } = await import("./route");

		const response = await POST(
			buildJsonRequest({
				email: "buyer@example.com",
				channel: "   ",
				redirectUrl: "https://store.test/reset",
			}) as never,
		);

		await expect(response.json()).resolves.toEqual({
			errors: [{ message: "Email, channel, and redirectUrl are required", code: "REQUIRED" }],
		});
		expect(response.status).toBe(400);
		expect(executeRawGraphQL).not.toHaveBeenCalled();
	});

	it("trims reset password fields before calling Saleor", async () => {
		executeRawGraphQL.mockResolvedValue({
			ok: true,
			data: { requestPasswordReset: { errors: [] } },
		});
		const { POST } = await import("./route");

		const response = await POST(
			buildJsonRequest({
				email: " buyer@example.com ",
				channel: " default-channel ",
				redirectUrl: " https://store.test/reset ",
			}) as never,
		);

		await expect(response.json()).resolves.toEqual({ success: true });
		expect(response.status).toBe(200);
		expect(executeRawGraphQL).toHaveBeenCalledWith(
			expect.objectContaining({
				variables: {
					email: "buyer@example.com",
					channel: "default-channel",
					redirectUrl: "https://store.test/reset",
				},
			}),
		);
	});
});
