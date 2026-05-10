import { beforeEach, describe, expect, it, vi } from "vitest";

const executeAuthenticatedGraphQL = vi.fn();
const clearCheckoutCookie = vi.fn();
const revalidatePath = vi.fn();

vi.mock("@/lib/graphql", () => ({
	executeAuthenticatedGraphQL,
}));

vi.mock("@/lib/checkout", () => ({
	clearCheckoutCookie,
}));

vi.mock("@/gql/graphql", () => ({
	CheckoutDeleteLinesDocument: "CheckoutDeleteLinesDocument",
	CheckoutLinesUpdateDocument: "CheckoutLinesUpdateDocument",
}));

vi.mock("next/cache", () => ({
	revalidatePath,
}));

describe("cart server actions", () => {
	beforeEach(() => {
		executeAuthenticatedGraphQL.mockReset();
		clearCheckoutCookie.mockReset();
		revalidatePath.mockReset();
	});

	it("updates line quantity and revalidates cart surfaces", async () => {
		const { updateCartLineQuantity } = await import("./actions");
		executeAuthenticatedGraphQL.mockResolvedValueOnce({ ok: true, data: {} });

		await updateCartLineQuantity("checkout-1", "line-1", 2);

		expect(executeAuthenticatedGraphQL).toHaveBeenCalledWith("CheckoutLinesUpdateDocument", {
			variables: {
				checkoutId: "checkout-1",
				lines: [{ lineId: "line-1", quantity: 2 }],
			},
			cache: "no-cache",
		});
		expect(revalidatePath).toHaveBeenCalledWith("/cart");
		expect(revalidatePath).toHaveBeenCalledWith("/");
	});

	it("deletes the line when quantity is below one", async () => {
		const { updateCartLineQuantity } = await import("./actions");
		executeAuthenticatedGraphQL.mockResolvedValueOnce({
			ok: true,
			data: { checkoutLinesDelete: { checkout: { channel: { slug: "default-channel" }, lines: [] } } },
		});

		await updateCartLineQuantity("checkout-1", "line-1", 0);

		expect(executeAuthenticatedGraphQL).toHaveBeenCalledWith("CheckoutDeleteLinesDocument", {
			variables: {
				checkoutId: "checkout-1",
				lineIds: ["line-1"],
			},
			cache: "no-cache",
		});
		expect(clearCheckoutCookie).toHaveBeenCalledWith("default-channel");
	});

	it("keeps checkout cookie when deleted checkout still has lines", async () => {
		const { deleteCartLine } = await import("./actions");
		executeAuthenticatedGraphQL.mockResolvedValueOnce({
			ok: true,
			data: {
				checkoutLinesDelete: {
					checkout: { channel: { slug: "default-channel" }, lines: [{ id: "line-2" }] },
				},
			},
		});

		await deleteCartLine("checkout-1", "line-1");

		expect(clearCheckoutCookie).not.toHaveBeenCalled();
		expect(revalidatePath).toHaveBeenCalledWith("/cart");
		expect(revalidatePath).toHaveBeenCalledWith("/");
	});
});
