import { describe, expect, it } from "vitest";
import {
  isUuid,
  parseAdventureResponse,
  providerErrorMessage,
} from "./route";

const questId = "123e4567-e89b-42d3-a456-426614174000";

function validResponse() {
  return {
    narrative:
      "Vor dir öffnet sich ein uraltes Tor. Kalte Luft strömt aus der Dunkelheit, während Runen im Stein erwachen.",
    choices: [
      "Das Tor untersuchen",
      "Die Runen entziffern",
      "Vorsichtig zurückweichen",
    ],
    scene: "Das erwachte Tor",
    effects: { health: -2, mana: 0, gold: 3, experience: 10 },
    itemRewards: [] as Array<{
      name: string;
      description: string;
      itemType: string;
      rarity: string;
    }>,
    questUpdates: [] as Array<{
      questId: string;
      progress: number;
      note: string;
    }>,
  };
}

describe("parseAdventureResponse", () => {
  it("akzeptiert eine vollständig gültige Spielleiterantwort", () => {
    expect(parseAdventureResponse(JSON.stringify(validResponse()))).toEqual(
      validResponse(),
    );
  });

  it("verwirft ungültiges JSON", () => {
    expect(parseAdventureResponse("keine-json-antwort")).toBeNull();
  });

  it("verlangt genau drei Handlungsoptionen", () => {
    const response = validResponse();
    response.choices = ["Nur eine Option"];
    expect(parseAdventureResponse(JSON.stringify(response))).toBeNull();
  });

  it("verwirft Werteänderungen außerhalb der Servergrenzen", () => {
    const response = validResponse();
    response.effects.health = -26;
    expect(parseAdventureResponse(JSON.stringify(response))).toBeNull();
  });

  it("verwirft zu seltene KI-Gegenstände", () => {
    const response = validResponse();
    response.itemRewards = [
      {
        name: "Sternenklinge",
        description: "Eine mächtige Klinge",
        itemType: "weapon",
        rarity: "legendary",
      },
    ];
    expect(parseAdventureResponse(JSON.stringify(response))).toBeNull();
  });

  it("akzeptiert genau einen einfachen Gegenstand", () => {
    const response = validResponse();
    response.itemRewards = [
      {
        name: "Heiltrank",
        description: "Ein kleiner roter Trank",
        itemType: "potion",
        rarity: "common",
      },
    ];
    expect(
      parseAdventureResponse(JSON.stringify(response))?.itemRewards,
    ).toHaveLength(1);
  });

  it("verwirft Questfortschritt mit fremdem ID-Format", () => {
    const response = validResponse();
    response.questUpdates = [
      { questId: "keine-uuid", progress: 10, note: "Eine Spur gefunden" },
    ];
    expect(parseAdventureResponse(JSON.stringify(response))).toBeNull();
  });

  it("akzeptiert begrenzten Fortschritt für eine gültige Quest", () => {
    const response = validResponse();
    response.questUpdates = [
      { questId, progress: 25, note: "Den ersten Hinweis geborgen" },
    ];
    expect(
      parseAdventureResponse(JSON.stringify(response))?.questUpdates[0]
        .progress,
    ).toBe(25);
  });
});

describe("isUuid", () => {
  it("unterscheidet gültige UUIDs von beliebigem Text", () => {
    expect(isUuid(questId)).toBe(true);
    expect(isUuid("../../../fremde-datei")).toBe(false);
  });
});

describe("providerErrorMessage", () => {
  it("erklärt fehlendes OpenAI-Guthaben verständlich", () => {
    expect(
      providerErrorMessage(
        "openai",
        "You have no credits remaining (credit_balance_exhausted).",
      ),
    ).toContain("Guthaben");
  });

  it("gibt für unbekannte Providerfehler keine internen Details aus", () => {
    expect(providerErrorMessage("openai", "interner Providerfehler")).toBe(
      "Der KI-Spielleiter ist gerade nicht erreichbar. Deine Handlung wurde nicht gespeichert.",
    );
  });
});
