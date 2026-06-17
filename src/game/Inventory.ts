import { BALANCE } from './Balance';
import { ITEMS } from './data';
import type { ClothingSlot, FoodFreshness, InventoryEntry, InventorySaveData, ItemCondition, ItemDefinition, ItemType } from './types';

const WEAPON_TYPES: ItemType[] = ['melee_weapon', 'ranged_weapon'];
const EQUIPPABLE_TYPES: ItemType[] = ['melee_weapon', 'ranged_weapon', 'armor', 'clothing', 'backpack'];
const USABLE_TYPES: ItemType[] = ['food', 'drink', 'medical'];
const CLOTHING_SLOTS: ClothingSlot[] = ['head', 'torso', 'legs', 'feet', 'hands', 'vest', 'backpack'];

function isWeapon(item: ItemDefinition) {
  return WEAPON_TYPES.includes(item.type);
}

export function conditionFromDurability(value: number): ItemCondition {
  if (value <= 0) return 'ruined';
  if (value < 20) return 'badly_damaged';
  if (value < 40) return 'damaged';
  if (value < 65) return 'worn';
  if (value < 90) return 'good';
  return 'new';
}

export function conditionLabel(condition: ItemCondition) {
  return {
    new: 'neu',
    good: 'gut',
    worn: 'abgenutzt',
    damaged: 'beschädigt',
    badly_damaged: 'stark beschädigt',
    ruined: 'ruiniert'
  }[condition];
}

export function conditionMultiplierFromDurability(value: number) {
  const condition = conditionFromDurability(value);
  if (condition === 'ruined') return BALANCE.clothing.ruinedEffectMultiplier;
  if (condition === 'badly_damaged') return BALANCE.clothing.badlyDamagedEffectMultiplier;
  if (condition === 'damaged') return BALANCE.clothing.damagedEffectMultiplier;
  if (condition === 'worn') return BALANCE.clothing.wornEffectMultiplier;
  if (condition === 'good') return BALANCE.clothing.goodEffectMultiplier;
  return BALANCE.clothing.newEffectMultiplier;
}

export class Inventory {
  private items = new Map<string, number>();
  private durability = new Map<string, number>();
  private freshness = new Map<string, FoodFreshness>();
  private clothingSlots = new Map<ClothingSlot, string | null>(CLOTHING_SLOTS.map((slot) => [slot, null]));
  private baseCapacity = 10;
  public equippedWeaponId: string | null = null;
  public equippedArmorId: string | null = null;
  public equippedBackpackId: string | null = null;

  get capacity() {
    const backpack = this.equippedBackpackId ? ITEMS[this.equippedBackpackId] : null;
    const multiplier = this.equippedBackpackId ? this.conditionMultiplier(this.equippedBackpackId) : 1;
    return Math.round(this.baseCapacity + (backpack?.capacityBonus ?? 0) * multiplier);
  }

  get armor() {
    let total = 0;
    for (const itemId of this.clothingSlots.values()) {
      if (!itemId) continue;
      const item = ITEMS[itemId];
      total += (item?.armor ?? 0) * this.conditionMultiplier(itemId);
    }
    return Math.min(0.68, total);
  }

  get warmth() {
    let total = 0;
    for (const itemId of this.clothingSlots.values()) {
      if (!itemId) continue;
      const item = ITEMS[itemId];
      total += (item?.warmth ?? 0) * this.conditionMultiplier(itemId);
    }
    return Math.round(total);
  }

  get rainProtection() {
    let total = 0;
    for (const itemId of this.clothingSlots.values()) {
      if (!itemId) continue;
      const item = ITEMS[itemId];
      total += (item?.rainProtection ?? 0) * this.conditionMultiplier(itemId);
    }
    return Math.round(Math.min(100, total));
  }

  get usedSlots() {
    let used = 0;
    for (const [id, count] of this.items) used += (ITEMS[id]?.size ?? 1) * count;
    return Math.round(used * 10) / 10;
  }

  get totalWeight() {
    let weight = 0;
    for (const [id, count] of this.items) weight += (ITEMS[id]?.weight ?? ITEMS[id]?.size ?? 1) * count;
    return Math.round(weight * 10) / 10;
  }

  canAdd(itemId: string, count = 1): boolean {
    const item = ITEMS[itemId];
    if (!item) return false;
    const needed = item.size * count;
    const possibleCapacity = item.type === 'backpack'
      ? Math.max(this.capacity, this.baseCapacity + (item.capacityBonus ?? 0))
      : this.capacity;
    return this.usedSlots + needed <= possibleCapacity;
  }

