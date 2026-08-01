import { expect, test } from "@playwright/test";

const email = process.env.E2E_TEST_EMAIL;
const password = process.env.E2E_TEST_PASSWORD;
const hasTestAccount = Boolean(email && password);

test.describe("authentifizierte Spielwege", () => {
  test.skip(
    !hasTestAccount,
    "E2E_TEST_EMAIL und E2E_TEST_PASSWORD müssen für authentifizierte Tests gesetzt sein.",
  );

  test("Testkonto kann sich an- und abmelden und das Dashboard öffnen", async ({
    page,
  }) => {
    await page.goto("/login");
    await page.getByLabel("E-Mail").fill(email!);
    await page.getByLabel("Passwort", { exact: true }).fill(password!);
    await page.getByRole("button", { name: "Einloggen" }).click();

    await expect(page).toHaveURL(/\/dashboard$/);
    await expect(page.getByRole("link", { name: "Charaktere" })).toBeVisible();
    await expect(page.getByRole("button", { name: "Abmelden" })).toBeVisible();

    await page.getByRole("button", { name: "Abmelden" }).click();
    await expect(page).toHaveURL(/\/$/);
  });
});
