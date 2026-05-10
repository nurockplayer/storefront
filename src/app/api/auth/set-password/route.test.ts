import { beforeEach, describe, expect, it, vi } from "vitest";

const executeRawGraphQL = vi.fn();

vi.mock("@/lib/graphql", () => ({
	executeRawGraphQL,
	asValidationError: vi.fn((errors) => ({ error: { validationErrors: errors } })),
	getUserMessage: vi.fn(() => "Unable to complete request"),
}));

function buildJsonRequest(body: unknown) {
	return {
		json: async () => body,
	} as Request;
}

describe("POST /api/auth/set-password", () => {
	beforeEach(() => {
		vi.resetModules();
		vi.clearAllMocks();
	});

	it("rejects blank required fields before calling Saleor", async () => {
		executeRawGraphQL.mockResolvedValue({
			ok: true,
			data: { setPassword: { errors: [{ message: "Invalid token", code: "INVALID" }] } },
		});
		const { POST } = await import("./route");

		const response = await POST(
			buildJsonRequest({
				email: "buyer@example.com",
				token: "   ",
				password: "password123",
			}) as never,
		);

		await expect(response.json()).resolves.toEqual({
			errors: [{ message: "Email, token, and password are required", code: "REQUIRED" }],
		});
		expect(response.status).toBe(400);
		expect(executeRawGraphQL).not.toHaveBeenCalled();
	});

	it("trims set password fields before calling Saleor", async () => {
		executeRawGraphQL.mockResolvedValue({
			ok: true,
			data: { setPassword: { errors: [{ message: "Invalid token", code: "INVALID" }] } },
		});
		const { POST } = await import("./route");

		const response = await POST(
			buildJsonRequest({
				email: " buyer@example.com ",
				token: " reset-token ",
				password: " password123 ",
			}) as never,
		);

		expect(response.status).toBe(400);
		expect(executeRawGraphQL).toHaveBeenCalledWith(
			expect.objectContaining({
				variables: {
					email: "buyer@example.com",
					token: "reset-token",
					password: "password123",
				},
			}),
		);
	});
});
