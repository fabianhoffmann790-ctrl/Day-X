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
export type WeaponKind = 'melee' | 'ranged';

export interface WeaponDefinition {
  kind: WeaponKind;
  damage: number;
  range: number;
  noiseRadius: number;
  fireRate: number;
  ammoType?: string;
  magazineSize?: number;
  reloadTime?: number;
}

export interface ItemDefinition {
  id: string;
  name: string;
  type: ItemType;
  size: number;
  maxStack: number;
  description: string;
  nutrition?: number;
  hydration?: number;
  heal?: number;
  infectionRelief?: number;
  stopsBleeding?: boolean;
  capacityBonus?: number;
  armor?: number;
  weapon?: WeaponDefinition;
}

export interface InventoryEntry {
  id: string;
  name: string;
  type: ItemType;
  count: number;
  size: number;
  equipped: boolean;
  canUse: boolean;
  canEquip: boolean;
}

export interface InventorySaveData {
  items: Array<[string, number]>;
  equippedWeaponId: string | null;
  equippedArmorId: string | null;
  equippedBackpackId: string | null;
}

export interface PlayerVitals {
  hp: number;
  stamina: number;
  hunger: number;
  thirst: number;
  bleeding: boolean;
  infection: number;
  infected: boolean;
}

export interface HudState {
  hp: number;
  stamina: number;
  hunger: number;
  thirst: number;
  bleeding: boolean;
  infection: number;
  infected: boolean;
  capacity: number;
  usedSlots: number;
  armor: number;
  weapon: string;
  ammo: number;
  ammoText: string;
  zombiesAlerted: number;
  interactionPrompt: string;
  message: string;
  inventoryOpen: boolean;
  inventory: InventoryEntry[];
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
}