  add(itemId: string, count = 1): boolean {
    const item = ITEMS[itemId];
    if (!item || count <= 0) return false;
    if (!this.canAdd(itemId, count)) return false;

    this.items.set(itemId, (this.items.get(itemId) ?? 0) + count);
    if (!this.durability.has(itemId)) this.durability.set(itemId, this.rollInitialDurability(item));
    if ((item.type === 'food' || item.type === 'drink') && !this.freshness.has(itemId)) this.freshness.set(itemId, this.rollFreshness(itemId));

    if (isWeapon(item) && !this.equippedWeaponId) this.equip(itemId);
    if ((item.type === 'armor' || item.type === 'clothing') && this.isBetterArmor(itemId)) this.equip(itemId);
    if (item.type === 'backpack' && this.isBetterBackpack(itemId)) this.equip(itemId);

    return true;
  }

  remove(itemId: string, count = 1): boolean {
    const current = this.items.get(itemId) ?? 0;
    if (current < count) return false;
    const next = current - count;
    if (next <= 0) {
      this.items.delete(itemId);
      this.durability.delete(itemId);
      this.freshness.delete(itemId);
      if (this.equippedWeaponId === itemId) this.equippedWeaponId = null;
      if (this.equippedArmorId === itemId) this.equippedArmorId = null;
      if (this.equippedBackpackId === itemId) this.equippedBackpackId = null;
      for (const [slot, equippedId] of this.clothingSlots) {
        if (equippedId === itemId) this.clothingSlots.set(slot, null);
      }
    } else {
      this.items.set(itemId, next);
    }
    return true;
  }

  count(itemId: string) {
    return this.items.get(itemId) ?? 0;
  }

  has(itemId: string, count = 1) {
    return this.count(itemId) >= count;
  }

  durabilityOf(itemId: string) {
    return this.durability.get(itemId) ?? 100;
  }

  conditionOf(itemId: string) {
    return conditionFromDurability(this.durabilityOf(itemId));
  }

  conditionMultiplier(itemId: string) {
    return conditionMultiplierFromDurability(this.durabilityOf(itemId));
  }

  isRuined(itemId: string) {
    return this.conditionOf(itemId) === 'ruined';
  }

  equip(itemId: string): boolean {
    const item = ITEMS[itemId];
    if (!item || !this.has(itemId) || !EQUIPPABLE_TYPES.includes(item.type) || this.isRuined(itemId)) return false;

    if (isWeapon(item)) this.equippedWeaponId = itemId;
    if (item.clothingSlot) {
      this.clothingSlots.set(item.clothingSlot, itemId);
      if (item.clothingSlot === 'vest') this.equippedArmorId = itemId;
      if (item.clothingSlot === 'backpack') this.equippedBackpackId = itemId;
    }
    if ((item.type === 'armor' || item.type === 'clothing') && !item.clothingSlot) this.equippedArmorId = itemId;
    if (item.type === 'backpack') this.equippedBackpackId = itemId;
    return true;
  }

  equipBestArmor() {
    const armor = [...this.items.keys()]
      .map((id) => ITEMS[id])
      .filter((item): item is ItemDefinition => Boolean(item) && (item.type === 'armor' || item.type === 'clothing') && !this.isRuined(item.id))
      .sort((a, b) => ((b.armor ?? 0) + (b.warmth ?? 0) / 100) - ((a.armor ?? 0) + (a.warmth ?? 0) / 100))[0];
    return armor ? this.equip(armor.id) : false;
  }

  equipBestBackpack() {
    const backpack = [...this.items.keys()]
      .map((id) => ITEMS[id])
      .filter((item): item is ItemDefinition => Boolean(item) && item.type === 'backpack' && !this.isRuined(item.id))
      .sort((a, b) => (b.capacityBonus ?? 0) * this.conditionMultiplier(b.id) - (a.capacityBonus ?? 0) * this.conditionMultiplier(a.id))[0];
    return backpack ? this.equip(backpack.id) : false;
  }

  weapons(): ItemDefinition[] {
    return [...this.items.keys()].map((id) => ITEMS[id]).filter((item): item is ItemDefinition => Boolean(item) && isWeapon(item) && !this.isRuined(item.id));
  }

  cycleWeapon(index: number) {
    const weapon = this.weapons()[index];
    if (weapon) this.equip(weapon.id);
  }

  equippedWeapon(): ItemDefinition | null {
    return this.equippedWeaponId ? ITEMS[this.equippedWeaponId] : null;
  }

