import type { BuildingType, ItemDefinition, LootPoolEntry, LootSpotDefinition } from './types';

export const ITEMS: Record<string, ItemDefinition> = {
  canned_food: {
    id: 'canned_food', name: 'Konservendose', type: 'food', size: 1, maxStack: 4,
    description: 'Haltbare Nahrung. Nicht lecker, aber zuverlässig.', nutrition: 30
  },
  beans: {
    id: 'beans', name: 'Bohnendose', type: 'food', size: 1, maxStack: 4,
    description: 'Sättigt gut und ist lange haltbar.', nutrition: 34
  },
  crackers: {
    id: 'crackers', name: 'Trockene Cracker', type: 'food', size: 1, maxStack: 6,
    description: 'Leicht, trocken und besser als nichts.', nutrition: 14
  },
  energy_bar: {
    id: 'energy_bar', name: 'Energieriegel', type: 'food', size: 0.5, maxStack: 8,
    description: 'Kleine schnelle Kalorien für unterwegs.', nutrition: 18
  },
  water_bottle: {
    id: 'water_bottle', name: 'Wasserflasche', type: 'drink', size: 1, maxStack: 4,
    description: 'Sauberes Trinkwasser. In dieser Welt sehr wertvoll.', hydration: 34
  },
  soda: {
    id: 'soda', name: 'Limonade', type: 'drink', size: 1, maxStack: 4,
    description: 'Stillt Durst etwas und liefert Zucker.', hydration: 20, nutrition: 5
  },
  sports_drink: {
    id: 'sports_drink', name: 'Isodrink', type: 'drink', size: 1, maxStack: 3,
    description: 'Gleicht Durst aus und hilft nach langen Märschen.', hydration: 28
  },
  bandage: {
    id: 'bandage', name: 'Verband', type: 'medical', size: 1, maxStack: 6,
    description: 'Stoppt Blutungen und stabilisiert leichte Wunden.', heal: 6, stopsBleeding: true
  },
  painkillers: {
    id: 'painkillers', name: 'Schmerzmittel', type: 'medical', size: 1, maxStack: 3,
    description: 'Heilt eine kleine Menge HP. Infektionssystem ist vorbereitet.', heal: 14, infectionRelief: 2
  },
  antibiotics: {
    id: 'antibiotics', name: 'Antibiotika', type: 'medical', size: 1, maxStack: 2,
    description: 'Noch selten relevant, aber für spätere Infektionen vorbereitet.', heal: 4, infectionRelief: 24
  },
  blood_bag: {
    id: 'blood_bag', name: 'Blutbeutel', type: 'medical', size: 1, maxStack: 2,
    description: 'Starker medizinischer Gegenstand. Stoppt Blutung und gibt HP zurück.', heal: 34, stopsBleeding: true
  },
  kitchen_knife: {
    id: 'kitchen_knife', name: 'Küchenmesser', type: 'melee_weapon', size: 1, maxStack: 1,
    description: 'Kurze Nahkampfwaffe. Leise, aber riskant.',
    weapon: { kind: 'melee', damage: 24, range: 2.0, noiseRadius: 3, fireRate: 72 }
  },
  crowbar: {
    id: 'crowbar', name: 'Brechstange', type: 'melee_weapon', size: 2, maxStack: 1,
    description: 'Schwere Nahkampfwaffe und später nützlich für Türen.',
    weapon: { kind: 'melee', damage: 38, range: 2.25, noiseRadius: 5, fireRate: 52 }
  },
  hatchet: {
    id: 'hatchet', name: 'Beil', type: 'melee_weapon', size: 2, maxStack: 1,
    description: 'Gefährlich im Nahkampf, aber langsam.',
    weapon: { kind: 'melee', damage: 46, range: 2.1, noiseRadius: 5, fireRate: 42 }
  },
  pistol: {
    id: 'pistol', name: 'Abgenutzte Pistole', type: 'ranged_weapon', size: 2, maxStack: 1,
    description: 'Handlich, laut und nur mit 9mm Munition sinnvoll.',
    weapon: { kind: 'ranged', damage: 45, range: 46, noiseRadius: 42, fireRate: 260, ammoType: 'ammo_9mm', magazineSize: 12, reloadTime: 1.45 }
  },
  rifle: {
    id: 'rifle', name: 'Altes Gewehr', type: 'ranged_weapon', size: 4, maxStack: 1,
    description: 'Hohe Reichweite und Schaden. Jeder Schuss kann eine Horde anziehen.',
    weapon: { kind: 'ranged', damage: 82, range: 80, noiseRadius: 62, fireRate: 90, ammoType: 'ammo_556', magazineSize: 5, reloadTime: 2.2 }
  },
  ammo_9mm: {
    id: 'ammo_9mm', name: '9mm Patrone', type: 'ammo', size: 0.15, maxStack: 60,
    description: 'Munition für Pistolen.'
  },
  ammo_556: {
    id: 'ammo_556', name: '5.56 Patrone', type: 'ammo', size: 0.2, maxStack: 40,
    description: 'Munition für Gewehre.'
  },
  hoodie: {
    id: 'hoodie', name: 'Dicker Hoodie', type: 'clothing', size: 2, maxStack: 1,
    description: 'Kaum Schutz, aber besser als ein T-Shirt.', armor: 0.08
  },
  work_jacket: {
    id: 'work_jacket', name: 'Arbeitsjacke', type: 'clothing', size: 2, maxStack: 1,
    description: 'Robuste Kleidung mit minimalem Schutz.', armor: 0.12
  },
  tactical_vest: {
    id: 'tactical_vest', name: 'Schutzweste', type: 'armor', size: 3, maxStack: 1,
    description: 'Reduziert eingehenden Schaden spürbar.', armor: 0.28
  },
  plate_carrier: {
    id: 'plate_carrier', name: 'Plattenträger', type: 'armor', size: 4, maxStack: 1,
    description: 'Schwere Rüstung. Sehr guter Schutz, aber selten.', armor: 0.48
  },
  small_backpack: {
    id: 'small_backpack', name: 'Kleiner Rucksack', type: 'backpack', size: 1, maxStack: 1,
    description: 'Erhöht die Inventarkapazität leicht.', capacityBonus: 8
  },
  hiking_backpack: {
    id: 'hiking_backpack', name: 'Wanderrucksack', type: 'backpack', size: 2, maxStack: 1,
    description: 'Guter Rucksack für lange Lootrunden.', capacityBonus: 16
  },
  field_pack: {
    id: 'field_pack', name: 'Großer Militärrucksack', type: 'backpack', size: 3, maxStack: 1,
    description: 'Sehr viel Stauraum. In Militärbereichen am wahrscheinlichsten.', capacityBonus: 24
  },
  radio: {
    id: 'radio', name: 'Funkgerät', type: 'tool', size: 1, maxStack: 1,
    description: 'Werkzeug/Story-Gegenstand für spätere Systeme.'
  },
  duct_tape: {
    id: 'duct_tape', name: 'Panzertape', type: 'tool', size: 1, maxStack: 4,
    description: 'Reparaturmaterial für spätere Crafting- und Reparatursysteme.'
  },
  wrench: {
    id: 'wrench', name: 'Schraubenschlüssel', type: 'tool', size: 1, maxStack: 1,
    description: 'Werkzeug und improvisierte Waffe für spätere Systeme.'
  },
  scrap_parts: {
    id: 'scrap_parts', name: 'Ersatzteile', type: 'tool', size: 1, maxStack: 8,
    description: 'Reparaturmaterial. Wird später für Waffen- und Ausrüstungszustand genutzt.'
  }
};

