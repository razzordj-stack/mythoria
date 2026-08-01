import { expect, test, type Page } from "@playwright/test";

const email = process.env.E2E_TEST_EMAIL;
const password = process.env.E2E_TEST_PASSWORD;
const hasTestAccount = Boolean(email && password);

async function removeLeftoverTestCharacters(page: Page) {
  await page.goto("/dashboard/characters");
  const testCharacters = page
    .locator("article")
    .filter({ hasText: "E2E Probeheld" });

  while ((await testCharacters.count()) > 0) {
    const testCharacter = testCharacters.first();
    page.once("dialog", (dialog) => dialog.accept());
    await testCharacter.locator("button[aria-label$=' löschen']").click();
    await expect(testCharacter).toBeHidden();
  }
}

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

    await removeLeftoverTestCharacters(page);

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

    await expect(page).toHaveURL(/\/dashboard\/characters\/[0-9a-f-]{36}$/);
    await expect(
      page.getByRole("heading", { name: characterName, exact: true }),
    ).toBeVisible();

    const characterMatch = page.url().match(/\/dashboard\/characters\/([\w-]+)$/);
    if (!characterMatch) throw new Error("Die neue Charakter-ID konnte nicht bestimmt werden.");
    const characterId = characterMatch[1];
    const editedName = `${characterName} Bearbeitet`;

    await page.goto(`/dashboard/characters/${characterId}/edit`);
    await page.getByLabel("Charaktername").fill(editedName);
    await page.getByLabel("Volk").selectOption("elf");
    await page.getByLabel("Klasse").selectOption("mage");
    await page.getByRole("button", { name: "Änderungen speichern" }).click();
    await expect(page).toHaveURL(new RegExp(`/dashboard/characters/${characterId}$`));
    await expect(page.getByText(editedName, { exact: true })).toBeVisible();

    const itemName = `E2E Klinge ${Date.now()}`;
    await page.goto(`/dashboard/characters/${characterId}/inventory/new`);
    await page.getByLabel("Name").fill(itemName);
    await page.getByLabel("Typ").selectOption("weapon");
    await page.getByLabel("Seltenheit").selectOption("rare");
    await page.getByLabel("Ausrüstungsslot").selectOption("main_hand");
    await page.getByLabel("Angriff").fill("7");
    await page.getByLabel("Goldwert").fill("75");
    await page.getByRole("button", { name: "Speichern" }).click();
    await expect(page).toHaveURL(
      new RegExp(`/dashboard/characters/${characterId}/inventory$`),
    );

    const itemCard = page
      .locator("article")
      .filter({ has: page.getByRole("heading", { name: itemName }) });
    await expect(itemCard).toBeVisible();
    await itemCard.getByRole("button", { name: "Ausrüsten" }).click();
    await expect(itemCard.getByText("Ausgerüstet", { exact: true })).toBeVisible();
    page.once("dialog", (dialog) => dialog.accept());
    await itemCard.getByRole("button", { name: "Löschen" }).click();
    await expect(itemCard).toBeHidden();

    await page.goto("/dashboard/world");
    await page.getByLabel("Reisender").selectOption(characterId);
    await page.getByRole("button", { name: "Kronenwacht" }).click();
    const travelDialog = page.getByRole("dialog");
    await travelDialog.getByRole("button", { name: "Hierher reisen" }).click();
    await expect(page.getByText(`reist nun nach Kronenwacht.`)).toBeVisible();

    await page.goto(`/dashboard/characters/${characterId}/quests`);
    const questCard = page
      .locator("article")
      .filter({ has: page.getByRole("heading", { name: "Flüstern im Nebelwald" }) });
    await questCard.getByRole("button", { name: "Quest annehmen" }).click();
    await expect(
      questCard.getByRole("button", { name: "Als erledigt markieren" }),
    ).toBeVisible();
    await questCard.getByRole("button", { name: "Abbrechen" }).click();
    await expect(questCard.getByRole("button", { name: "Quest annehmen" })).toBeVisible();

    await page.goto(`/dashboard/characters/${characterId}/combat`);
    const enemyCard = page
      .locator("article")
      .filter({ has: page.getByRole("heading", { name: "Nebelwolf" }) });
    await enemyCard.getByRole("button", { name: "Kampf beginnen" }).click();
    await expect(page.getByRole("button", { name: "Fliehen" })).toBeVisible();
    await page.getByRole("button", { name: "Fliehen" }).click();
    await expect(
      page.getByRole("button", { name: "Rasten und vollständig erholen" }),
    ).toBeVisible();

    await page.goto("/dashboard/characters");
    const deleteButton = page.getByRole("button", {
      name: `${editedName} löschen`,
    });
    await expect(deleteButton).toBeVisible();
    page.once("dialog", (dialog) => dialog.accept());
    await deleteButton.click();
    await expect(deleteButton).toBeHidden();
  });
});
