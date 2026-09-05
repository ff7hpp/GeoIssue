import { test, expect } from "@playwright/test";
test.describe("Reporting Flow", () => {
  test("User can see the map and explore issues", async ({ page }) => {
    await page.goto("/");
    await expect(page.locator(".app-container")).toBeVisible();
    await expect(page.locator(".site-brand")).toBeVisible();
  });
  test("Demo citizen can sign in and open the report wizard", async ({ page }) => {
    await page.goto("/");
    await page.getByRole("button", { name: "Sign In" }).click();
    await page.getByRole("button", { name: "Demo Citizen" }).click();
    await expect(page.getByRole("link", { name: "My Reports" })).toBeVisible();
    await page.getByRole("link", { name: "New Report" }).first().click();
    await expect(
      page.getByRole("heading", { name: "Report a Community Issue" })
    ).toBeVisible();
    await expect(page.getByRole("button", { name: "Continue" })).toBeVisible();
  });
  test("Arabic report flow uses RTL on a mobile viewport", async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto("/");
    await page.getByRole("button", { name: "Toggle navigation menu" }).click();
    await page.getByRole("button", { name: "Sign In" }).click();
    await page.getByRole("button", { name: "Demo Citizen" }).click();
    await page.getByRole("button", { name: "Change language" }).click();
    await page.getByRole("button", { name: "\u0627\u0644\u0639\u0631\u0628\u064A\u0629" }).click();
    await page.getByRole("link", { name: "\u062A\u0642\u062F\u064A\u0645 \u0628\u0644\u0627\u063A" }).first().click();
    await expect(page.locator("html")).toHaveAttribute("lang", "ar");
    await expect(page.locator("html")).toHaveAttribute("dir", "rtl");
    await expect(page.getByRole("heading", { name: "\u062A\u0642\u062F\u064A\u0645 \u0628\u0644\u0627\u063A \u0639\u0646 \u0645\u0634\u0643\u0644\u0629 \u0645\u062C\u062A\u0645\u0639\u064A\u0629" })).toBeVisible();
    expect(
      await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)
    ).toBe(true);
  });
});