export const LOOT_POOLS: Record<string, LootPoolEntry[]> = {
  residential_common: [
    { itemId: 'canned_food', weight: 14 }, { itemId: 'crackers', weight: 12 }, { itemId: 'water_bottle', weight: 12 },
    { itemId: 'hoodie', weight: 8 }, { itemId: 'bandage', weight: 5 }, { itemId: 'energy_bar', weight: 6 },
    { itemId: 'soda', weight: 5 }
  ],
  residential_rare: [
    { itemId: 'kitchen_knife', weight: 8 }, { itemId: 'small_backpack', weight: 7 }, { itemId: 'work_jacket', weight: 5 },
    { itemId: 'painkillers', weight: 4 }, { itemId: 'ammo_9mm', weight: 2, minCount: 2, maxCount: 5 }
  ],
  supermarket_food: [
    { itemId: 'canned_food', weight: 24 }, { itemId: 'beans', weight: 20 }, { itemId: 'crackers', weight: 18 },
    { itemId: 'energy_bar', weight: 14 }, { itemId: 'water_bottle', weight: 24 }, { itemId: 'soda', weight: 18 },
    { itemId: 'sports_drink', weight: 10 }, { itemId: 'bandage', weight: 2 }
  ],
  police_weapons: [
    { itemId: 'pistol', weight: 9 }, { itemId: 'tactical_vest', weight: 5 }, { itemId: 'radio', weight: 8 },
    { itemId: 'bandage', weight: 4 }, { itemId: 'painkillers', weight: 3 }
  ],
  police_ammo: [
    { itemId: 'ammo_9mm', weight: 26, minCount: 4, maxCount: 10 }, { itemId: 'pistol', weight: 3 },
    { itemId: 'tactical_vest', weight: 3 }, { itemId: 'water_bottle', weight: 4 }
  ],
  military_weapons: [
    { itemId: 'rifle', weight: 8 }, { itemId: 'pistol', weight: 5 }, { itemId: 'ammo_556', weight: 18, minCount: 4, maxCount: 10 },
    { itemId: 'ammo_9mm', weight: 8, minCount: 4, maxCount: 10 }
  ],
  military_armor: [
    { itemId: 'plate_carrier', weight: 8 }, { itemId: 'tactical_vest', weight: 10 }, { itemId: 'field_pack', weight: 7 },
    { itemId: 'hiking_backpack', weight: 5 }, { itemId: 'bandage', weight: 6 }
  ],
  hospital_medical: [
    { itemId: 'bandage', weight: 24 }, { itemId: 'painkillers', weight: 16 }, { itemId: 'blood_bag', weight: 8 },
    { itemId: 'antibiotics', weight: 5 }, { itemId: 'water_bottle', weight: 5 }
  ],
  industrial_tools: [
    { itemId: 'crowbar', weight: 8 }, { itemId: 'hatchet', weight: 6 }, { itemId: 'wrench', weight: 13 },
    { itemId: 'duct_tape', weight: 14 }, { itemId: 'scrap_parts', weight: 16, minCount: 1, maxCount: 4 },
    { itemId: 'small_backpack', weight: 3 }
  ]
};

