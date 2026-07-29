import { expect, test } from "@playwright/test";

test("Startseite zeigt Marke und zentrale Handlungswege", async ({ page }) => {
  await page.goto("/");
  await expect(page).toHaveTitle(/Mythoria/i);
  await expect(
    page.getByRole("link", { name: "Abenteuer beginnen" }),
  ).toBeVisible();
  await expect(page.getByRole("link", { name: "Mehr erfahren" })).toBeVisible();
});

test("Anmeldeseite besitzt zugängliche Pflichtfelder", async ({ page }) => {
  await page.goto("/login");
  await expect(
    page.getByRole("heading", { name: "Willkommen zurück" }),
  ).toBeVisible();
  await expect(page.getByLabel("E-Mail")).toBeVisible();
  await expect(page.getByLabel("Passwort", { exact: true })).toBeVisible();
  await expect(page.getByRole("button", { name: "Einloggen" })).toBeEnabled();
});

test("Registrierung und Passwort-Reset sind miteinander verlinkt", async ({
  page,
}) => {
  await page.goto("/register");
  await expect(
    page.getByRole("heading", { name: "Konto erstellen" }),
  ).toBeVisible();
  await page.getByRole("link", { name: "Einloggen" }).click();
  await page.getByRole("link", { name: "Passwort vergessen?" }).click();
  await expect(page).toHaveURL(/forgot-password/);
  await expect(
    page.getByRole("heading", { name: "Passwort vergessen" }),
  ).toBeVisible();
});

test("unbekannte Route zeigt die Mythoria-404-Seite", async ({ page }) => {
  await page.goto("/diese-route-existiert-nicht");
  await expect(page.getByText("404", { exact: true })).toBeVisible();
  await expect(
    page.getByRole("link", { name: "Zur Startseite" }),
  ).toBeVisible();
});

test("öffentliche Seiten erzeugen keinen horizontalen Überlauf", async ({
  page,
}) => {
  for (const path of ["/", "/login", "/register", "/forgot-password"]) {
    await page.goto(path);
    const overflow = await page.evaluate(
      () =>
        document.documentElement.scrollWidth >
        document.documentElement.clientWidth,
    );
    expect(overflow, `Horizontaler Überlauf auf ${path}`).toBe(false);
  }
});

test("geschützte Bereiche leiten Gäste sicher zur Anmeldung", async ({
  page,
}) => {
  await page.goto("/dashboard/characters");
  await expect(page).toHaveURL(/\/login\?next=%2Fdashboard%2Fcharacters$/);
  await expect(
    page.getByRole("heading", { name: "Willkommen zurück" }),
  ).toBeVisible();
});

test("Antworten enthalten die zentralen Sicherheitsheader", async ({
  request,
}) => {
  const response = await request.get("/");
  const headers = response.headers();
  expect(headers["content-security-policy"]).toContain("frame-ancestors 'none'");
  expect(headers["permissions-policy"]).toContain("camera=()");
  expect(headers["x-content-type-options"]).toBe("nosniff");
  expect(headers["x-frame-options"]).toBe("DENY");
  expect(headers["x-powered-by"]).toBeUndefined();
});

test("Health-Check meldet den Betriebszustand ohne Interna", async ({
  request,
}) => {
  const response = await request.get("/api/health");
  expect([200, 503]).toContain(response.status());
  expect(response.headers()["cache-control"]).toContain("no-store");
  const body = await response.json();
  expect(["ok", "degraded"]).toContain(body.status);
  expect(body).toMatchObject({ services: { application: "ok" } });
  expect(body).not.toHaveProperty("supabaseUrl");
  expect(body).not.toHaveProperty("supabasePublishableKey");
});
