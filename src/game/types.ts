export type ItemType =
  | 'food'
  | 'drink'
  | 'medical'
  | 'ammo'
  | 'melee_weapon'
  | 'ranged_weapon'
  | 'armor'
  | 'clothing'
  | 'backpack'
  | 'tool';

export type BuildingType = 'house' | 'market' | 'police' | 'military' | 'hospital' | 'workshop';
export type ZoneType = 'residential' | 'market' | 'police' | 'hospital' | 'industrial' | 'military' | 'forest' | 'road';
export type WeaponKind = 'melee' | 'ranged';
export type WeatherType = 'clear' | 'cloudy' | 'rain' | 'fog';
export type ItemCondition = 'new' | 'good' | 'worn' | 'damaged' | 'badly_damaged' | 'ruined';
export type FoodFreshness = 'fresh' | 'old' | 'spoiled';
export type ClothingSlot = 'head' | 'torso' | 'legs' | 'feet' | 'hands' | 'vest' | 'backpack';

export interface WeaponDefinition {
  kind: WeaponKind;
  damage: number;
  range: number;
  noiseRadius: number;
  fireRate: number;
  recoil?: number;
  malfunctionBaseChance?: number;
  ammoType?: string;
  magazineSize?: number;
  reloadTime?: number;
}

export interface ItemDefinition {
  id: string;
  name: string;
  type: ItemType;
  size: number;
  weight: number;
  maxStack: number;
  description: string;
  nutrition?: number;
  hydration?: number;
  dirtyWaterRisk?: number;
  spoiledFoodRisk?: number;
  heal?: number;
  painRelief?: number;
  infectionRelief?: number;
  illnessRelief?: number;
  disinfect?: number;
  stopsBleeding?: boolean;
  infectionRisk?: number;
  capacityBonus?: number;
  armor?: number;
  warmth?: number;
  rainProtection?: number;
  clothingSlot?: ClothingSlot;
  repairTags?: Array<'cloth' | 'leather' | 'tool' | 'weapon' | 'backpack'>;
  weapon?: WeaponDefinition;
}

export interface InventoryEntry {
  id: string;
  name: string;
  type: ItemType;
  count: number;
  size: number;
  weight: number;
  totalWeight: number;
  condition: ItemCondition;
  conditionLabel: string;
  freshness?: FoodFreshness;
  equipped: boolean;
  canUse: boolean;
  canEquip: boolean;
  description: string;
}

export interface InventorySaveData {
  items: Array<[string, number]>;
  equippedWeaponId: string | null;
  equippedArmorId: string | null;
  equippedBackpackId: string | null;
  itemDurability?: Record<string, number>;
  itemFreshness?: Record<string, FoodFreshness>;
  clothingSlots?: Partial<Record<ClothingSlot, string | null>>;
}

export interface PlayerVitals {
  hp: number;
  stamina: number;
  hunger: number;
  thirst: number;
  bleeding: boolean;
  infection: number;
  infected: boolean;
  bodyTemperature: number;
  wetness: number;
  cold: number;
  illness: number;
  sick: boolean;
  pain: number;
  unconscious: boolean;
  fracture: boolean;
}

export interface CraftingRecipeView {
  id: string;
  name: string;
  available: boolean;
  timeSeconds: number;
  missing: string[];
}

export interface HudState {
  hp: number;
  stamina: number;
  hunger: number;
  thirst: number;
  bleeding: boolean;
  infection: number;
  infected: boolean;
  bodyTemperature: number;
  wetness: number;
  cold: number;
  illness: number;
  sick: boolean;
  pain: number;
  unconscious: boolean;
  fracture: boolean;
  capacity: number;
  usedSlots: number;
  totalWeight: number;
  armor: number;
  warmth: number;
  rainProtection: number;
  weapon: string;
  weaponCondition: string;
  ammo: number;
  ammoText: string;
  currentBackpack: string;
  currentArmor: string;
  clothing: Record<ClothingSlot, string>;
  zombiesAlerted: number;
  interactionPrompt: string;
  message: string;
  warning: string;
  inventoryOpen: boolean;
  craftingOpen: boolean;
  craftingRecipes: CraftingRecipeView[];
  inventory: InventoryEntry[];
  timeText: string;
  weather: WeatherType;
  noiseLevel: string;
  actionLabel: string;
  actionProgress: number;
  nearbyFireWarmth: number;
  damageFlash: number;
}

export interface LootPoolEntry {
  itemId: string;
  weight: number;
  minCount?: number;
  maxCount?: number;
}

export interface LootSpotDefinition {
  pool: string;
  chance: number;
  label: string;
}

export interface SpawnedLoot {
  itemId: string;
  count: number;
}

export interface LootSpotSaveData {
  id: string;
  taken: boolean;
  itemId: string | null;
  count: number;
  respawnAt: number | null;
}

export interface SpawnZoneDefinition {
  id: string;
  type: ZoneType;
  position: { x: number; z: number };
  radius: number;
  maxZombies: number;
  spawnChance: number;
}

export interface CampfireSaveData {
  id: string;
  position: { x: number; y: number; z: number };
  burnTimeRemaining: number;
  lit: boolean;
}

export interface SaveGameState {
  version: 1;
  savedAt: number;
  player: {
    position: { x: number; y: number; z: number };
    yaw: number;
    pitch: number;
  };
  stats: PlayerVitals;
  inventory: InventorySaveData;
  magazines: Record<string, number>;
  lootSpots: LootSpotSaveData[];
  timeOfDay: number;
  weather: WeatherType;
  campfires?: CampfireSaveData[];
}