export const BUILDING_LOOT: Record<BuildingType, LootSpotDefinition[]> = {
  house: [
    { pool: 'residential_common', chance: 0.48, label: 'Küchenschrank' },
    { pool: 'residential_common', chance: 0.38, label: 'Kommode' },
    { pool: 'residential_rare', chance: 0.16, label: 'Abstellkammer' }
  ],
  market: [
    { pool: 'supermarket_food', chance: 0.84, label: 'Lebensmittelregal' },
    { pool: 'supermarket_food', chance: 0.78, label: 'Getränkekiste' },
    { pool: 'supermarket_food', chance: 0.72, label: 'Kassenbereich' },
    { pool: 'hospital_medical', chance: 0.16, label: 'Erste-Hilfe-Ecke' }
  ],
  police: [
    { pool: 'police_weapons', chance: 0.62, label: 'Waffenschrank' },
    { pool: 'police_ammo', chance: 0.68, label: 'Munitionsspind' },
    { pool: 'police_weapons', chance: 0.36, label: 'Asservatenkiste' },
    { pool: 'residential_common', chance: 0.18, label: 'Pausenraum' }
  ],
  military: [
    { pool: 'military_weapons', chance: 0.68, label: 'Waffenkiste' },
    { pool: 'military_armor', chance: 0.62, label: 'Ausrüstungskiste' },
    { pool: 'military_weapons', chance: 0.44, label: 'Munitionskiste' },
    { pool: 'hospital_medical', chance: 0.20, label: 'Sanitätsrucksack' }
  ],
  hospital: [
    { pool: 'hospital_medical', chance: 0.86, label: 'Medizinschrank' },
    { pool: 'hospital_medical', chance: 0.78, label: 'Behandlungswagen' },
    { pool: 'hospital_medical', chance: 0.70, label: 'Notfalltasche' },
    { pool: 'supermarket_food', chance: 0.12, label: 'Personalraum' }
  ],
  workshop: [
    { pool: 'industrial_tools', chance: 0.72, label: 'Werkzeugbank' },
    { pool: 'industrial_tools', chance: 0.58, label: 'Materialkiste' },
    { pool: 'residential_rare', chance: 0.22, label: 'Spind' }
  ]
};
