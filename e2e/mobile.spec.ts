import { expect, test, hasHorizontalOverflow } from "./helpers";

test.describe("mobile layout and navigation", () => {
  test("menu opens, closes with Escape and returns focus to the trigger", async ({ page }) => {
    await page.goto("/shoes");
    const toggle = page.getByRole("button", { name: "Open menu" });
    await expect(page.locator(".mobile-content").getByRole("link", { name: "Compare shoes" })).toBeHidden();
    await toggle.click();
    const menuNav = page.locator(".mobile-content").getByRole("navigation", { name: "Main" });
    await expect(menuNav).toBeVisible();
    await expect(page.getByRole("button", { name: "Close menu" })).toHaveAttribute("aria-expanded", "true");
    await menuNav.getByRole("link", { name: "Compare shoes" }).focus();
    await page.keyboard.press("Escape");
    await expect(menuNav).toBeHidden();
    await expect(page.getByRole("button", { name: "Open menu" })).toBeFocused();
  });

  test("choosing a link navigates, closes the menu and marks the active page", async ({ page }) => {
    await page.goto("/shoes");
    await page.getByRole("button", { name: "Open menu" }).click();
    await page.locator(".mobile-content").getByRole("link", { name: "Compare shoes" }).click();
    await expect(page).toHaveURL(/\/compare$/);
    await expect(page.locator(".mobile-content")).toBeHidden();
    await page.getByRole("button", { name: "Open menu" }).click();
    await expect(page.locator(".mobile-content").getByRole("link", { name: "Compare shoes" })).toHaveAttribute("aria-current", "page");
  });

  // Known issue: SiteHeader only closes the menu when one of its links is clicked, so after
  // browser Back the menu stays open. Remove `.fixme` once the header closes the menu on
  // every pathname change (see docs/e2e-tests.md).
  test.fixme("the menu closes when the route changes through browser history", async ({ page }) => {
    // Navigate client-side (no full reload), as a real user would, so the header stays mounted.
    await page.goto("/shoes");
    await page.getByRole("link", { name: /^Compare / }).first().click();
    await expect(page).toHaveURL(/\/compare\?shoe=/);
    await page.getByRole("button", { name: "Open menu" }).click();
    await expect(page.locator(".mobile-content")).toBeVisible();
    await page.goBack();
    await expect(page).toHaveURL(/\/shoes$/);
    await expect(page.getByRole("heading", { level: 1, name: "Climbing shoe catalogue" })).toBeVisible();
    await expect(page.locator(".mobile-content")).toBeHidden();
    await expect(page.getByRole("button", { name: "Open menu" })).toBeVisible();
  });

  test("skip link is the first stop and moves focus to the main content", async ({ page }) => {
    await page.goto("/questionnaire");
    await page.keyboard.press("Tab");
    const skip = page.getByRole("link", { name: "Skip to content" });
    await expect(skip).toBeFocused();
    await expect(skip).toBeInViewport();
    await page.keyboard.press("Enter");
    await expect(page.locator("#main-content")).toBeFocused();
  });

  for (const path of ["/shoes", "/questionnaire", "/compare", "/shops", "/sign-in", "/sign-up"]) {
    test(`${path} has no sideways page scrolling`, async ({ page }) => {
      await page.goto(path);
      expect(await hasHorizontalOverflow(page)).toBe(false);
    });
  }

  test("the comparison table scrolls inside its own region, not the page", async ({ page }) => {
    await page.goto("/compare");
    const slugs = await page.getByLabel("Shoe 1").locator("option").evaluateAll((options) =>
      options.map((option) => (option as HTMLOptionElement).value).filter(Boolean).slice(0, 3));
    await page.goto(`/compare?${slugs.map((slug) => `shoe=${slug}`).join("&")}`);
    const region = page.getByRole("region", { name: "Shoe comparison table" });
    await expect(region).toBeVisible();
    expect(await region.evaluate((element) => element.scrollWidth > element.clientWidth)).toBe(true);
    expect(await hasHorizontalOverflow(page)).toBe(false);
    // The scroll region is keyboard reachable so it can be scrolled without a mouse.
    await expect(region).toHaveAttribute("tabindex", "0");
  });

  test("form inputs use at least 16px text so mobile browsers do not zoom in", async ({ page }) => {
    await page.goto("/questionnaire");
    const sizes = await page.locator("input.ui-input, select.ui-input").evaluateAll((elements) =>
      elements.map((element) => parseFloat(getComputedStyle(element).fontSize)));
    expect(sizes.length).toBeGreaterThan(0);
    for (const size of sizes) expect(size).toBeGreaterThanOrEqual(16);
  });
});
