import { expect, test, answerQuestionnaire, password, signUp, testClientIp } from "./helpers";

test.describe("accounts and private data", () => {
  test("private pages ask guests to sign in", async ({ page }) => {
    for (const path of ["/dashboard", "/saved-shoes"]) {
      await page.goto(path);
      await expect(page.locator("main").getByRole("link", { name: "Sign in" })).toBeVisible();
    }
  });

  test("a saved profile and shortlist persist across sign-out and sign-in", async ({ page }) => {
    const email = await signUp(page);

    await answerQuestionnaire(page, { streetSize: "41" });
    await page.getByRole("button", { name: "Save profile" }).click();
    await expect(page.getByText("Profile saved.")).toBeVisible();
    await page.getByRole("button", { name: "Find climbing shoes" }).click();
    await page.getByRole("button", { name: "Save this shortlist" }).click();
    await expect(page.getByText("Saved to your shoes.")).toBeVisible();

    // Sign out from the header, then sign back in with the same account.
    await page.getByRole("button", { name: "Sign out" }).click();
    await expect(page.getByRole("link", { name: "Sign in" }).first()).toBeVisible();
    await page.goto("/sign-in");
    await page.getByLabel("Email").fill(email);
    await page.getByLabel("Password").fill(password);
    await page.getByRole("button", { name: "Sign in" }).click();
    await expect(page).toHaveURL(/\/dashboard$/);

    await page.goto("/saved-shoes");
    await expect(page.getByRole("heading", { level: 1, name: "My saved shoes" })).toBeVisible();
    await expect(page.locator("main")).not.toContainText("to save and view your shoes");

    await page.goto("/questionnaire");
    await page.getByRole("button", { name: "Load saved profile" }).click();
    await expect(page.getByText("Saved profile loaded.")).toBeVisible();
    await expect(page.getByRole("region", { name: "Your climbing profile" })).toContainText("EU 41");
  });

  test("one account cannot read another account's saved shoes", async ({ browser }) => {
    const newContext = () => browser.newContext({ extraHTTPHeaders: { "x-forwarded-for": testClientIp() } });
    const alice = await newContext();
    const alicePage = await alice.newPage();
    await signUp(alicePage, "Alice");
    await answerQuestionnaire(alicePage);
    await alicePage.getByRole("button", { name: "Find climbing shoes" }).click();
    await alicePage.getByRole("button", { name: "Save this shortlist" }).click();
    await expect(alicePage.getByText("Saved to your shoes.")).toBeVisible();
    const aliceSaved = (await (await alicePage.request.get("/api/saved-shoes")).json()).saved;
    expect(aliceSaved.length).toBeGreaterThan(0);

    const bob = await newContext();
    const bobPage = await bob.newPage();
    await signUp(bobPage, "Bob");
    const response = await bobPage.request.get("/api/saved-shoes");
    expect(response.ok()).toBeTruthy();
    expect((await response.json()).saved).toEqual([]);

    // Without a session the private API refuses the request and is not cached.
    const guest = await newContext();
    const anonymous = await guest.request.get("/api/saved-shoes");
    expect(anonymous.status()).toBe(401);
    expect(anonymous.headers()["cache-control"]).toContain("no-store");
    await Promise.all([alice.close(), bob.close(), guest.close()]);
  });

  test("repeated sign-ups from one client are rate limited", async ({ page }) => {
    // All requests in this test share one forwarded IP (see helpers.ts).
    const statuses: number[] = [];
    for (let i = 0; i < 5; i++) {
      const response = await page.request.post("/api/auth/sign-up/email", {
        data: { name: "Rate limit", email: `rate-${i}-${Date.now()}@example.test`, password },
        headers: { origin: test.info().project.use.baseURL! },
      });
      statuses.push(response.status());
    }
    expect(statuses).toContain(429);
  });
});
