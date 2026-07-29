export type CoreAttributes = {
  strength: number;
  dexterity: number;
  intelligence: number;
  constitution: number;
  wisdom: number;
  charisma: number;
};

export function experienceForLevel(level: number) {
  const safeLevel = Math.max(1, Math.floor(level));
  return 50 * safeLevel * (safeLevel - 1);
}

export function levelFromExperience(experience: number) {
  const safeExperience = Math.max(0, Math.floor(experience));
  return Math.max(1, Math.floor((Math.sqrt(1 + (8 * safeExperience) / 100) + 1) / 2));
}

export function levelProgress(experience: number) {
  const level = levelFromExperience(experience);
  const currentThreshold = experienceForLevel(level);
  const nextThreshold = experienceForLevel(level + 1);
  const earned = Math.max(0, experience - currentThreshold);
  const required = Math.max(1, nextThreshold - currentThreshold);
  return {
    level,
    currentThreshold,
    nextThreshold,
    remaining: Math.max(0, nextThreshold - experience),
    percent: Math.min(100, Math.round((earned / required) * 100)),
  };
}

export function talentPointsForLevel(level: number) {
  return Math.max(0, Math.floor((Math.max(1, Math.floor(level)) - 1) / 2));
}

function modifier(value: number) {
  return Math.floor((value - 10) / 2);
}

export function derivedCharacterStats(level: number, attributes: CoreAttributes) {
  const safeLevel = Math.max(1, Math.floor(level));
  return {
    attack: Math.max(0, 5 + safeLevel + modifier(attributes.strength)),
    defense: Math.max(0, 10 + modifier(attributes.constitution) + Math.floor(safeLevel / 2)),
    magicPower: Math.max(0, 5 + safeLevel + modifier(attributes.intelligence)),
    criticalChance: Math.max(0, Math.min(50, 5 + modifier(attributes.dexterity))),
    dodgeChance: Math.max(0, Math.min(40, 3 + modifier(attributes.dexterity))),
    initiative: Math.max(0, modifier(attributes.dexterity) + modifier(attributes.wisdom)),
    carryCapacity: Math.max(1, 20 + attributes.strength * 2),
    persuasion: Math.max(0, 5 + safeLevel + modifier(attributes.charisma)),
  };
}
