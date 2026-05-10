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

describe("POST /api/auth/register", () => {
	beforeEach(() => {
		vi.resetModules();
		vi.clearAllMocks();
	});

	it("rejects blank required fields before calling Saleor", async () => {
		executeRawGraphQL.mockResolvedValue({
			ok: true,
			data: { accountRegister: { user: { id: "user-1", email: "buyer@example.com" }, errors: [] } },
		});
		const { POST } = await import("./route");

		const response = await POST(
			buildJsonRequest({
				email: "buyer@example.com",
				password: "password123",
				channel: "   ",
				redirectUrl: "https://store.test/confirm",
			}) as never,
		);

		await expect(response.json()).resolves.toEqual({
			errors: [{ message: "Email, password, channel, and redirectUrl are required", code: "REQUIRED" }],
		});
		expect(response.status).toBe(400);
		expect(executeRawGraphQL).not.toHaveBeenCalled();
	});

	it("trims register fields before calling Saleor", async () => {
		executeRawGraphQL.mockResolvedValue({
			ok: true,
			data: { accountRegister: { user: { id: "user-1", email: "buyer@example.com" }, errors: [] } },
		});
		const { POST } = await import("./route");

		const response = await POST(
			buildJsonRequest({
				email: " buyer@example.com ",
				password: " password123 ",
				firstName: " Ada ",
				lastName: " Lovelace ",
				channel: " default-channel ",
				redirectUrl: " https://store.test/confirm ",
			}) as never,
		);

		expect(response.status).toBe(200);
		expect(executeRawGraphQL).toHaveBeenCalledWith(
			expect.objectContaining({
				variables: {
					input: {
						email: "buyer@example.com",
						password: "password123",
						firstName: "Ada",
						lastName: "Lovelace",
						channel: "default-channel",
						redirectUrl: "https://store.test/confirm",
					},
				},
			}),
		);
	});
});
