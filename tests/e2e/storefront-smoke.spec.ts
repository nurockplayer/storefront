import { expect, test } from "@playwright/test";

test("root redirects to the configured default channel", async ({ page }) => {
	await page.goto("/");

	await expect(page).toHaveURL(/\/default-channel$/);
});

test("products route renders the static product-list shell", async ({ page }) => {
	await page.goto("/default-channel/products");

	await expect(page.getByRole("heading", { name: "All Products" })).toBeVisible();
	await expect(page.getByText("Discover our full collection of premium products.")).toBeVisible();
});

test("checkout route loads without a checkout id", async ({ page }) => {
	await page.goto("/checkout");

	await expect(page.locator("body")).toBeVisible();
	await expect(page.locator("body")).not.toContainText("Application error");
});
