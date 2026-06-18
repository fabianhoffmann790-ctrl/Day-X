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
export type DoorKind = 'house' | 'interior' | 'metal' | 'police' | 'military';
export type ContainerKind = 'cabinet' | 'fridge' | 'locker' | 'weapon_cabinet' | 'medical_cabinet' | 'toolbox' | 'military_crate' | 'vehicle_trunk' | 'trash' | 'ground_pack' | 'storage_box';
export type VehicleKind = 'car' | 'police_car' | 'ambulance' | 'military_truck' | 'van';
export type BuildableKind = 'wood_wall' | 'wood_gate' | 'barricade' | 'storage_box' | 'fence_segment' | 'sleeping_bag';
export type DynamicEventKind = 'helicopter_crash' | 'military_convoy' | 'smoke_signal' | 'rare_crate' | 'building_alarm';
export type EquipmentSlot = 'primary' | 'secondary' | 'melee' | 'head' | 'face' | 'torso' | 'vest' | 'hands' | 'legs' | 'feet' | 'backpack';
export type InventoryLocation = 'grid' | 'equipment';

export interface WeaponDefinition { kind: WeaponKind; damage: number; range: number; noiseRadius: number; fireRate: number; recoil?: number; malfunctionBaseChance?: number; ammoType?: string; magazineSize?: number; reloadTime?: number; }
export interface ItemDefinition { id: string; name: string; type: ItemType; size: number; weight: number; maxStack: number; description: string; nutrition?: number; hydration?: number; dirtyWaterRisk?: number; spoiledFoodRisk?: number; heal?: number; painRelief?: number; infectionRelief?: number; illnessRelief?: number; disinfect?: number; stopsBleeding?: boolean; infectionRisk?: number; capacityBonus?: number; armor?: number; warmth?: number; rainProtection?: number; clothingSlot?: ClothingSlot; repairTags?: Array<'cloth' | 'leather' | 'tool' | 'weapon' | 'backpack'>; accessKey?: string; weapon?: WeaponDefinition; }
export interface GridSize { cols: number; rows: number; }
export interface InventoryGridItem { instanceId: string; itemId: string; count: number; x: number; y: number; rotated: boolean; durability: number; freshness?: FoodFreshness; location: InventoryLocation; equipmentSlot?: EquipmentSlot | null; customData?: Record<string, unknown>; }
export interface GridItemView extends InventoryEntry { instanceId: string; itemId: string; x: number; y: number; w: number; h: number; rotated: boolean; maxStack: number; equipmentSlot?: EquipmentSlot | null; }
export interface InventoryEntry { id: string; instanceId?: string; itemId?: string; name: string; type: ItemType; count: number; size: number; weight: number; totalWeight: number; condition: ItemCondition; conditionLabel: string; freshness?: FoodFreshness; equipped: boolean; canUse: boolean; canEquip: boolean; description: string; }
export interface NearbyWorldItemView { id: string; itemId: string; name: string; type: ItemType; count: number; conditionLabel: string; distance: number; weight: number; totalWeight: number; description: string; rotated?: boolean; }
export interface HotbarSlot { slot: number; instanceId: string | null; itemId: string | null; label: string; }
export interface GridInventoryView { cols: number; rows: number; usedCells: number; freeCells: number; items: GridItemView[]; equipment: Partial<Record<EquipmentSlot, GridItemView | null>>; validationOk: boolean; validationErrors: string[]; }
export interface InventorySaveData { items: Array<[string, number]>; equippedWeaponId: string | null; equippedArmorId: string | null; equippedBackpackId: string | null; itemDurability?: Record<string, number>; itemFreshness?: Record<string, FoodFreshness>; clothingSlots?: Partial<Record<ClothingSlot, string | null>>; hotbar?: Array<[number, string | null]>; gridItems?: InventoryGridItem[]; equipmentSlots?: Partial<Record<EquipmentSlot, string | null>>; }
export interface PlayerVitals { hp: number; stamina: number; hunger: number; thirst: number; bleeding: boolean; infection: number; infected: boolean; bodyTemperature: number; wetness: number; cold: number; illness: number; sick: boolean; pain: number; unconscious: boolean; fracture: boolean; }
export interface CraftingRecipeView { id: string; name: string; available: boolean; timeSeconds: number; missing: string[]; }
export interface DebugHudState { godMode: boolean; debugPanelOpen: boolean; playerPosition: string; zombieCount: number; lootSpotCount: number; droppedItemCount: number; gridFreeCells?: number; gridUsedCells?: number; worldOverlapWarnings?: number; showFps?: boolean; }

