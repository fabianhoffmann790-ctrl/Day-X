import type { BuildingType, ItemDefinition, LootPoolEntry, LootSpotDefinition } from './types';

export const ITEMS: Record<string, ItemDefinition> = {
  canned_food: { id: 'canned_food', name: 'Konservendose', type: 'food', size: 1, nutrition: 28 },
  crackers: { id: 'crackers', name: 'Trockene Cracker', type: 'food', size: 1, nutrition: 14 },
  water_bottle: { id: 'water_bottle', name: 'Wasserflasche', type: 'drink', size: 1, hydration: 30 },
  soda: { id: 'soda', name: 'Limonade', type: 'drink', size: 1, hydration: 18, nutrition: 5 },
  bandage: { id: 'bandage', name: 'Verband', type: 'medical', size: 1, heal: 8, stopsBleeding: true },
  painkillers: { id: 'painkillers', name: 'Schmerzmittel', type: 'medical', size: 1, heal: 16 },
  blood_bag: { id: 'blood_bag', name: 'Blutbeutel', type: 'medical', size: 1, heal: 34, stopsBleeding: true },
  kitchen_knife: { id: 'kitchen_knife', name: 'Küchenmesser', type: 'weapon', size: 1, weapon: { kind: 'melee', damage: 22, range: 2, noise: 0.1 } },
  crowbar: { id: 'crowbar', name: 'Brechstange', type: 'weapon', size: 2, weapon: { kind: 'melee', damage: 34, range: 2.25, noise: 0.2 } },
  pistol: { id: 'pistol', name: 'Abgenutzte Pistole', type: 'weapon', size: 2, weapon: { kind: 'ranged', damage: 45, range: 42, noise: 1, ammoType: 'ammo_9mm' } },
  rifle: { id: 'rifle', name: 'Altes Jagdgewehr', type: 'weapon', size: 4, weapon: { kind: 'ranged', damage: 80, range: 75, noise: 1.3, ammoType: 'ammo_556' } },
  ammo_9mm: { id: 'ammo_9mm', name: '9mm Patrone', type: 'ammo', size: 0.2 },
  ammo_556: { id: 'ammo_556', name: '5.56 Patrone', type: 'ammo', size: 0.25 },
  small_backpack: { id: 'small_backpack', name: 'Kleiner Rucksack', type: 'backpack', size: 1, capacityBonus: 8 },
  hiking_backpack: { id: 'hiking_backpack', name: 'Wanderrucksack', type: 'backpack', size: 2, capacityBonus: 16 },
  tactical_vest: { id: 'tactical_vest', name: 'Schutzweste', type: 'armor', size: 3, armor: 0.28 },
  plate_carrier: { id: 'plate_carrier', name: 'Plattenträger', type: 'armor', size: 4, armor: 0.48 },
  radio: { id: 'radio', name: 'Funkgerät', type: 'tool', size: 1 },
  duct_tape: { id: 'duct_tape', name: 'Panzertape', type: 'tool', size: 1 },
  wrench: { id: 'wrench', name: 'Schraubenschlüssel', type: 'tool', size: 1 }
};

export const LOOT_POOLS: Record<string, LootPoolEntry[]> = {
  basic_home: [
    { itemId: 'canned_food', weight: 16 }, { itemId: 'crackers', weight: 16 }, { itemId: 'water_bottle', weight: 14 },
    { itemId: 'kitchen_knife', weight: 3 }, { itemId: 'small_backpack', weight: 3 }, { itemId: 'bandage', weight: 3 }
  ],
  supermarket: [
    { itemId: 'canned_food', weight: 22 }, { itemId: 'crackers', weight: 18 }, { itemId: 'water_bottle', weight: 20 },
    { itemId: 'soda', weight: 16 }, { itemId: 'bandage', weight: 2 }
  ],
  police: [
    { itemId: 'pistol', weight: 7 }, { itemId: 'ammo_9mm', weight: 16 }, { itemId: 'tactical_vest', weight: 5 },
    { itemId: 'radio', weight: 8 }, { itemId: 'bandage', weight: 4 }, { itemId: 'water_bottle', weight: 4 }
  ],
  military: [
    { itemId: 'rifle', weight: 7 }, { itemId: 'ammo_556', weight: 20 }, { itemId: 'plate_carrier', weight: 8 },
    { itemId: 'hiking_backpack', weight: 7 }, { itemId: 'tactical_vest', weight: 7 }, { itemId: 'bandage', weight: 5 }
  ],
  hospital: [
    { itemId: 'bandage', weight: 18 }, { itemId: 'painkillers', weight: 14 }, { itemId: 'blood_bag', weight: 7 },
    { itemId: 'water_bottle', weight: 6 }, { itemId: 'soda', weight: 3 }
  ],
  workshop: [
    { itemId: 'crowbar', weight: 8 }, { itemId: 'wrench', weight: 14 }, { itemId: 'duct_tape', weight: 12 },
    { itemId: 'kitchen_knife', weight: 4 }, { itemId: 'small_backpack', weight: 2 }
  ]
};

export const BUILDING_LOOT: Record<BuildingType, LootSpotDefinition[]> = {
  house: [{ pool: 'basic_home', chance: 0.42 }, { pool: 'basic_home', chance: 0.32 }, { pool: 'basic_home', chance: 0.18 }],
  market: [{ pool: 'supermarket', chance: 0.76 }, { pool: 'supermarket', chance: 0.72 }, { pool: 'supermarket', chance: 0.62 }, { pool: 'hospital', chance: 0.12 }],
  police: [{ pool: 'police', chance: 0.62 }, { pool: 'police', chance: 0.52 }, { pool: 'basic_home', chance: 0.2 }],
  military: [{ pool: 'military', chance: 0.64 }, { pool: 'military', chance: 0.54 }, { pool: 'police', chance: 0.28 }],
  hospital: [{ pool: 'hospital', chance: 0.82 }, { pool: 'hospital', chance: 0.74 }, { pool: 'hospital', chance: 0.64 }, { pool: 'basic_home', chance: 0.12 }],
  workshop: [{ pool: 'workshop', chance: 0.66 }, { pool: 'workshop', chance: 0.48 }, { pool: 'basic_home', chance: 0.14 }]
};
