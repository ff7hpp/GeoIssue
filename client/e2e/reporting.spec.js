import { test, expect } from "@playwright/test";
test.describe("Reporting Flow", () => {
  test("127.0.0.1 loads issues through the same-origin API proxy", async ({ page }) => {
    await page.goto("http://127.0.0.1:5173/");
    await expect(page.locator(".issue-card").first()).toBeVisible();
    await expect(page.locator(".issue-count")).not.toContainText("0 Issues Found");
  });
  test("Local email login is independent from Firebase availability", async ({ page }) => {
    const email = "playwright.local-auth@example.test";
    const password = "GeoIssue!Test1";
    const registration = await page.request.post("/api/auth/register", {
      data: { email, password, display_name: "Playwright Local Auth", language: "en" }
    });
    expect([201, 409]).toContain(registration.status());
    await page.route("https://identitytoolkit.googleapis.com/**", (route) => route.abort());
    await page.goto("/");
    await page.getByRole("button", { name: "Sign In" }).click();
    await page.getByRole("textbox", { name: "Email Address" }).fill(email);
    await page.getByLabel("Password").fill(password);
    await page.getByRole("button", { name: "Sign In", exact: true }).last().click();
    await expect(page.getByText("Playwright Local Auth")).toBeVisible();
  });
  test("User can see the map and explore issues", async ({ page }) => {
    await page.goto("/");
    await expect(page.locator(".app-container")).toBeVisible();
    await expect(page.locator(".site-brand")).toBeVisible();
    await expect(page.locator(".issue-card").first()).toBeVisible();
    await expect(page.locator(".leaflet-marker-icon").first()).toBeVisible({ timeout: 15_000 });
    await expect(page.locator(".issue-count")).not.toContainText("0 Issues Found");
  });
  test("Map status colors and supporter-based priority are visible", async ({ page }) => {
    await page.goto("/");
    await expect(page.locator(".map-status-legend")).toContainText("Submitted / Under Review");
    await expect(page.locator(".priority-badge").first()).toContainText(/supporters/i);

    const statusColors = [
      [".marker-accepted", "rgb(37, 99, 235)"],
      [".marker-in_progress", "rgb(239, 68, 68)"],
      [".marker-resolved", "rgb(22, 163, 74)"]
    ];
    for (const [selector, color] of statusColors) {
      const marker = page.locator(selector).first();
      await expect(marker).toBeVisible({ timeout: 15_000 });
      expect(await marker.evaluate((element) => getComputedStyle(element).backgroundColor)).toBe(color);
    }
  });
  test("Database filters keep the issue list and map markers consistent", async ({ page }) => {
    await page.goto("/");
    const cards = page.locator(".issue-card");
    const markers = page.locator(".leaflet-marker-icon");
    await expect(cards.first()).toBeVisible();
    await expect(markers.first()).toBeVisible({ timeout: 15_000 });
    expect(await markers.count()).toBe(await cards.count());
    await page.getByRole("combobox", { name: "All Statuses" }).selectOption("resolved");
    await expect(cards.first()).toContainText("Resolved");
    expect(await markers.count()).toBe(await cards.count());
    await page.getByRole("searchbox", { name: "Search issues by title or keyword..." }).fill("Blocked drain near Uskudar ferry");
    await expect(cards).toHaveCount(1);
    await expect(markers).toHaveCount(1);
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
  test("Session survives reload, then logout clears it", async ({ page }) => {
    await page.goto("/");
    await page.getByRole("button", { name: "Sign In" }).click();
    await page.getByRole("button", { name: "Demo Citizen" }).click();
    await expect(page.getByRole("link", { name: "My Reports" })).toBeVisible();
    await page.reload();
    await expect(page.getByRole("link", { name: "My Reports" })).toBeVisible();
    await page.getByRole("button", { name: "Sign out" }).click();
    await expect(page.getByRole("button", { name: "Sign In" })).toBeVisible();
  });
  test("Guest is blocked from admin and demo admin loads the real queue", async ({ page }) => {
    await page.goto("/admin");
    await expect(page).toHaveURL(/\/$/);
    await page.getByRole("button", { name: "Sign In" }).click();
    await page.getByRole("button", { name: "Demo Admin" }).click();
    await page.getByRole("link", { name: "Admin Portal" }).click();
    await expect(page.getByRole("heading", { name: "Admin Operations Portal" })).toBeVisible();
    await expect(page.locator(".card").first()).toBeVisible();
  });
  test("Default map viewport cannot be submitted as a selected location", async ({ page }) => {
    await page.goto("/reports/new");
    await expect(page.getByText("No location selected. The map is showing its initial viewport only.")).toBeVisible();
    await expect(page.locator(".custom-picker-pin-wrapper")).toHaveCount(0);
    await page.getByRole("button", { name: "Continue" }).click();
    await expect(page.getByRole("alert")).toContainText("Choose a location with GPS, search, or the map before continuing.");
    await expect(page.getByRole("heading", { name: "1. Location" })).toBeVisible();
  });
  test("GPS selection uses browser coordinates and exposes reported accuracy", async ({ page }) => {
    await page.route("**/api/geocode/reverse**", (route) => route.fulfill({
      contentType: "application/json",
      body: JSON.stringify({ data: { address: "Test location" } })
    }));
    await page.goto("/reports/new");
    await page.context().grantPermissions(["geolocation"], { origin: new URL(page.url()).origin });
    await page.context().setGeolocation({ latitude: 41.0082, longitude: 28.9784, accuracy: 18 });
    await page.getByRole("button", { name: "Use Current GPS" }).click();
    await expect(page.getByText("Estimated accuracy: ±18 m. Adjust the pin if needed.")).toBeVisible();
    await expect(page.getByText("41.008200, 28.978400")).toBeVisible();
    await expect(page.getByText("Test location")).toBeVisible();
    await page.getByRole("button", { name: "Continue" }).click();
    await expect(page.getByRole("heading", { name: "2. Details" })).toBeVisible();
  });
  test("GPS errors are explicit and manual map selection remains available", async ({ page }) => {
    const errors = [
      [1, "Location permission denied. Select a point on the map."],
      [2, "Location unavailable. Select a point on the map."],
      [3, "Location request timed out. Retry or select a point on the map."]
    ];
    for (const [code, message] of errors) {
      await page.goto("/reports/new");
      await page.evaluate((errorCode) => {
        Object.defineProperty(navigator, "geolocation", {
          configurable: true,
          value: { getCurrentPosition: (_success, error) => error({ code: errorCode }) }
        });
      }, code);
      await page.getByRole("button", { name: "Use Current GPS" }).click();
      await expect(page.getByRole("alert")).toContainText(message);
    }
    await page.locator(".leaflet-container").click({ position: { x: 260, y: 180 } });
    await expect(page.locator(".custom-picker-pin-wrapper")).toHaveCount(1);
    await expect(page.getByRole("alert")).toHaveCount(0);
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
