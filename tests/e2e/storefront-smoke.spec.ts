import { expect, test, type Page } from "@playwright/test";

async function expectNoApplicationError(page: Page) {
	await expect(page.locator("body")).toBeVisible();
	await expect(page.locator("body")).not.toContainText(
		/Application error|Internal Server Error|Something Went Wrong/i,
	);
}

test("root redirects to the configured default channel", async ({ page }) => {
	await page.goto("/");

	await expect(page).toHaveURL(/\/default-channel$/);
});

test("products route renders the static product-list shell", async ({ page }) => {
	await page.goto("/default-channel/products");

	await expect(page.getByRole("heading", { name: "All Products" })).toBeVisible();
	await expect(page.getByText("Discover our full collection of premium products.")).toBeVisible();
	await expectNoApplicationError(page);
});

test("cart route renders the empty cart shell without checkout state", async ({ page }) => {
	await page.context().clearCookies();

	await page.goto("/default-channel/cart");

	await expect(page.getByRole("heading", { name: "Your Shopping Cart" })).toBeVisible();
	await expect(page.getByText("Looks like you haven't added any items to the cart yet.")).toBeVisible();
	await expect(page.getByRole("link", { name: "Explore products" })).toBeVisible();
	await expectNoApplicationError(page);
});

test("checkout route loads without a checkout id", async ({ page }) => {
	const response = await page.goto("/checkout");

	expect(response?.ok()).toBe(true);
	await expect(page).toHaveURL(/\/checkout$/);
	await expect(page.locator("body")).not.toContainText("Checkout");
	await expectNoApplicationError(page);
});

test("account route falls back to sign-in without points configuration or a user session", async ({
	page,
}) => {
	await page.context().clearCookies();

	await page.goto("/default-channel/account");

	await expect(page.getByRole("heading", { name: "Welcome Back" })).toBeVisible();
	await expect(page.getByLabel("Email address")).toBeVisible();
	await expect(page.locator("#password")).toBeVisible();
	await expect(page.getByRole("button", { name: "Sign In" })).toBeVisible();
	await expectNoApplicationError(page);
});