  equippedArmor(): ItemDefinition | null {
    return this.equippedArmorId ? ITEMS[this.equippedArmorId] : null;
  }

  equippedBackpack(): ItemDefinition | null {
    return this.equippedBackpackId ? ITEMS[this.equippedBackpackId] : null;
  }

  clothingSummary(): Record<ClothingSlot, string> {
    const result = {} as Record<ClothingSlot, string>;
    for (const slot of CLOTHING_SLOTS) {
      const itemId = this.clothingSlots.get(slot);
      result[slot] = itemId ? `${ITEMS[itemId]?.name ?? itemId} (${conditionLabel(this.conditionOf(itemId))})` : 'leer';
    }
    return result;
  }

  ammoForEquippedWeapon() {
    const weapon = this.equippedWeapon();
    const ammoType = weapon?.weapon?.ammoType;
    return ammoType ? this.count(ammoType) : 0;
  }

  consumeAmmo(ammoType: string, count: number) {
    return this.remove(ammoType, count);
  }

  use(itemId: string): ItemDefinition | null {
    const item = ITEMS[itemId];
    if (!item || !this.has(itemId) || !USABLE_TYPES.includes(item.type) || this.isRuined(itemId)) return null;
    this.remove(itemId, 1);
    return item;
  }

  useBestFood() {
    const item = [...this.items.keys()]
      .map((id) => ITEMS[id])
      .filter((candidate) => candidate?.type === 'food' && !this.isRuined(candidate.id))
      .sort((a, b) => (b.nutrition ?? 0) - (a.nutrition ?? 0))[0];
    return item ? this.use(item.id) : null;
  }

  useBestDrink() {
    const item = [...this.items.keys()]
      .map((id) => ITEMS[id])
      .filter((candidate) => candidate?.type === 'drink' && !this.isRuined(candidate.id))
      .sort((a, b) => (b.hydration ?? 0) - (a.hydration ?? 0))[0];
    return item ? this.use(item.id) : null;
  }

  useMedical() {
    const item = [...this.items.keys()]
      .map((id) => ITEMS[id])
      .filter((candidate) => candidate?.type === 'medical' && !this.isRuined(candidate.id))
      .sort((a, b) => Number(b.stopsBleeding) - Number(a.stopsBleeding) || (b.infectionRelief ?? 0) - (a.infectionRelief ?? 0) || (b.heal ?? 0) - (a.heal ?? 0))[0];
    return item ? this.use(item.id) : null;
  }

  consumeForCrafting(itemId: string, count = 1) {
    return this.remove(itemId, count);
  }

  hasAny(ids: string[]) {
    return ids.some((id) => this.has(id));
  }

  consumeAny(ids: string[]) {
    const found = ids.find((id) => this.has(id));
    if (!found) return null;
    this.remove(found, 1);
    return found;
  }

  damageItem(itemId: string | null, amount: number) {
    if (!itemId || !this.has(itemId)) return;
    const next = Math.max(0, this.durabilityOf(itemId) - amount);
    this.durability.set(itemId, next);
  }

  repairItem(itemId: string | null, amount: number) {
    if (!itemId || !this.has(itemId) || this.isRuined(itemId)) return false;
    this.durability.set(itemId, Math.min(100, this.durabilityOf(itemId) + amount));
    return true;
  }

  repairBestEquipped() {
    const candidates = [this.equippedWeaponId, this.equippedArmorId, this.equippedBackpackId]
      .filter((id): id is string => Boolean(id))
      .filter((id) => this.durabilityOf(id) < 90 && !this.isRuined(id));
    const target = candidates.sort((a, b) => this.durabilityOf(a) - this.durabilityOf(b))[0];
    if (!target) return { ok: false, message: 'Kein beschädigtes ausgerüstetes Item reparierbar.' };

    const item = ITEMS[target];
    const tags = item.repairTags ?? [];
    const tool = tags.includes('weapon') && item.type === 'ranged_weapon' && this.consumeAny(['weapon_cleaning_kit'])
      || tags.includes('tool') && this.consumeAny(['toolbox', 'duct_tape'])
      || tags.includes('cloth') && this.consumeAny(['sewing_kit', 'duct_tape'])
      || tags.includes('backpack') && this.consumeAny(['sewing_kit', 'duct_tape'])
      || this.consumeAny(['duct_tape']);

    if (!tool) return { ok: false, message: `Kein passendes Reparaturitem für ${item.name}.` };
    const amount = tool === 'sewing_kit' ? BALANCE.repair.sewingKitAmount : tool === 'toolbox' ? BALANCE.repair.toolboxAmount : tool === 'weapon_cleaning_kit' ? BALANCE.repair.weaponCleaningAmount : BALANCE.repair.ductTapeAmount;
    this.repairItem(target, amount);
    return { ok: true, message: `${item.name} mit ${ITEMS[tool].name} repariert.` };
  }