export interface HudState {
  hp: number; stamina: number; hunger: number; thirst: number; bleeding: boolean; infection: number; infected: boolean; bodyTemperature: number; wetness: number; cold: number; illness: number; sick: boolean; pain: number; unconscious: boolean; fracture: boolean;
  capacity: number; usedSlots: number; totalWeight: number; armor: number; warmth: number; rainProtection: number;
  weapon: string; weaponCondition: string; ammo: number; ammoText: string; currentBackpack: string; currentArmor: string; clothing: Record<ClothingSlot, string>;
  zombiesAlerted: number; interactionPrompt: string; message: string; warning: string; inventoryOpen: boolean; craftingOpen: boolean; craftingRecipes: CraftingRecipeView[]; inventory: InventoryEntry[]; gridInventory?: GridInventoryView;
  selectedItemId: string | null; hotbar: HotbarSlot[]; debug: DebugHudState;
  fps: number; frameMs: number; showFps: boolean; nearbyItems: NearbyWorldItemView[];
  timeText: string; weather: WeatherType; noiseLevel: string; actionLabel: string; actionProgress: number; nearbyFireWarmth: number; damageFlash: number;
  worldPrompt: string; locationName: string; eventHint: string; compassHeading: string; mapOpen: boolean; buildMode: boolean; selectedBuildable: string; storageOpen: boolean; storageTitle: string; storageUsed: number; storageCapacity: number; storageItems: InventoryEntry[];
}

export interface LootPoolEntry { itemId: string; weight: number; minCount?: number; maxCount?: number; }
export interface LootSpotDefinition { pool: string; chance: number; label: string; }
export interface SpawnedLoot { itemId: string; count: number; }
export interface LootSpotSaveData { id: string; taken: boolean; itemId: string | null; count: number; respawnAt: number | null; }
export interface SpawnZoneDefinition { id: string; type: ZoneType; position: { x: number; z: number }; radius: number; maxZombies: number; spawnChance: number; }
export interface CampfireSaveData { id: string; position: { x: number; y: number; z: number }; burnTimeRemaining: number; lit: boolean; }
export interface DoorSaveData { id: string; open: boolean; locked: boolean; breached: boolean; hp: number; }
export interface ContainerSaveData { id: string; opened: boolean; searched: boolean; locked: boolean; items: Array<[string, number]>; }
export interface PlacedObjectSaveData { id: string; kind: BuildableKind; position: { x: number; y: number; z: number }; yaw: number; hp: number; items?: Array<[string, number]>; }
export interface DynamicEventSaveData { id: string; kind: DynamicEventKind; active: boolean; discovered: boolean; position: { x: number; z: number }; searched: boolean; timeRemaining: number; }
export interface HordeSaveData { id: string; position: { x: number; z: number }; target: { x: number; z: number }; size: number; active: boolean; }
export interface PersistentWorldSaveData { doors: DoorSaveData[]; containers: ContainerSaveData[]; placedObjects: PlacedObjectSaveData[]; dynamicEvents: DynamicEventSaveData[]; hordes: HordeSaveData[]; discoveredHints: string[]; }
export interface DroppedItemSaveData { id: string; itemId: string; count: number; position: { x: number; y: number; z: number }; durability?: number; rotated?: boolean; customData?: Record<string, unknown>; }
export interface SaveGameState { version: 1; savedAt: number; player: { position: { x: number; y: number; z: number }; yaw: number; pitch: number }; stats: PlayerVitals; inventory: InventorySaveData; magazines: Record<string, number>; lootSpots: LootSpotSaveData[]; timeOfDay: number; weather: WeatherType; campfires?: CampfireSaveData[]; persistentWorld?: PersistentWorldSaveData; droppedItems?: DroppedItemSaveData[]; selectedItemId?: string | null; respawnPoint?: { x: number; y: number; z: number }; }