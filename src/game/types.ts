export type ItemType = 'food' | 'drink' | 'medical' | 'weapon' | 'ammo' | 'backpack' | 'armor' | 'tool';
export type BuildingType = 'house' | 'market' | 'police' | 'military' | 'hospital' | 'workshop';
export type WeaponKind = 'melee' | 'ranged';

export interface ItemDefinition {
  id: string;
  name: string;
  type: ItemType;
  size: number;
  nutrition?: number;
  hydration?: number;
  heal?: number;
  stopsBleeding?: boolean;
  capacityBonus?: number;
  armor?: number;
  weapon?: {
    kind: WeaponKind;
    damage: number;
    range: number;
    noise: number;
    ammoType?: string;
  };
}

export interface InventoryEntry {
  id: string;
  name: string;
  count: number;
}

export interface HudState {
  hp: number;
  stamina: number;
  hunger: number;
  thirst: number;
  bleeding: boolean;
  capacity: number;
  usedSlots: number;
  armor: number;
  weapon: string;
  ammo: number;
  zombiesAlerted: number;
  message: string;
  inventoryOpen: boolean;
  inventory: InventoryEntry[];
}

export interface LootPoolEntry {
  itemId: string;
  weight: number;
}

export interface LootSpotDefinition {
  pool: string;
  chance: number;
}
