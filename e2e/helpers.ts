import { test as base, expect, type Page } from "@playwright/test";
import { randomInt, randomUUID } from "node:crypto";

/** A random private-range IP address, so parallel tests do not share a rate-limit bucket. */
export function testClientIp() {
  return `10.${randomInt(0, 256)}.${randomInt(0, 256)}.${randomInt(1, 255)}`;
}

/**
 * Better Auth rate-limits sign-ups per client IP in production builds. Every test
 * runs from 127.0.0.1, so each test gets its own forwarded IP to stay independent.
 * The rate limit itself is checked in auth.spec.ts.
 */
export const test = base.extend({
  extraHTTPHeaders: async ({}, provide) => { await provide({ "x-forwarded-for": testClientIp() }); },
});
export { expect };

export const password = "E2e-climbing-password-123!";

/** Creates a fresh account through the real sign-up form and waits for the dashboard. */
export async function signUp(page: Page, name = "E2E Climber") {
  const email = `e2e-${randomUUID()}@example.test`;
  await page.goto("/sign-up");
  await page.getByLabel("Name").fill(name);
  await page.getByLabel("Email").fill(email);
  await page.getByLabel("Password").fill(password);
  await page.getByRole("button", { name: "Create account" }).click();
  await expect(page).toHaveURL(/\/dashboard$/);
  await expect(page.getByRole("heading", { level: 1, name: "My climbing" })).toBeVisible();
  return email;
}

/** Fills the questionnaire with answers that the current rules can score. */
export async function answerQuestionnaire(page: Page, answers: { streetSize?: string } = {}) {
  await page.goto("/questionnaire");
  if (answers.streetSize) await page.getByLabel(/Street shoe size/).fill(answers.streetSize);
  await page.getByLabel("Climbing experience").selectOption({ label: "Beginner" });
  await page.getByLabel("Main climbing style").selectOption({ label: "Bouldering" });
  await page.getByLabel("Fit preference").selectOption({ label: "Comfort" });
  await page.getByRole("button", { name: "Review answers" }).click();
  await expect(page.getByRole("heading", { name: "Your climbing profile" })).toBeFocused();
}

/** True when the page is wider than the viewport, i.e. the user would have to scroll sideways. */
export async function hasHorizontalOverflow(page: Page) {
  return page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth + 1);
}
