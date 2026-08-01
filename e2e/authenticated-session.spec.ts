import { expect, test, type Page } from "@playwright/test";

const email = process.env.E2E_TEST_EMAIL;
const password = process.env.E2E_TEST_PASSWORD;
const adminEmail = process.env.E2E_ADMIN_EMAIL;
const adminPassword = process.env.E2E_ADMIN_PASSWORD;
const memberEmail = process.env.E2E_MEMBER_EMAIL;
const memberPassword = process.env.E2E_MEMBER_PASSWORD;
const hasTestAccount = Boolean(email && password);
const hasAdminTestAccounts = Boolean(
  adminEmail && adminPassword && memberEmail && memberPassword,
);

async function signIn(page: Page, loginEmail: string, loginPassword: string) {
  await page.goto("/login");
  await page.getByLabel("E-Mail").fill(loginEmail);
  await page.getByLabel("Passwort", { exact: true }).fill(loginPassword);
  await page.getByRole("button", { name: "Einloggen" }).click();
  await expect(page).toHaveURL(/\/dashboard$/);
}

async function signOut(page: Page) {
  await page.goto("/dashboard");
  await page.getByRole("button", { name: "Abmelden" }).click();
  await expect(page).toHaveURL(/\/$/);
}

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
    await signIn(page, email!, password!);
    await expect(page.getByRole("link", { name: "Charaktere" })).toBeVisible();
    await expect(page.getByRole("button", { name: "Abmelden" })).toBeVisible();

    await page.goto("/dashboard/admin");
    await expect(
      page.getByRole("alert").getByText("Zugriff verweigert"),
    ).toBeVisible();

    await signOut(page);
  });

  test("Testkonto kann einen Charakter erstellen und wieder bereinigen", async ({
    page,
  }, testInfo) => {
    test.skip(
      testInfo.project.name !== "chromium",
      "Der Test verändert ausschließlich das dedizierte Testkonto.",
    );

    const characterName = `E2E Probeheld ${Date.now()}`;

    await signIn(page, email!, password!);

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
    const combatEvents = page.locator('[aria-live="polite"] article');
    const eventCountBeforeFleeing = await combatEvents.count();
    await page.getByRole("button", { name: "Fliehen" }).click();
    await expect.poll(() => combatEvents.count()).toBeGreaterThan(eventCountBeforeFleeing);

    await page.goto("/dashboard/characters");
    const deleteButton = page.getByRole("button", {
      name: `${editedName} löschen`,
    });
    await expect(deleteButton).toBeVisible();
    page.once("dialog", (dialog) => dialog.accept());
    await deleteButton.click();
    await expect(deleteButton).toBeHidden();
    await signOut(page);
  });

  test("Admin kann ein Mitglied kontrolliert moderieren und wieder freischalten", async ({
    page,
  }, testInfo) => {
    test.skip(
      testInfo.project.name !== "chromium",
      "Der Moderationstest verwendet nacheinander getrennte globale Sitzungen.",
    );
    test.skip(
      !hasAdminTestAccounts,
      "E2E_ADMIN_* und E2E_MEMBER_* mÃ¼ssen fÃ¼r den Moderationstest gesetzt sein.",
    );

    const memberName = `E2E Mitglied ${Date.now()}`;

    await signIn(page, memberEmail!, memberPassword!);
    await page.goto("/dashboard/admin");
    await expect(
      page.getByRole("alert").getByText("Zugriff verweigert"),
    ).toBeVisible();

    await page.goto("/dashboard/profile");
    await page.getByLabel("Anzeigename").fill(memberName);
    await page.getByRole("button", { name: "Profil speichern" }).click();
    await expect(page.getByText("Profil gespeichert.")).toBeVisible();
    await signOut(page);

    await signIn(page, adminEmail!, adminPassword!);
    await page.goto("/dashboard/admin");
    await expect(
      page.getByRole("heading", { name: "Systemverwaltung" }),
    ).toBeVisible();

    const memberCard = page.locator("article").filter({ hasText: memberName });
    await expect(memberCard).toBeVisible();
    await expect(memberCard.getByText("active", { exact: true })).toBeVisible();

    page.once("dialog", (dialog) => dialog.accept("Automatisierter E2E-Moderationstest"));
    await memberCard.getByRole("button", { name: "Sperren" }).click();
    await expect(memberCard.getByText("suspended", { exact: true })).toBeVisible();
    await expect(page.getByText("Benutzerstatus aktualisiert.")).toBeVisible();

    await memberCard.getByRole("button", { name: "Aktiv" }).click();
    await expect(memberCard.getByText("active", { exact: true })).toBeVisible();
    await expect(page.getByText("Benutzerstatus aktualisiert.")).toBeVisible();
    await expect(page.getByText("user_status_changed", { exact: true }).first()).toBeVisible();
    await signOut(page);

    await signIn(page, memberEmail!, memberPassword!);
    await expect(page.getByRole("link", { name: "Charaktere" })).toBeVisible();
    await signOut(page);
  });
});
