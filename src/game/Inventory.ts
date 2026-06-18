import { BALANCE } from './Balance';
import { ITEMS } from './data';
import { backpackGridSize, canPlace, equipmentSlotForItem, firstFreePosition, itemGridSize, validateGrid } from './InventoryGrid';
import type { ClothingSlot, EquipmentSlot, FoodFreshness, GridInventoryView, GridItemView, GridSize, HotbarSlot, InventoryEntry, InventoryGridItem, InventorySaveData, ItemCondition, ItemDefinition, ItemType } from './types';

const WEAPON_TYPES: ItemType[] = ['melee_weapon', 'ranged_weapon'];
const EQUIPPABLE_TYPES: ItemType[] = ['melee_weapon', 'ranged_weapon', 'armor', 'clothing', 'backpack'];
const USABLE_TYPES: ItemType[] = ['food', 'drink', 'medical'];
const CLOTHING_SLOTS: ClothingSlot[] = ['head', 'torso', 'legs', 'feet', 'hands', 'vest', 'backpack'];
const EQUIPMENT_SLOTS: EquipmentSlot[] = ['primary', 'secondary', 'melee', 'head', 'face', 'torso', 'vest', 'hands', 'legs', 'feet', 'backpack'];
const isWeapon = (item: ItemDefinition) => WEAPON_TYPES.includes(item.type);
const defaultHotbar = () => new Map<number, string | null>(Array.from({ length: BALANCE.inventoryConfig.hotbarSlots }, (_, index): [number, string | null] => [index + 1, null]));
const defaultEquipment = () => new Map<EquipmentSlot, string | null>(EQUIPMENT_SLOTS.map((slot): [EquipmentSlot, string | null] => [slot, null]));

export function conditionFromDurability(value: number): ItemCondition { if (value <= 0) return 'ruined'; if (value < 20) return 'badly_damaged'; if (value < 40) return 'damaged'; if (value < 65) return 'worn'; if (value < 90) return 'good'; return 'new'; }
export function conditionLabel(condition: ItemCondition) { return { new: 'neu', good: 'gut', worn: 'abgenutzt', damaged: 'beschädigt', badly_damaged: 'stark beschädigt', ruined: 'ruiniert' }[condition]; }
export function conditionMultiplierFromDurability(value: number) { const condition = conditionFromDurability(value); if (condition === 'ruined') return BALANCE.clothing.ruinedEffectMultiplier; if (condition === 'badly_damaged') return BALANCE.clothing.badlyDamagedEffectMultiplier; if (condition === 'damaged') return BALANCE.clothing.damagedEffectMultiplier; if (condition === 'worn') return BALANCE.clothing.wornEffectMultiplier; if (condition === 'good') return BALANCE.clothing.goodEffectMultiplier; return BALANCE.clothing.newEffectMultiplier; }

export interface AddItemResult { accepted: number; remaining: number; message: string; instanceIds: string[]; }

export class Inventory {
  private items = new Map<string, InventoryGridItem>();
  private hotbarSlots = defaultHotbar();
  private equipmentSlots = defaultEquipment();
  public equippedWeaponId: string | null = null;
  public equippedArmorId: string | null = null;
  public equippedBackpackId: string | null = null;

  get gridSize(): GridSize { return backpackGridSize(this.equippedBackpackId); }
  get capacity() { const grid = this.gridSize; return grid.cols * grid.rows; }
  get usedSlots() { return this.gridItems().reduce((sum, item) => sum + itemGridSize(item.itemId, item.rotated).cols * itemGridSize(item.itemId, item.rotated).rows, 0); }
  get totalWeight() { return Math.round([...this.items.values()].reduce((weight, instance) => weight + (ITEMS[instance.itemId]?.weight ?? 1) * instance.count, 0) * 10) / 10; }
  get armor() { let total = 0; for (const instanceId of this.equipmentSlots.values()) { const instance = instanceId ? this.items.get(instanceId) : null; if (!instance) continue; total += (ITEMS[instance.itemId]?.armor ?? 0) * this.conditionMultiplier(instance.instanceId); } return Math.min(0.68, total); }
  get warmth() { let total = 0; for (const instanceId of this.equipmentSlots.values()) { const instance = instanceId ? this.items.get(instanceId) : null; if (!instance) continue; total += (ITEMS[instance.itemId]?.warmth ?? 0) * this.conditionMultiplier(instance.instanceId); } return Math.round(total); }
  get rainProtection() { let total = 0; for (const instanceId of this.equipmentSlots.values()) { const instance = instanceId ? this.items.get(instanceId) : null; if (!instance) continue; total += (ITEMS[instance.itemId]?.rainProtection ?? 0) * this.conditionMultiplier(instance.instanceId); } return Math.round(Math.min(100, total)); }

