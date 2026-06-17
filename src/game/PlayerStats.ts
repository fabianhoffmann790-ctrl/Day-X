import { BALANCE } from './Balance';
import type { PlayerVitals } from './types';

export const DEFAULT_PLAYER_VITALS: PlayerVitals = {
  hp: 100,
  stamina: 100,
  hunger: 88,
  thirst: 84,
  bleeding: false,
  infection: 0,
  infected: false
};

export function cloneDefaultVitals(): PlayerVitals {
  return { ...DEFAULT_PLAYER_VITALS };
}

export function updatePlayerVitals(stats: PlayerVitals, delta: number) {
  stats.hunger = Math.max(0, stats.hunger - (BALANCE.vitals.hungerLossPerMinute / 60) * delta);
  stats.thirst = Math.max(0, stats.thirst - (BALANCE.vitals.thirstLossPerMinute / 60) * delta);

  if (stats.bleeding) stats.hp = Math.max(0, stats.hp - BALANCE.vitals.bleedingDamagePerSecond * delta);
  if (stats.hunger <= 0 || stats.thirst <= 0) stats.hp = Math.max(0, stats.hp - BALANCE.vitals.starvationDamagePerSecond * delta);

  if (stats.infected) {
    stats.infection = Math.min(100, stats.infection + BALANCE.vitals.infectionGrowthPerSecond * delta);
    if (stats.infection >= 70) stats.hp = Math.max(0, stats.hp - BALANCE.vitals.severeInfectionDamagePerSecond * delta);
  }
}

export function applyDamage(stats: PlayerVitals, rawDamage: number, armorReduction: number, bleedChance = BALANCE.zombie.bleedChance) {
  const mitigatedDamage = rawDamage * (1 - armorReduction);
  stats.hp = Math.max(0, stats.hp - mitigatedDamage);
  const startedBleeding = Math.random() < bleedChance;
  if (startedBleeding) stats.bleeding = true;
  return { damageTaken: mitigatedDamage, startedBleeding };
}

export function applyItemEffects(stats: PlayerVitals, effect: { nutrition?: number; hydration?: number; heal?: number; stopsBleeding?: boolean; infectionRelief?: number }) {
  if (effect.nutrition) stats.hunger = Math.min(100, stats.hunger + effect.nutrition);
  if (effect.hydration) stats.thirst = Math.min(100, stats.thirst + effect.hydration);
  if (effect.heal) stats.hp = Math.min(100, stats.hp + effect.heal);
  if (effect.stopsBleeding) stats.bleeding = false;
  if (effect.infectionRelief) {
    stats.infection = Math.max(0, stats.infection - effect.infectionRelief);
    if (stats.infection <= 0) stats.infected = false;
  }
}
