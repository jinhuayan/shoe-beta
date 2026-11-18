import { expect, test } from "./helpers";

test.describe("catalogue", () => {
  test("filters are kept in the URL and survive back/forward navigation", async ({ page }) => {
    await page.goto("/shoes");
    const count = page.getByText(/\d+ shoes? found/);
    const total = Number((await count.textContent())?.match(/\d+/)?.[0]);
    expect(total).toBeGreaterThan(1);

    // Pick the first real brand from the filter instead of hard-coding catalogue data.
    const brandSelect = page.getByLabel("Brand", { exact: true });
    const brand = (await brandSelect.locator("option").nth(1).textContent())!.trim();
    await brandSelect.selectOption({ label: brand });
    await page.getByRole("button", { name: "Apply filters" }).click();

    await expect(page).toHaveURL(new RegExp(`brand=${encodeURIComponent(brand).replace(/%20/g, "(\\+|%20)")}`));
    const cards = page.locator("li.catalogue-card");
    const filtered = await cards.count();
    expect(filtered).toBeGreaterThan(0);
    expect(filtered).toBeLessThan(total);
    for (const text of await cards.allTextContents()) expect(text).toContain(brand);
    await expect(brandSelect).toHaveValue(brand);

    // Opening a shoe and going back restores the same filtered view from the URL.
    await cards.first().getByRole("heading").getByRole("link").click();
    await expect(page).toHaveURL(/\/shoes\/[^/?]+/);
    await page.goBack();
    await expect(page.getByLabel("Brand", { exact: true })).toHaveValue(brand);
    await expect(page.locator("li.catalogue-card")).toHaveCount(filtered);

    await page.getByRole("link", { name: "Clear filters" }).click();
    await expect(page).toHaveURL(/\/shoes$/);
    await expect(page.locator("li.catalogue-card")).toHaveCount(total);
  });

  test("a search with no matches explains the empty state", async ({ page }) => {
    await page.goto("/shoes?q=zz-no-such-shoe");
    await expect(page.getByText("0 shoes found.", { exact: false })).toBeVisible();
    await expect(page.getByText("No climbing shoes match these filters.")).toBeVisible();
  });

  test("an unknown shoe URL shows the not-found page", async ({ page }) => {
    // /shoes has a loading.tsx, so Next.js streams this page and the HTTP status is 200.
    // Next.js marks streamed not-found pages "noindex" instead, so check that.
    await page.goto("/shoes/not-a-real-shoe-slug");
    await expect(page.getByRole("heading", { level: 1, name: "Shoe not found" })).toBeVisible();
    await expect(page.locator('head meta[name="robots"]').first()).toHaveAttribute("content", /noindex/);
    await page.getByRole("link", { name: "Back to catalogue" }).click();
    await expect(page).toHaveURL(/\/shoes$/);
  });
});