  add(itemId: string, count = 1) { return this.addWithResult(itemId, count).remaining === 0; }
  addWithResult(itemId: string, count = 1): AddItemResult {
    const item = ITEMS[itemId];
    if (!item || count <= 0) return { accepted: 0, remaining: count, message: 'Unbekanntes Item.', instanceIds: [] };
    let remaining = count;
    const instanceIds: string[] = [];
    if (item.maxStack > 1) {
      for (const instance of this.gridItems().filter((entry) => entry.itemId === itemId && entry.count < item.maxStack)) {
        const add = Math.min(remaining, item.maxStack - instance.count);
        instance.count += add; remaining -= add; instanceIds.push(instance.instanceId);
        if (remaining <= 0) return { accepted: count, remaining: 0, message: `Stack aufgefüllt: ${item.name}.`, instanceIds };
      }
    }
    while (remaining > 0) {
      const stackCount = item.maxStack > 1 ? Math.min(remaining, item.maxStack) : 1;
      const instance = this.createInstance(itemId, stackCount);
      const position = firstFreePosition(this.gridItems(), this.gridSize, instance, false);
      if (!position) return { accepted: count - remaining, remaining, message: count === remaining ? `Inventar voll: ${item.name} bleibt liegen.` : `Teilweise aufgenommen: ${count - remaining}/${count}, Rest bleibt liegen.`, instanceIds };
      instance.x = position.x; instance.y = position.y; instance.rotated = position.rotated; this.items.set(instance.instanceId, instance); instanceIds.push(instance.instanceId); remaining -= stackCount;
      if (item.maxStack <= 1) continue;
    }
    this.autoAssignHotbar(instanceIds[0]);
    const first = this.items.get(instanceIds[0]);
    if (first && isWeapon(item) && !this.equippedWeaponId) this.equip(first.instanceId);
    if (first && (item.type === 'armor' || item.type === 'clothing') && this.isBetterArmor(first.instanceId)) this.equip(first.instanceId);
    if (first && item.type === 'backpack' && this.isBetterBackpack(first.instanceId)) this.equip(first.instanceId);
    return { accepted: count, remaining: 0, message: `Aufgenommen: ${item.name}${count > 1 ? ` x${count}` : ''}.`, instanceIds };
  }

  canAdd(itemId: string, count = 1) { return this.addProbe(itemId, count); }
  remove(ref: string, count = 1) { const target = this.resolve(ref); if (target) return this.removeFromInstance(target, count); let remaining = count; for (const instance of [...this.items.values()].filter((entry) => entry.itemId === ref)) { const remove = Math.min(instance.count, remaining); this.removeFromInstance(instance, remove); remaining -= remove; if (remaining <= 0) return true; } return false; }
  removeOneForDrop(ref: string) { return this.remove(ref, 1); }
  count(itemId: string) { return [...this.items.values()].filter((entry) => entry.itemId === itemId).reduce((sum, entry) => sum + entry.count, 0); }
  has(itemId: string, count = 1) { return this.count(itemId) >= count; }
  hasRef(ref: string) { return Boolean(this.resolve(ref)); }
  itemIdOf(ref: string | null | undefined) { return ref ? this.resolve(ref)?.itemId ?? (ITEMS[ref] ? ref : null) : null; }
  definitionOf(ref: string | null | undefined) { const itemId = this.itemIdOf(ref); return itemId ? ITEMS[itemId] : null; }
  instanceOf(ref: string | null | undefined) { return ref ? this.resolve(ref) : null; }

