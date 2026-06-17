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
    meleeStaminaCost: 6,
    wetnessRainGainPerSecond: 1.25,
    wetnessDryPerSecond: 0.22,
    temperatureLossRainWetness: 0.018,
    temperatureLossNight: 0.012,
    coldHpDamagePerSecond: 0.55,
    coldStaminaDrainPerSecond: 1.2,
    painStaminaRegenPenalty: 0.45,
    illnessStaminaPenalty: 0.25,
    unconsciousTemperature: 32.5,
    fractureSprintPenalty: 0.5
  },
  clothing: {
    warmthToTemperatureProtection: 0.03,
    rainProtectionToWetnessReduction: 0.008,
    ruinedEffectMultiplier: 0,
    badlyDamagedEffectMultiplier: 0.35,
    damagedEffectMultiplier: 0.55,
    wornEffectMultiplier: 0.75,
    goodEffectMultiplier: 0.92,
    newEffectMultiplier: 1
  },
  disease: {
    zombieInfectionChance: 0.12,
    untreatedBleedInfectionChancePerSecond: 0.002,
    spoiledFoodIllnessChance: 0.34,
    dirtyWaterIllnessChance: 0.3,
    dirtyRagInfectionChance: 0.2,
    antibioticsRelief: 34,
    disinfectantRelief: 20,
    painkillerRelief: 36
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
    rifleShotNoiseRadius: 62,
    conditionLossMelee: 1.6,
    conditionLossShot: 0.8,
    malfunctionConditionMultiplier: 0.28
  },
  repair: {
    sewingKitAmount: 34,
    ductTapeAmount: 20,
    toolboxAmount: 28,
    weaponCleaningAmount: 32,
    ruinedRepairAllowed: false
  },
  crafting: {
    defaultTimeSeconds: 3,
    ragTimeSeconds: 2,
    bandageTimeSeconds: 3,
    torchTimeSeconds: 4,
    campfireTimeSeconds: 5,
    backpackTimeSeconds: 7,
    spearTimeSeconds: 5,
    repairTimeSeconds: 4,
    boilWaterPreparedTimeSeconds: 5
  },
  fire: {
    burnDurationSeconds: 300,
    warmthRadius: 8,
    warmthPerSecond: 0.08,
    lightIntensity: 1.25,
    noiseRadius: 5
  },
  weight: {
    comfortableKg: 18,
    heavyKg: 32,
    staminaDrainHeavyMultiplier: 1.45,
    staminaRegenHeavyMultiplier: 0.62,
    sprintSpeedHeavyMultiplier: 0.82
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
    fogFarFog: 58,
    clearTemperature: 16,
    cloudyTemperature: 12,
    rainTemperature: 8,
    fogTemperature: 6,
    nightTemperaturePenalty: -6
  }
} as const;
