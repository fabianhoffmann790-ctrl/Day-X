export const BALANCE = {
  world: {
    halfSize: 180,
    playerBounds: 174,
    houseCount: 8,
    treeCount: 180,
    abandonedVehicleCount: 18,
    fenceSegmentLength: 7
  },
  vitals: {
    hungerLossPerMinute: 1.05,
    thirstLossPerMinute: 1.75,
    starvationDamagePerSecond: 1.35,
    bleedingDamagePerSecond: 1.05,
    infectionGrowthPerSecond: 0.18,
    severeInfectionDamagePerSecond: 0.65,
    sprintStaminaPerSecond: 18,
    walkStaminaRegenPerSecond: 9,
    sneakStaminaRegenPerSecond: 12,
    jumpStaminaCost: 8,
    meleeStaminaCost: 6
  },
  zombie: {
    baseDamage: 19,
    bleedChance: 0.28,
    daySightRange: 18,
    nightSightRange: 24,
    alertedSightBonus: 6,
    hearingMultiplier: 1,
    wanderSpeed: 0.62,
    investigateSpeed: 1.45,
    chaseSpeed: 2.35,
    nightChaseSpeedBonus: 0.22,
    attackRange: 1.55,
    attackCooldownSeconds: 1.25,
    loseSightSeconds: 4.5,
    searchSeconds: 4
  },
  loot: {
    globalChanceMultiplier: 0.82,
    respawnDelaySeconds: 900,
    debugRespawnKey: 'F10'
  },
  weapons: {
    fallbackMeleeDamage: 12,
    fallbackMeleeRange: 1.7,
    fallbackMeleeNoiseRadius: 3,
    fallbackMeleeFireRate: 62,
    pistolShotNoiseRadius: 42,
    rifleShotNoiseRadius: 62
  },
  sound: {
    sneakNoiseRadius: 2.2,
    walkNoiseRadius: 7,
    sprintNoiseRadius: 18,
    jumpNoiseRadius: 12,
    inventoryNoiseRadius: 1.5,
    pickupNoiseRadius: 2.5,
    eatDrinkNoiseRadius: 2,
    reloadNoiseRadius: 8,
    painNoiseRadius: 10
  },
  dayNight: {
    dayLengthSeconds: 900,
    startTime: 8.25,
    nightStartHour: 20,
    nightEndHour: 5.5
  },
  weather: {
    changeCheckSeconds: 90,
    changeChance: 0.28,
    fogFarClear: 150,
    fogFarCloudy: 125,
    fogFarRain: 92,
    fogFarFog: 58
  }
} as const;