  durabilityOf(ref: string) { return this.resolve(ref)?.durability ?? 100; }
  conditionOf(ref: string) { return conditionFromDurability(this.durabilityOf(ref)); }
  conditionMultiplier(ref: string) { return conditionMultiplierFromDurability(this.durabilityOf(ref)); }
  isRuined(ref: string) { return this.conditionOf(ref) === 'ruined'; }

  equip(ref: string, preferredSlot?: EquipmentSlot) {
    const instance = this.resolve(ref);
    if (!instance) return false;
    const item = ITEMS[instance.itemId];
    if (!item || !EQUIPPABLE_TYPES.includes(item.type) || this.isRuined(instance.instanceId)) return false;
    const slot = preferredSlot ?? this.slotForInstance(instance);
    if (!slot) return false;
    const previousSlotId = this.equipmentSlots.get(slot) ?? null;
    const previous = previousSlotId ? this.items.get(previousSlotId) ?? null : null;
    const nextBackpackId = slot === 'backpack' ? instance.itemId : this.equippedBackpackId;
    const nextGrid = backpackGridSize(nextBackpackId);
    if (!this.gridStillFits(nextGrid, instance.instanceId)) return false;
    if (previous) {
      previous.location = 'grid'; previous.equipmentSlot = null;
      const pos = firstFreePosition(this.gridItems().filter((entry) => entry.instanceId !== previous.instanceId), nextGrid, previous, previous.rotated);
      if (!pos) { previous.location = 'equipment'; previous.equipmentSlot = slot; return false; }
      previous.x = pos.x; previous.y = pos.y; previous.rotated = pos.rotated;
    }
    instance.location = 'equipment'; instance.equipmentSlot = slot; this.equipmentSlots.set(slot, instance.instanceId);
    this.syncEquippedAliases(); this.autoAssignHotbar(instance.instanceId); return true;
  }

  unequip(slot: EquipmentSlot) {
    const instanceId = this.equipmentSlots.get(slot); const instance = instanceId ? this.items.get(instanceId) : null; if (!instance) return false;
    const nextBackpackId = slot === 'backpack' ? null : this.equippedBackpackId;
    const nextGrid = backpackGridSize(nextBackpackId);
    const pos = firstFreePosition(this.gridItems(), nextGrid, instance, instance.rotated);
    if (!pos || !this.gridStillFits(nextGrid, instance.instanceId)) return false;
    instance.location = 'grid'; instance.equipmentSlot = null; instance.x = pos.x; instance.y = pos.y; instance.rotated = pos.rotated; this.equipmentSlots.set(slot, null); this.syncEquippedAliases(); return true;
  }

  equipBestArmor() { const candidate = [...this.items.values()].filter((entry) => ['armor', 'clothing'].includes(ITEMS[entry.itemId]?.type ?? '') && !this.isRuined(entry.instanceId)).sort((a, b) => ((ITEMS[b.itemId]?.armor ?? 0) + (ITEMS[b.itemId]?.warmth ?? 0) / 100) - ((ITEMS[a.itemId]?.armor ?? 0) + (ITEMS[a.itemId]?.warmth ?? 0) / 100))[0]; return candidate ? this.equip(candidate.instanceId) : false; }
  equipBestBackpack() { const candidate = [...this.items.values()].filter((entry) => ITEMS[entry.itemId]?.type === 'backpack' && !this.isRuined(entry.instanceId)).sort((a, b) => (ITEMS[b.itemId]?.capacityBonus ?? 0) * this.conditionMultiplier(b.instanceId) - (ITEMS[a.itemId]?.capacityBonus ?? 0) * this.conditionMultiplier(a.instanceId))[0]; return candidate ? this.equip(candidate.instanceId, 'backpack') : false; }
  weapons() { return [...this.items.values()].map((entry) => ITEMS[entry.itemId]).filter((item): item is ItemDefinition => Boolean(item) && isWeapon(item)); }
  cycleWeapon(index: number) { const weapon = [...this.items.values()].filter((entry) => isWeapon(ITEMS[entry.itemId])).filter((entry) => !this.isRuined(entry.instanceId))[index]; if (weapon) this.equip(weapon.instanceId); }
  equipHotbar(slot: number) { const ref = this.hotbarSlots.get(slot); const instance = ref ? this.resolve(ref) : null; if (!instance) return false; const item = ITEMS[instance.itemId]; if (EQUIPPABLE_TYPES.includes(item.type)) return this.equip(instance.instanceId); if (USABLE_TYPES.includes(item.type)) return this.use(instance.instanceId) !== null; return false; }
  assignHotbar(slot: number, ref: string | null) { if (slot < 1 || slot > BALANCE.inventoryConfig.hotbarSlots) return false; const instance = ref ? this.resolve(ref) : null; if (ref && !instance) return false; this.hotbarSlots.set(slot, instance?.instanceId ?? null); return true; }
  hotbar(): HotbarSlot[] { return [...this.hotbarSlots.entries()].map(([slot, instanceId]) => { const instance = instanceId ? this.items.get(instanceId) : null; return { slot, instanceId: instance?.instanceId ?? null, itemId: instance?.itemId ?? null, label: instance ? ITEMS[instance.itemId]?.name ?? instance.itemId : 'Leer' }; }); }