  foodFreshness(itemId: string) {
    return this.freshness.get(itemId);
  }

  entries(): InventoryEntry[] {
    return [...this.items.entries()].map(([id, count]) => {
      const item = ITEMS[id];
      const condition = this.conditionOf(id);
      const equipped = this.equippedWeaponId === id || [...this.clothingSlots.values()].includes(id);
      return {
        id,
        name: item?.name ?? id,
        type: item?.type ?? 'tool',
        count,
        size: item?.size ?? 1,
        weight: item?.weight ?? 1,
        totalWeight: Math.round((item?.weight ?? 1) * count * 10) / 10,
        condition,
        conditionLabel: conditionLabel(condition),
        freshness: this.freshness.get(id),
        equipped,
        canUse: item ? USABLE_TYPES.includes(item.type) && condition !== 'ruined' : false,
        canEquip: item ? EQUIPPABLE_TYPES.includes(item.type) && condition !== 'ruined' : false,
        description: item?.description ?? ''
      };
    });
  }

  toSaveData(): InventorySaveData {
    return {
      items: [...this.items.entries()],
      equippedWeaponId: this.equippedWeaponId,
      equippedArmorId: this.equippedArmorId,
      equippedBackpackId: this.equippedBackpackId,
      itemDurability: Object.fromEntries(this.durability.entries()),
      itemFreshness: Object.fromEntries(this.freshness.entries()),
      clothingSlots: Object.fromEntries(this.clothingSlots.entries()) as Partial<Record<ClothingSlot, string | null>>
    };
  }

  loadSaveData(data: InventorySaveData) {
    this.items = new Map((data.items ?? []).filter(([id]) => Boolean(ITEMS[id])));
    this.durability = new Map(Object.entries(data.itemDurability ?? {}).filter(([id]) => Boolean(ITEMS[id])).map(([id, value]) => [id, Number(value)]));
    this.freshness = new Map(Object.entries(data.itemFreshness ?? {}).filter(([id]) => Boolean(ITEMS[id])) as Array<[string, FoodFreshness]>);
    for (const id of this.items.keys()) {
      if (!this.durability.has(id)) this.durability.set(id, 72);
    }
    this.clothingSlots = new Map<ClothingSlot, string | null>(CLOTHING_SLOTS.map((slot) => [slot, data.clothingSlots?.[slot] && this.has(data.clothingSlots[slot] as string) ? data.clothingSlots[slot] ?? null : null]));
    this.equippedWeaponId = data.equippedWeaponId && this.has(data.equippedWeaponId) ? data.equippedWeaponId : null;
    this.equippedArmorId = data.equippedArmorId && this.has(data.equippedArmorId) ? data.equippedArmorId : this.clothingSlots.get('vest') ?? null;
    this.equippedBackpackId = data.equippedBackpackId && this.has(data.equippedBackpackId) ? data.equippedBackpackId : this.clothingSlots.get('backpack') ?? null;
  }

  private rollInitialDurability(item: ItemDefinition) {
    if (item.type === 'ammo') return 100;
    if (item.id === 'rotten_food') return 30;
    const roll = 55 + Math.random() * 45;
    return Math.round(roll);
  }

  private rollFreshness(itemId: string): FoodFreshness {
    if (itemId === 'rotten_food') return 'spoiled';
    if (itemId === 'dirty_water') return 'old';
    if (itemId === 'apple') return Math.random() < 0.25 ? 'old' : 'fresh';
    return 'fresh';
  }

  private isBetterArmor(itemId: string) {
    const current = this.equippedArmorId ? ITEMS[this.equippedArmorId]?.armor ?? 0 : 0;
    return (ITEMS[itemId]?.armor ?? 0) * this.conditionMultiplier(itemId) > current;
  }

  private isBetterBackpack(itemId: string) {
    const current = this.equippedBackpackId ? (ITEMS[this.equippedBackpackId]?.capacityBonus ?? 0) * this.conditionMultiplier(this.equippedBackpackId) : 0;
    return (ITEMS[itemId]?.capacityBonus ?? 0) * this.conditionMultiplier(itemId) > current;
  }
}
