import { expect, test, answerQuestionnaire } from "./helpers";

test.describe("questionnaire and recommendations (guest)", () => {
  test("rejects an out-of-range foot length and points the user to the error", async ({ page }) => {
    await page.goto("/questionnaire");
    await page.getByLabel(/Foot length/).fill("20");
    await page.getByRole("button", { name: "Review answers" }).click();
    await expect(page.locator("main").getByRole("alert")).toContainText("Check the highlighted answers");
    await expect(page.locator("main").getByRole("alert")).toBeFocused();
    await expect(page.getByLabel(/Foot length/)).toHaveAttribute("aria-invalid", "true");
    // The user's other answers are not lost.
    await expect(page.getByLabel(/Foot length/)).toHaveValue("20");
  });

  test("reviews answers, edits them, and builds a shortlist", async ({ page }) => {
    await answerQuestionnaire(page);
    const profile = page.getByRole("region", { name: "Your climbing profile" });
    await expect(profile).toContainText("Beginner");
    await expect(profile).toContainText("Comfort");

    // Editing keeps the earlier answers in the form.
    await page.getByRole("button", { name: "Edit answers" }).click();
    await expect(page.getByLabel("Climbing experience")).toHaveValue("BEGINNER");
    await page.getByRole("button", { name: "Review answers" }).click();

    await page.getByRole("button", { name: "Find climbing shoes" }).click();
    const heading = page.getByRole("heading", { name: "Your climbing shoe shortlist" });
    await expect(heading).toBeFocused();
    const results = page.locator("ol > li");
    const count = await results.count();
    expect(count).toBeGreaterThan(0);
    expect(count).toBeLessThanOrEqual(3);
    // Every result explains itself and none shows a percentage score.
    for (let i = 0; i < count; i++) await expect(results.nth(i)).toContainText("Why it appears");
    await expect(page.locator("ol")).not.toContainText("%");

    // The shortlist hands off to the comparison page.
    await page.getByRole("link", { name: "Compare this shortlist" }).click();
    await expect(page).toHaveURL(/\/compare\?.*shoe=/);
  });

  test("asks a guest to sign in before saving a shortlist", async ({ page }) => {
    await answerQuestionnaire(page);
    await page.getByRole("button", { name: "Find climbing shoes" }).click();
    await page.getByRole("button", { name: "Save this shortlist" }).click();
    await expect(page.getByRole("status").getByRole("link", { name: "Sign in" })).toBeVisible();
  });

  test("shows a retryable error when the recommendation service fails", async ({ page }) => {
    await answerQuestionnaire(page);
    await page.route("**/api/recommendations", (route) => route.fulfill({ status: 503, json: { error: "down" } }));
    await page.getByRole("button", { name: "Find climbing shoes" }).click();
    await expect(page.locator("main").getByRole("alert")).toContainText("The catalogue is unavailable");
    // The reviewed profile is still on screen, so nothing needs to be re-entered.
    await expect(page.getByRole("region", { name: "Your climbing profile" })).toBeVisible();
    await page.unroute("**/api/recommendations");
    await page.getByRole("button", { name: "Find climbing shoes" }).click();
    await expect(page.getByRole("heading", { name: "Your climbing shoe shortlist" })).toBeVisible();
  });
});