  equippedWeapon() { return this.equippedWeaponId ? ITEMS[this.equippedWeaponId] : null; }
  equippedArmor() { return this.equippedArmorId ? ITEMS[this.equippedArmorId] : null; }
  equippedBackpack() { return this.equippedBackpackId ? ITEMS[this.equippedBackpackId] : null; }
  clothingSummary(): Record<ClothingSlot, string> { const result = {} as Record<ClothingSlot, string>; for (const slot of CLOTHING_SLOTS) { const instanceId = this.equipmentSlots.get(slot); const instance = instanceId ? this.items.get(instanceId) : null; result[slot] = instance ? `${ITEMS[instance.itemId]?.name ?? instance.itemId} (${conditionLabel(this.conditionOf(instance.instanceId))})` : 'leer'; } return result; }

  ammoForEquippedWeapon() { const weapon = this.equippedWeapon(); const ammoType = weapon?.weapon?.ammoType; return ammoType ? this.count(ammoType) : 0; }
  consumeAmmo(ammoType: string, count: number) { return this.remove(ammoType, count); }
  use(ref: string) { const instance = this.resolve(ref); if (!instance) return null; const item = ITEMS[instance.itemId]; if (!item || !USABLE_TYPES.includes(item.type) || this.isRuined(instance.instanceId)) return null; this.removeFromInstance(instance, 1); return item; }
  useBestFood() { const instance = [...this.items.values()].filter((entry) => ITEMS[entry.itemId]?.type === 'food' && !this.isRuined(entry.instanceId)).sort((a, b) => (ITEMS[b.itemId]?.nutrition ?? 0) - (ITEMS[a.itemId]?.nutrition ?? 0))[0]; return instance ? this.use(instance.instanceId) : null; }
  useBestDrink() { const instance = [...this.items.values()].filter((entry) => ITEMS[entry.itemId]?.type === 'drink' && !this.isRuined(entry.instanceId)).sort((a, b) => (ITEMS[b.itemId]?.hydration ?? 0) - (ITEMS[a.itemId]?.hydration ?? 0))[0]; return instance ? this.use(instance.instanceId) : null; }
  useMedical() { const instance = [...this.items.values()].filter((entry) => ITEMS[entry.itemId]?.type === 'medical' && !this.isRuined(entry.instanceId)).sort((a, b) => Number(ITEMS[b.itemId]?.stopsBleeding) - Number(ITEMS[a.itemId]?.stopsBleeding) || (ITEMS[b.itemId]?.infectionRelief ?? 0) - (ITEMS[a.itemId]?.infectionRelief ?? 0) || (ITEMS[b.itemId]?.heal ?? 0) - (ITEMS[a.itemId]?.heal ?? 0))[0]; return instance ? this.use(instance.instanceId) : null; }
  consumeForCrafting(itemId: string, count = 1) { return this.remove(itemId, count); }
  hasAny(ids: string[]) { return ids.some((id) => this.has(id)); }
  consumeAny(ids: string[]) { const found = ids.find((id) => this.has(id)); if (!found) return null; this.remove(found, 1); return found; }
  damageItem(ref: string | null, amount: number) { const instance = ref ? this.resolve(ref) : null; if (!instance) return; instance.durability = Math.max(0, instance.durability - amount); }
  repairItem(ref: string | null, amount: number) { const instance = ref ? this.resolve(ref) : null; if (!instance || this.isRuined(instance.instanceId)) return false; instance.durability = Math.min(100, instance.durability + amount); return true; }
  repairBestEquipped() { const candidates = [...this.equipmentSlots.values()].filter((id): id is string => Boolean(id)).map((id) => this.items.get(id)).filter((entry): entry is InventoryGridItem => Boolean(entry) && entry.durability < 90 && !this.isRuined(entry.instanceId)); const target = candidates.sort((a, b) => a.durability - b.durability)[0]; if (!target) return { ok: false, message: 'Kein beschädigtes ausgerüstetes Item reparierbar.' }; const item = ITEMS[target.itemId]; const tags = item.repairTags ?? []; const tool = tags.includes('weapon') && item.type === 'ranged_weapon' && this.consumeAny(['weapon_cleaning_kit']) || tags.includes('tool') && this.consumeAny(['toolbox', 'duct_tape']) || tags.includes('cloth') && this.consumeAny(['sewing_kit', 'duct_tape']) || tags.includes('backpack') && this.consumeAny(['sewing_kit', 'duct_tape']) || this.consumeAny(['duct_tape']); if (!tool) return { ok: false, message: `Kein passendes Reparaturitem für ${item.name}.` }; const amount = tool === 'sewing_kit' ? BALANCE.repair.sewingKitAmount : tool === 'toolbox' ? BALANCE.repair.toolboxAmount : tool === 'weapon_cleaning_kit' ? BALANCE.repair.weaponCleaningAmount : BALANCE.repair.ductTapeAmount; this.repairItem(target.instanceId, amount); return { ok: true, message: `${item.name} mit ${ITEMS[tool].name} repariert.` }; }

