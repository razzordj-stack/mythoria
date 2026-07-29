import { describe, expect, it } from "vitest";
import { derivedCharacterStats, experienceForLevel, levelFromExperience, levelProgress, talentPointsForLevel } from "./progression";

describe("character progression", () => {
  it("uses the documented triangular experience thresholds", () => {
    expect(experienceForLevel(1)).toBe(0);
    expect(experienceForLevel(2)).toBe(100);
    expect(experienceForLevel(3)).toBe(300);
    expect(experienceForLevel(4)).toBe(600);
    expect(levelFromExperience(299)).toBe(2);
    expect(levelFromExperience(300)).toBe(3);
  });

  it("calculates progress only within the current level", () => {
    expect(levelProgress(200)).toMatchObject({ level: 2, remaining: 100, percent: 50 });
  });

  it("derives stable secondary values from level and attributes", () => {
    expect(derivedCharacterStats(1, { strength: 10, dexterity: 10, intelligence: 10, constitution: 10, wisdom: 10, charisma: 10 }))
      .toMatchObject({ attack: 6, defense: 10, magicPower: 6, criticalChance: 5, carryCapacity: 40 });
  });

  it("awards one talent point every two levels after level one", () => {
    expect(talentPointsForLevel(1)).toBe(0);
    expect(talentPointsForLevel(3)).toBe(1);
    expect(talentPointsForLevel(7)).toBe(3);
  });
});
