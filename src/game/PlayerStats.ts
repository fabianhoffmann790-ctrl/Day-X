import { BALANCE } from './Balance';
import type { PlayerVitals, WeatherType } from './types';

export const DEFAULT_PLAYER_VITALS: PlayerVitals = {
  hp: 100,
  stamina: 100,
  hunger: 88,
  thirst: 84,
  bleeding: false,
  infection: 0,
  infected: false,
  bodyTemperature: 37,
  wetness: 0,
  cold: 0,
  illness: 0,
  sick: false,
  pain: 0,
  unconscious: false,
  fracture: false
};

export interface VitalsContext {
  weather: WeatherType;
  isNight: boolean;
  warmth: number;
  rainProtection: number;
  nearbyFireWarmth: number;
  totalWeight: number;
}

export function cloneDefaultVitals(): PlayerVitals {
  return { ...DEFAULT_PLAYER_VITALS };
}

export function updatePlayerVitals(stats: PlayerVitals, delta: number, context?: Partial<VitalsContext>) {
  stats.hunger = Math.max(0, stats.hunger - (BALANCE.vitals.hungerLossPerMinute / 60) * delta);
  stats.thirst = Math.max(0, stats.thirst - (BALANCE.vitals.thirstLossPerMinute / 60) * delta);

  if (context) updateTemperatureAndWetness(stats, delta, context);

  if (stats.bleeding) {
    stats.hp = Math.max(0, stats.hp - BALANCE.vitals.bleedingDamagePerSecond * delta);
    if (Math.random() < BALANCE.disease.untreatedBleedInfectionChancePerSecond * delta) addInfection(stats, 5);
  }
  if (stats.hunger <= 0 || stats.thirst <= 0) stats.hp = Math.max(0, stats.hp - BALANCE.vitals.starvationDamagePerSecond * delta);

  if (stats.infected) {
    stats.infection = Math.min(100, stats.infection + BALANCE.vitals.infectionGrowthPerSecond * delta);
    if (stats.infection >= 70) stats.hp = Math.max(0, stats.hp - BALANCE.vitals.severeInfectionDamagePerSecond * delta);
  }

  if (stats.sick) {
    stats.illness = Math.min(100, stats.illness + delta * 0.08);
    if (stats.illness >= 65) stats.stamina = Math.max(0, stats.stamina - BALANCE.vitals.illnessStaminaPenalty * delta);
  }

  stats.pain = Math.max(0, stats.pain - delta * 0.28);
  stats.unconscious = stats.bodyTemperature <= BALANCE.vitals.unconsciousTemperature || stats.hp <= 4;
}

function updateTemperatureAndWetness(stats: PlayerVitals, delta: number, context: Partial<VitalsContext>) {
  const weather = context.weather ?? 'clear';
  const rainProtection = context.rainProtection ?? 0;
  const warmth = context.warmth ?? 0;
  const nearbyFireWarmth = context.nearbyFireWarmth ?? 0;
  const isNight = context.isNight ?? false;

  if (weather === 'rain') {
    const wetGain = Math.max(0, BALANCE.vitals.wetnessRainGainPerSecond - rainProtection * BALANCE.clothing.rainProtectionToWetnessReduction);
    stats.wetness = Math.min(100, stats.wetness + wetGain * delta);
  } else {
    stats.wetness = Math.max(0, stats.wetness - (BALANCE.vitals.wetnessDryPerSecond + nearbyFireWarmth * 1.6) * delta);
  }

  const externalTemperature = getExternalTemperature(weather, isNight);
  const wetColdStress = stats.wetness * BALANCE.vitals.temperatureLossRainWetness;
  const nightColdStress = isNight ? BALANCE.vitals.temperatureLossNight : 0;
  const clothingProtection = warmth * BALANCE.clothing.warmthToTemperatureProtection;
  const fireHeat = nearbyFireWarmth * BALANCE.fire.warmthPerSecond;
  const targetTemperature = 37 + (externalTemperature - 16) * 0.055 - wetColdStress - nightColdStress + clothingProtection + fireHeat;

  stats.bodyTemperature += (targetTemperature - stats.bodyTemperature) * delta * 0.035;
  if (nearbyFireWarmth > 0) stats.bodyTemperature = Math.min(37.4, stats.bodyTemperature + fireHeat * delta);
  stats.cold = Math.max(0, Math.min(100, (36.6 - stats.bodyTemperature) * 42));

  if (stats.bodyTemperature < 35) {
    stats.stamina = Math.max(0, stats.stamina - BALANCE.vitals.coldStaminaDrainPerSecond * delta);
    if (stats.bodyTemperature < 34.2) stats.hp = Math.max(0, stats.hp - BALANCE.vitals.coldHpDamagePerSecond * delta);
  }
}