  moveItem(ref: string, direction: -1 | 1) { const instance = this.resolve(ref); if (!instance || instance.location !== 'grid') return false; return this.moveInstance(instance.instanceId, instance.x, instance.y + direction, instance.rotated); }
  moveInstance(ref: string, x: number, y: number, rotated?: boolean) { const instance = this.resolve(ref); if (!instance || instance.location !== 'grid') return false; const nextRotated = rotated ?? instance.rotated; if (!canPlace(this.gridItems(), this.gridSize, instance, x, y, nextRotated)) return false; instance.x = x; instance.y = y; instance.rotated = nextRotated; return true; }
  rotateInstance(ref: string) { const instance = this.resolve(ref); if (!instance || instance.location !== 'grid') return false; return this.moveInstance(instance.instanceId, instance.x, instance.y, !instance.rotated); }
  splitStack(ref: string, amount?: number) { const instance = this.resolve(ref); if (!instance || instance.count <= 1) return false; const splitAmount = Math.max(1, Math.min(amount ?? Math.floor(instance.count / 2), instance.count - 1)); const clone = this.createInstance(instance.itemId, splitAmount, instance.durability, instance.freshness); const pos = firstFreePosition(this.gridItems(), this.gridSize, clone, instance.rotated); if (!pos) return false; instance.count -= splitAmount; clone.x = pos.x; clone.y = pos.y; clone.rotated = pos.rotated; this.items.set(clone.instanceId, clone); return true; }

