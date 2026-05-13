import { expect, test, type Page } from "@playwright/test";

const MOCK_SERVER_BASE_URL = "http://127.0.0.1:3010";

async function expectNoApplicationError(page: Page) {
	await expect(page.locator("body")).toBeVisible();
	await expect(page.locator("body")).not.toContainText(
		/Application error|Internal Server Error|Something Went Wrong/i,
	);
}

async function setPointsMockState(
	page: Page,
	state: { balanceMode: "success" | "failure"; ledgerMode: "success" | "failure" | "malformed" },
) {
	const response = await page.request.post(`${MOCK_SERVER_BASE_URL}/__e2e/state`, {
		data: state,
	});
	expect(response.ok()).toBe(true);
}

async function enterAuthenticatedAccountPath(page: Page) {
	await page.context().addCookies([
		{
			name: "e2e-account-session",
			value: "authenticated",
			domain: "127.0.0.1",
			path: "/",
		},
	]);
	await page.goto("/default-channel/account");
}

test("root redirects to the configured default channel", async ({ page }) => {
	await page.goto("/");

	await expect(page).toHaveURL(/\/default-channel$/);
});

test("mock GraphQL server fails fast for unknown operations", async ({ page }) => {
	const response = await page.request.post(`${MOCK_SERVER_BASE_URL}/graphql/`, {
		data: {
			operationName: "UnknownSmokeOperation",
			query: "query UnknownSmokeOperation { shop { name } }",
		},
	});
	const payload = await response.json();

	expect(response.ok()).toBe(true);
	expect(payload).toEqual({
		errors: [
			{
				message: "Unknown mock GraphQL operation: UnknownSmokeOperation",
				extensions: {
					code: "MOCK_GRAPHQL_OPERATION_NOT_IMPLEMENTED",
					operationName: "UnknownSmokeOperation",
					knownOperations: [
						"ChannelsList",
						"MenuGetBySlug",
						"CurrentUserProfile",
						"CurrentUserOrdersPaginated",
						"CurrentUser",
						"ProductListPaginated",
						"ProductListByCollection",
						"HomepageBanner",
					],
				},
			},
		],
	});
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

test.describe.configure({ mode: "serial" });

test("account points smoke renders balance and referral activity when Tachiya responds successfully", async ({
	page,
}) => {
	await setPointsMockState(page, { balanceMode: "success", ledgerMode: "success" });
	await enterAuthenticatedAccountPath(page);

	await expect(page.getByText("Points")).toBeVisible();
	await expect(page.getByText("1,234")).toBeVisible();
	await expect(page.getByText(/^Recent activity$/)).toBeVisible();
	await expect(page.getByText("Referral reward")).toBeVisible();
	await expect(page.getByText(/Order reward|Checkout source/)).toBeVisible();
	await expectNoApplicationError(page);
});

test("account points smoke falls back gracefully when balance request fails", async ({ page }) => {
	await setPointsMockState(page, { balanceMode: "failure", ledgerMode: "success" });
	await enterAuthenticatedAccountPath(page);

	await expect(page.getByText("Points unavailable")).toBeVisible();
	await expect(page.getByText("Try again later")).toBeVisible();
	await expectNoApplicationError(page);
});

test("account points smoke keeps balance but hides malformed recent activity", async ({ page }) => {
	await setPointsMockState(page, { balanceMode: "success", ledgerMode: "malformed" });
	await enterAuthenticatedAccountPath(page);

	await expect(page.getByText("Points")).toBeVisible();
	await expect(page.getByText("1,234")).toBeVisible();
	await expect(page.getByText(/^Recent activity$/)).toBeVisible();
	await expect(page.getByText("Recent activity is unavailable")).toBeVisible();
	await expectNoApplicationError(page);
});
