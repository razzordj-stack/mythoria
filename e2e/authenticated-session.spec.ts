import { expect, test } from "@playwright/test";

const email = process.env.E2E_TEST_EMAIL;
const password = process.env.E2E_TEST_PASSWORD;
const hasTestAccount = Boolean(email && password);

test.describe("authentifizierte Spielwege", () => {
  test.describe.configure({ mode: "serial" });

  test.skip(
    !hasTestAccount,
    "E2E_TEST_EMAIL und E2E_TEST_PASSWORD müssen für authentifizierte Tests gesetzt sein.",
  );

  test("Testkonto kann sich an- und abmelden und das Dashboard öffnen", async ({
    page,
  }, testInfo) => {
    test.skip(
      testInfo.project.name !== "chromium",
      "Der Test meldet sich global ab und verwendet deshalb nur eine Browser-Sitzung pro Testkonto.",
    );
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

  test("Testkonto kann einen Charakter erstellen und wieder bereinigen", async ({
    page,
  }, testInfo) => {
    test.skip(
      testInfo.project.name !== "chromium",
      "Der Test verändert ausschließlich das dedizierte Testkonto.",
    );

    const characterName = `E2E Probeheld ${Date.now()}`;

    await page.goto("/login");
    await page.getByLabel("E-Mail").fill(email!);
    await page.getByLabel("Passwort", { exact: true }).fill(password!);
    await page.getByRole("button", { name: "Einloggen" }).click();
    await expect(page).toHaveURL(/\/dashboard$/);

    await page.goto("/dashboard/characters/new");
    await page.getByLabel("Charaktername").fill(characterName);
    const raceSection = page
      .locator("section")
      .filter({ has: page.getByRole("heading", { name: "Volk" }) });
    const classSection = page
      .locator("section")
      .filter({ has: page.getByRole("heading", { name: "Klasse" }) });
    await raceSection.getByRole("button", { name: "Mensch" }).click();
    await classSection.getByRole("button", { name: "Krieger" }).click();
    await page
      .getByLabel("Hintergrundgeschichte")
      .fill("Ein kontrollierter Charakter für die automatische Qualitätsprüfung.");
    await page
      .getByLabel("Erscheinungsbild")
      .fill("Reisender mit dunklem Mantel und silbernem Wappen.");
    await page.getByRole("button", { name: "Charakter erschaffen" }).click();

    await expect(page).toHaveURL(/\/dashboard\/characters\/[\w-]+$/);
    await expect(page.getByRole("heading", { name: characterName })).toBeVisible();

    await page.goto("/dashboard/characters");
    const deleteButton = page.getByRole("button", {
      name: `${characterName} löschen`,
    });
    await expect(deleteButton).toBeVisible();
    page.once("dialog", (dialog) => dialog.accept());
    await deleteButton.click();
    await expect(deleteButton).toBeHidden();
  });
});
