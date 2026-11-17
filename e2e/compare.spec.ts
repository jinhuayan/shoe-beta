import { expect, test } from "./helpers";

test.describe("comparison", () => {
  test("compares two shoes chosen in the form and keeps them in a shareable URL", async ({ page }) => {
    await page.goto("/compare");
    const first = page.getByLabel("Shoe 1");
    const second = page.getByLabel("Shoe 2");
    const firstName = (await first.locator("option").nth(1).textContent())!.trim();
    const secondName = (await first.locator("option").nth(2).textContent())!.trim();
    await first.selectOption({ index: 1 });
    await second.selectOption({ index: 2 });
    await page.getByRole("button", { name: "Compare shoes" }).click();

    await expect(page).toHaveURL(/shoe=[^&]+&shoe=[^&]+/);
    const table = page.getByRole("region", { name: "Shoe comparison table" });
    await expect(table).toBeVisible();
    await expect(table.getByRole("link", { name: `Remove ${firstName}` })).toBeVisible();
    await expect(table.getByRole("link", { name: `Remove ${secondName}` })).toBeVisible();

    // Reloading the shared URL shows the same selection without client state.
    await page.reload();
    await expect(page.getByLabel("Shoe 1")).not.toHaveValue("");
    await expect(page.getByLabel("Shoe 2")).not.toHaveValue("");
    await expect(page.getByRole("region", { name: "Shoe comparison table" })).toBeVisible();

    // Removing one shoe leaves too few to compare.
    await page.getByRole("link", { name: `Remove ${secondName}` }).click();
    await expect(page.getByText("Choose at least two different shoes to see a comparison.")).toBeVisible();
  });

  test("ignores duplicate and extra selections beyond the limit of three", async ({ page }) => {
    await page.goto("/compare");
    const slugs = await page.getByLabel("Shoe 1").locator("option").evaluateAll((options) =>
      options.map((option) => (option as HTMLOptionElement).value).filter(Boolean).slice(0, 4));
    const query = [slugs[0], slugs[0], slugs[1], slugs[2], slugs[3]].map((slug) => `shoe=${slug}`).join("&");
    await page.goto(`/compare?${query}`);
    await expect(page.getByText("Some selections were skipped.")).toBeVisible();
    const headers = page.getByRole("region", { name: "Shoe comparison table" }).locator("thead th");
    // One attribute column plus at most three shoes.
    expect(await headers.count()).toBeLessThanOrEqual(4);
  });

  test("asks for a second shoe when only one is selected", async ({ page }) => {
    await page.goto("/compare");
    await page.getByLabel("Shoe 1").selectOption({ index: 1 });
    await page.getByRole("button", { name: "Compare shoes" }).click();
    await expect(page.getByText("Choose at least two different shoes to see a comparison.")).toBeVisible();
  });
});