  entries(): InventoryEntry[] { return [...this.items.values()].map((instance) => this.toEntry(instance)); }
  itemIds() { return [...this.items.values()].map((instance) => instance.instanceId); }
  gridView(): GridInventoryView { const validation = validateGrid(this.gridItems(), this.gridSize); const equipment: Partial<Record<EquipmentSlot, GridItemView | null>> = {}; for (const slot of EQUIPMENT_SLOTS) { const instanceId = this.equipmentSlots.get(slot); const instance = instanceId ? this.items.get(instanceId) : null; equipment[slot] = instance ? this.toGridView(instance) : null; } return { cols: this.gridSize.cols, rows: this.gridSize.rows, usedCells: validation.occupied, freeCells: validation.free, items: this.gridItems().map((item) => this.toGridView(item)), equipment, validationOk: validation.ok, validationErrors: validation.errors }; }
  validate() { const result = validateGrid(this.gridItems(), this.gridSize); if (!result.ok) console.warn('Inventory grid validation failed', result.errors); return result; }
  addDebugItems() { ['pistol', 'rifle', 'ammo_9mm', 'ammo_556', 'water_bottle', 'canned_food', 'bandage', 'small_backpack', 'field_pack', 'tactical_vest', 'hatchet', 'toolbox'].forEach((id) => this.addWithResult(id, id.startsWith('ammo_') ? 25 : 1)); }
  clear() { this.items.clear(); this.hotbarSlots = defaultHotbar(); this.equipmentSlots = defaultEquipment(); this.syncEquippedAliases(); }
  aggregateItems(): Array<[string, number]> { const map = new Map<string, number>(); for (const instance of this.items.values()) map.set(instance.itemId, (map.get(instance.itemId) ?? 0) + instance.count); return [...map.entries()]; }
  toSaveData(): InventorySaveData { return { items: this.aggregateItems(), equippedWeaponId: this.equippedWeaponId, equippedArmorId: this.equippedArmorId, equippedBackpackId: this.equippedBackpackId, hotbar: [...this.hotbarSlots.entries()], gridItems: [...this.items.values()].map((item) => ({ ...item })), equipmentSlots: Object.fromEntries(this.equipmentSlots.entries()) as Partial<Record<EquipmentSlot, string | null>> }; }
  loadSaveData(data: InventorySaveData) { this.clear(); if (data.gridItems?.length) { this.items = new Map(data.gridItems.filter((entry) => Boolean(ITEMS[entry.itemId])).map((entry) => [entry.instanceId, { ...entry }])); this.equipmentSlots = defaultEquipment(); for (const [slot, instanceId] of Object.entries(data.equipmentSlots ?? {}) as Array<[EquipmentSlot, string | null]>) if (instanceId && this.items.has(instanceId)) this.equipmentSlots.set(slot, instanceId); this.hotbarSlots = defaultHotbar(); for (const [slot, instanceId] of data.hotbar ?? []) this.assignHotbar(Number(slot), instanceId); this.syncEquippedAliases(); this.validate(); return; } for (const [itemId, count] of data.items ?? []) this.addWithResult(itemId, count); this.syncEquippedAliases(); }