function getExternalTemperature(weather: WeatherType, isNight: boolean) {
  const base = weather === 'clear'
    ? BALANCE.weather.clearTemperature
    : weather === 'cloudy'
      ? BALANCE.weather.cloudyTemperature
      : weather === 'rain'
        ? BALANCE.weather.rainTemperature
        : BALANCE.weather.fogTemperature;
  return base + (isNight ? BALANCE.weather.nightTemperaturePenalty : 0);
}

export function applyDamage(stats: PlayerVitals, rawDamage: number, armorReduction: number, bleedChance = BALANCE.zombie.bleedChance) {
  const mitigatedDamage = rawDamage * (1 - armorReduction);
  stats.hp = Math.max(0, stats.hp - mitigatedDamage);
  stats.pain = Math.min(100, stats.pain + Math.max(8, mitigatedDamage * 1.4));
  const startedBleeding = Math.random() < bleedChance;
  if (startedBleeding) stats.bleeding = true;
  const infectedByHit = Math.random() < BALANCE.disease.zombieInfectionChance;
  if (infectedByHit) addInfection(stats, 10);
  return { damageTaken: mitigatedDamage, startedBleeding, infectedByHit };
}

export function applyItemEffects(stats: PlayerVitals, effect: { nutrition?: number; hydration?: number; heal?: number; stopsBleeding?: boolean; infectionRelief?: number; illnessRelief?: number; painRelief?: number; disinfect?: number; infectionRisk?: number; dirtyWaterRisk?: number; spoiledFoodRisk?: number }) {
  if (effect.nutrition) stats.hunger = Math.min(100, stats.hunger + effect.nutrition);
  if (effect.hydration) stats.thirst = Math.min(100, stats.thirst + effect.hydration);
  if (effect.heal) stats.hp = Math.min(100, stats.hp + effect.heal);
  if (effect.stopsBleeding) stats.bleeding = false;
  if (effect.infectionRelief || effect.disinfect) {
    stats.infection = Math.max(0, stats.infection - (effect.infectionRelief ?? 0) - (effect.disinfect ?? 0));
    if (stats.infection <= 0) stats.infected = false;
  }
  if (effect.illnessRelief) {
    stats.illness = Math.max(0, stats.illness - effect.illnessRelief);
    if (stats.illness <= 0) stats.sick = false;
  }
  if (effect.painRelief) stats.pain = Math.max(0, stats.pain - effect.painRelief);
  if (effect.infectionRisk && Math.random() < effect.infectionRisk) addInfection(stats, 8);
  if (effect.dirtyWaterRisk && Math.random() < effect.dirtyWaterRisk) addIllness(stats, 18);
  if (effect.spoiledFoodRisk && Math.random() < effect.spoiledFoodRisk) addIllness(stats, 22);
}

export function addInfection(stats: PlayerVitals, amount: number) {
  stats.infected = true;
  stats.infection = Math.min(100, stats.infection + amount);
}

export function addIllness(stats: PlayerVitals, amount: number) {
  stats.sick = true;
  stats.illness = Math.min(100, stats.illness + amount);
}
