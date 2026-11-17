import { expect, test } from "./helpers";

// The real route calls Google Places. These tests replace the browser's request
// so they never spend API quota and can simulate failures deterministically.
test.describe("shop search UI", () => {
  test("renders results returned by the shop API", async ({ page }) => {
    await page.route("**/api/shops", (route) => route.fulfill({
      json: {
        location: "Toronto",
        demo: true,
        shops: [{ id: "1", name: "Test Climbing Supply", address: "1 Example St, Toronto", mapsUrl: "https://maps.google.com/?cid=1", temporarilyClosed: false, attributions: [] }],
      },
    }));
    await page.goto("/shops");
    await page.getByLabel("City or neighbourhood").fill("Toronto");
    await page.getByRole("button", { name: "Search shops" }).click();
    await expect(page.getByRole("heading", { name: "Shop matches near Toronto" })).toBeFocused();
    await expect(page.getByText("Test Climbing Supply")).toBeVisible();
    await expect(page.getByRole("link", { name: "Open in Google Maps" })).toHaveAttribute("rel", /noopener/);
  });

  test("shows the provider error and lets the user search again", async ({ page }) => {
    await page.route("**/api/shops", (route) => route.fulfill({ status: 503, json: { error: "Shop search is unavailable. Please try again later." } }));
    await page.goto("/shops");
    await page.getByLabel("City or neighbourhood").fill("Toronto");
    await page.getByRole("button", { name: "Search shops" }).click();
    await expect(page.locator("main").getByRole("alert")).toHaveText("Shop search is unavailable. Please try again later.");
    await expect(page.getByRole("button", { name: "Search shops" })).toBeEnabled();
  });
});