  private gridItems() { return [...this.items.values()].filter((entry) => entry.location === 'grid'); }
  private resolve(ref: string) { return this.items.get(ref) ?? [...this.items.values()].find((entry) => entry.itemId === ref) ?? null; }
  private createInstance(itemId: string, count = 1, durability?: number, freshness?: FoodFreshness): InventoryGridItem { return { instanceId: `item-${Date.now()}-${Math.floor(Math.random() * 999999)}`, itemId, count, x: 0, y: 0, rotated: false, durability: durability ?? this.rollInitialDurability(ITEMS[itemId]), freshness: freshness ?? this.rollFreshness(itemId), location: 'grid', equipmentSlot: null }; }
  private toEntry(instance: InventoryGridItem): InventoryEntry { const item = ITEMS[instance.itemId]; const condition = conditionFromDurability(instance.durability); return { id: instance.itemId, instanceId: instance.instanceId, itemId: instance.itemId, name: item?.name ?? instance.itemId, type: item?.type ?? 'tool', count: instance.count, size: item?.size ?? 1, weight: item?.weight ?? 1, totalWeight: Math.round((item?.weight ?? 1) * instance.count * 10) / 10, condition, conditionLabel: conditionLabel(condition), freshness: instance.freshness, equipped: instance.location === 'equipment', canUse: item ? USABLE_TYPES.includes(item.type) && condition !== 'ruined' : false, canEquip: item ? EQUIPPABLE_TYPES.includes(item.type) && condition !== 'ruined' : false, description: item?.description ?? '' }; }
  private toGridView(instance: InventoryGridItem): GridItemView { const item = ITEMS[instance.itemId]; const size = itemGridSize(instance.itemId, instance.rotated); return { ...this.toEntry(instance), instanceId: instance.instanceId, itemId: instance.itemId, x: instance.x, y: instance.y, w: size.cols, h: size.rows, rotated: instance.rotated, maxStack: item?.maxStack ?? 1, equipmentSlot: instance.equipmentSlot ?? null }; }
  private removeFromInstance(instance: InventoryGridItem, count: number) { if (instance.count < count) return false; instance.count -= count; if (instance.count <= 0) this.deleteInstance(instance.instanceId); return true; }
  private deleteInstance(instanceId: string) { const instance = this.items.get(instanceId); if (!instance) return; this.items.delete(instanceId); for (const [slot, id] of this.equipmentSlots) if (id === instanceId) this.equipmentSlots.set(slot, null); for (const [slot, id] of this.hotbarSlots) if (id === instanceId) this.hotbarSlots.set(slot, null); this.syncEquippedAliases(); }
  private autoAssignHotbar(ref: string) { const instance = this.resolve(ref); if (!instance || [...this.hotbarSlots.values()].includes(instance.instanceId)) return; const item = ITEMS[instance.itemId]; const preferred = item.type === 'ranged_weapon' && item.id === 'rifle' ? 1 : item.type === 'ranged_weapon' ? 2 : item.type === 'melee_weapon' ? 3 : item.type === 'medical' ? 4 : item.type === 'food' || item.type === 'drink' ? 5 : 0; if (preferred && !this.hotbarSlots.get(preferred)) this.hotbarSlots.set(preferred, instance.instanceId); }
  private slotForInstance(instance: InventoryGridItem): EquipmentSlot | null { const item = ITEMS[instance.itemId]; if (item?.type === 'ranged_weapon') { if (item.id === 'rifle') return 'primary'; if (!this.equipmentSlots.get('secondary')) return 'secondary'; return 'primary'; } return equipmentSlotForItem(instance.itemId); }
  private gridStillFits(grid: GridSize, excludingInstanceId?: string) { return validateGrid(this.gridItems().filter((entry) => entry.instanceId !== excludingInstanceId), grid).ok; }
  private addProbe(itemId: string, count: number) { const clone = [...this.items.values()].map((entry) => ({ ...entry })); const temp = this.createInstance(itemId, count); return Boolean(firstFreePosition(clone.filter((entry) => entry.location === 'grid'), this.gridSize, temp, false)); }
  private syncEquippedAliases() { const primary = this.equipmentSlots.get('primary'); const secondary = this.equipmentSlots.get('secondary'); const melee = this.equipmentSlots.get('melee'); const weapon = [primary, secondary, melee].map((id) => id ? this.items.get(id) : null).find((entry): entry is InventoryGridItem => Boolean(entry)); this.equippedWeaponId = weapon?.itemId ?? null; const armor = ['vest', 'head', 'torso'].map((slot) => this.equipmentSlots.get(slot as EquipmentSlot)).map((id) => id ? this.items.get(id) : null).find((entry): entry is InventoryGridItem => Boolean(entry) && Boolean(ITEMS[entry.itemId]?.armor)); this.equippedArmorId = armor?.itemId ?? null; const backpack = this.equipmentSlots.get('backpack'); this.equippedBackpackId = backpack ? this.items.get(backpack)?.itemId ?? null : null; }
  private rollInitialDurability(item: ItemDefinition) { if (item.type === 'ammo') return 100; if (item.id === 'rotten_food') return 30; return Math.round(55 + Math.random() * 45); }
  private rollFreshness(itemId: string): FoodFreshness | undefined { const item = ITEMS[itemId]; if (!item || (item.type !== 'food' && item.type !== 'drink')) return undefined; if (itemId === 'rotten_food') return 'spoiled'; if (itemId === 'dirty_water') return 'old'; if (itemId === 'apple') return Math.random() < 0.25 ? 'old' : 'fresh'; return 'fresh'; }
  private isBetterArmor(ref: string) { const instance = this.resolve(ref); if (!instance) return false; const current = this.equippedArmorId ? ITEMS[this.equippedArmorId]?.armor ?? 0 : 0; return (ITEMS[instance.itemId]?.armor ?? 0) * this.conditionMultiplier(instance.instanceId) > current; }
  private isBetterBackpack(ref: string) { const instance = this.resolve(ref); if (!instance) return false; const current = this.equippedBackpackId ? (ITEMS[this.equippedBackpackId]?.capacityBonus ?? 0) : 0; return (ITEMS[instance.itemId]?.capacityBonus ?? 0) > current; }
}
