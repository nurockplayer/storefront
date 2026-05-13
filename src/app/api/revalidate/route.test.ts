import { beforeEach, describe, expect, it, vi } from "vitest";

const revalidatePath = vi.fn();
const revalidateTag = vi.fn();

vi.mock("next/cache", () => ({
	revalidatePath,
	revalidateTag,
}));

function buildPostRequest(body: unknown) {
	return {
		headers: new Headers({ authorization: "Bearer test-secret" }),
		text: async () => JSON.stringify(body),
	} as unknown as Request;
}

function buildGetRequest(query: string) {
	return {
		headers: new Headers({ authorization: "Bearer test-secret" }),
		nextUrl: new URL(`https://store.test/api/revalidate${query}`),
	} as unknown as Request;
}

describe("POST /api/revalidate", () => {
	beforeEach(() => {
		vi.resetModules();
		vi.clearAllMocks();
		vi.stubEnv("REVALIDATE_SECRET", "test-secret");
		vi.stubEnv("NEXT_PUBLIC_DEFAULT_CHANNEL", "default-channel");
	});

	it("falls back to the product listing when a product slug is not a non-empty string", async () => {
		const { POST } = await import("./route");

		const response = await POST(
			buildPostRequest({
				product: {
					slug: 123,
					channel: { slug: "default-channel" },
				},
			}) as never,
		);

		await expect(response.json()).resolves.toEqual({
			paths: ["/default-channel/products"],
			tags: [],
			success: true,
		});
		expect(response.status).toBe(200);
		expect(revalidatePath).toHaveBeenCalledWith("/default-channel/products");
		expect(revalidateTag).not.toHaveBeenCalled();
	});

	it("uses the default channel when the webhook channel slug is blank", async () => {
		const { POST } = await import("./route");

		const response = await POST(
			buildPostRequest({
				collection: {
					slug: "summer-sale",
					channel: { slug: "   " },
				},
			}) as never,
		);

		await expect(response.json()).resolves.toEqual({
			paths: ["/default-channel/collections/summer-sale"],
			tags: ["collection:summer-sale"],
			success: true,
		});
		expect(response.status).toBe(200);
		expect(revalidatePath).toHaveBeenCalledWith("/default-channel/collections/summer-sale");
		expect(revalidateTag).toHaveBeenCalledWith("collection:summer-sale", "minutes");
	});
});

describe("GET /api/revalidate", () => {
	beforeEach(() => {
		vi.resetModules();
		vi.clearAllMocks();
		vi.stubEnv("REVALIDATE_SECRET", "test-secret");
		vi.stubEnv("NEXT_PUBLIC_DEFAULT_CHANNEL", "default-channel");
	});

	it("rejects blank manual path and tag targets", async () => {
		const { GET } = await import("./route");

		const response = await GET(buildGetRequest("?path=%20%20%20&tag=%20%20") as never);

		await expect(response.json()).resolves.toEqual({
			error: "Provide path, tag, and/or all parameter",
		});
		expect(response.status).toBe(400);
		expect(revalidatePath).not.toHaveBeenCalled();
		expect(revalidateTag).not.toHaveBeenCalled();
	});

	it("trims manual path, tag, and blank profile values before revalidating", async () => {
		const { GET } = await import("./route");

		const response = await GET(
			buildGetRequest(
				"?path=%20/default-channel/products%20&tag=%20product:shirt%20&profile=%20%20",
			) as never,
		);

		await expect(response.json()).resolves.toEqual({
			paths: ["/default-channel/products"],
			tags: ["product:shirt"],
			success: true,
		});
		expect(response.status).toBe(200);
		expect(revalidatePath).toHaveBeenCalledWith("/default-channel/products");
		expect(revalidateTag).toHaveBeenCalledWith("product:shirt", "minutes");
	});
});
