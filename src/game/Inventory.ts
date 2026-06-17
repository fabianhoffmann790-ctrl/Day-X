import { ITEMS } from './data';
import type { InventoryEntry, InventorySaveData, ItemDefinition, ItemType } from './types';

const WEAPON_TYPES: ItemType[] = ['melee_weapon', 'ranged_weapon'];
const EQUIPPABLE_TYPES: ItemType[] = ['melee_weapon', 'ranged_weapon', 'armor', 'clothing', 'backpack'];
const USABLE_TYPES: ItemType[] = ['food', 'drink', 'medical'];

function isWeapon(item: ItemDefinition) {
  return WEAPON_TYPES.includes(item.type);
}

export class Inventory {
  private items = new Map<string, number>();
  private baseCapacity = 10;
  public equippedWeaponId: string | null = null;
  public equippedArmorId: string | null = null;
  public equippedBackpackId: string | null = null;

  get capacity() {
    const backpack = this.equippedBackpackId ? ITEMS[this.equippedBackpackId] : null;
    return this.baseCapacity + (backpack?.capacityBonus ?? 0);
  }

  get armor() {
    const armorItem = this.equippedArmorId ? ITEMS[this.equippedArmorId] : null;
    return armorItem?.armor ?? 0;
  }

  get usedSlots() {
    let used = 0;
    for (const [id, count] of this.items) used += (ITEMS[id]?.size ?? 1) * count;
    return Math.round(used * 10) / 10;
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
      if (this.equippedWeaponId === itemId) this.equippedWeaponId = null;
      if (this.equippedArmorId === itemId) this.equippedArmorId = null;
      if (this.equippedBackpackId === itemId) this.equippedBackpackId = null;
    } else {
      this.items.set(itemId, next);
    }
    return true;
  }

  count(itemId: string) {
    return this.items.get(itemId) ?? 0;
  }

  has(itemId: string) {
    return this.count(itemId) > 0;
  }

  equip(itemId: string): boolean {
    const item = ITEMS[itemId];
    if (!item || !this.has(itemId) || !EQUIPPABLE_TYPES.includes(item.type)) return false;

    if (isWeapon(item)) this.equippedWeaponId = itemId;
    if (item.type === 'armor' || item.type === 'clothing') this.equippedArmorId = itemId;
    if (item.type === 'backpack') this.equippedBackpackId = itemId;
    return true;
  }

  equipBestArmor() {
    const armor = [...this.items.keys()]
      .map((id) => ITEMS[id])
      .filter((item): item is ItemDefinition => Boolean(item) && (item.type === 'armor' || item.type === 'clothing'))
      .sort((a, b) => (b.armor ?? 0) - (a.armor ?? 0))[0];
    return armor ? this.equip(armor.id) : false;
  }

  equipBestBackpack() {
    const backpack = [...this.items.keys()]
      .map((id) => ITEMS[id])
      .filter((item): item is ItemDefinition => Boolean(item) && item.type === 'backpack')
      .sort((a, b) => (b.capacityBonus ?? 0) - (a.capacityBonus ?? 0))[0];
    return backpack ? this.equip(backpack.id) : false;
  }

  weapons(): ItemDefinition[] {
    return [...this.items.keys()].map((id) => ITEMS[id]).filter((item): item is ItemDefinition => Boolean(item) && isWeapon(item));
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
    if (!item || !this.has(itemId) || !USABLE_TYPES.includes(item.type)) return null;
    this.remove(itemId, 1);
    return item;
  }

  useBestFood() {
    const item = [...this.items.keys()]
      .map((id) => ITEMS[id])
      .filter((candidate) => candidate?.type === 'food')
      .sort((a, b) => (b.nutrition ?? 0) - (a.nutrition ?? 0))[0];
    return item ? this.use(item.id) : null;
  }

  useBestDrink() {
    const item = [...this.items.keys()]
      .map((id) => ITEMS[id])
      .filter((candidate) => candidate?.type === 'drink')
      .sort((a, b) => (b.hydration ?? 0) - (a.hydration ?? 0))[0];
    return item ? this.use(item.id) : null;
  }

  useMedical() {
    const item = [...this.items.keys()]
      .map((id) => ITEMS[id])
      .filter((candidate) => candidate?.type === 'medical')
      .sort((a, b) => Number(b.stopsBleeding) - Number(a.stopsBleeding) || (b.heal ?? 0) - (a.heal ?? 0))[0];
    return item ? this.use(item.id) : null;
  }

  entries(): InventoryEntry[] {
    return [...this.items.entries()].map(([id, count]) => {
      const item = ITEMS[id];
      const equipped = this.equippedWeaponId === id || this.equippedArmorId === id || this.equippedBackpackId === id;
      return {
        id,
        name: item?.name ?? id,
        type: item?.type ?? 'tool',
        count,
        size: item?.size ?? 1,
        equipped,
        canUse: item ? USABLE_TYPES.includes(item.type) : false,
        canEquip: item ? EQUIPPABLE_TYPES.includes(item.type) : false
      };
    });
  }

  toSaveData(): InventorySaveData {
    return {
      items: [...this.items.entries()],
      equippedWeaponId: this.equippedWeaponId,
      equippedArmorId: this.equippedArmorId,
      equippedBackpackId: this.equippedBackpackId
    };
  }

  loadSaveData(data: InventorySaveData) {
    this.items = new Map(data.items.filter(([id]) => Boolean(ITEMS[id])));
    this.equippedWeaponId = data.equippedWeaponId && this.has(data.equippedWeaponId) ? data.equippedWeaponId : null;
    this.equippedArmorId = data.equippedArmorId && this.has(data.equippedArmorId) ? data.equippedArmorId : null;
    this.equippedBackpackId = data.equippedBackpackId && this.has(data.equippedBackpackId) ? data.equippedBackpackId : null;
  }

  private isBetterArmor(itemId: string) {
    const current = this.equippedArmorId ? ITEMS[this.equippedArmorId]?.armor ?? 0 : 0;
    return (ITEMS[itemId]?.armor ?? 0) > current;
  }

  private isBetterBackpack(itemId: string) {
    const current = this.equippedBackpackId ? ITEMS[this.equippedBackpackId]?.capacityBonus ?? 0 : 0;
    return (ITEMS[itemId]?.capacityBonus ?? 0) > current;
  }
}
