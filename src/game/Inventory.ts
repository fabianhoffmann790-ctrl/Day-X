import { ITEMS } from './data';
import type { InventoryEntry, ItemDefinition } from './types';

export class Inventory {
  private items = new Map<string, number>();
  private baseCapacity = 10;
  public equippedWeaponId: string | null = null;
  public armor = 0;

  get capacity() {
    let bonus = 0;
    for (const [id] of this.items) {
      const item = ITEMS[id];
      if (item.type === 'backpack') bonus = Math.max(bonus, item.capacityBonus ?? 0);
    }
    return this.baseCapacity + bonus;
  }

  get usedSlots() {
    let used = 0;
    for (const [id, count] of this.items) used += (ITEMS[id]?.size ?? 1) * count;
    return Math.round(used * 10) / 10;
  }

  add(itemId: string, count = 1): boolean {
    const item = ITEMS[itemId];
    if (!item) return false;
    const needed = item.size * count;
    if (this.usedSlots + needed > this.capacity && item.type !== 'backpack') return false;
    this.items.set(itemId, (this.items.get(itemId) ?? 0) + count);
    if (item.type === 'weapon' && !this.equippedWeaponId) this.equippedWeaponId = itemId;
    if (item.type === 'armor') this.armor = Math.max(this.armor, item.armor ?? 0);
    return true;
  }

  remove(itemId: string, count = 1): boolean {
    const current = this.items.get(itemId) ?? 0;
    if (current < count) return false;
    const next = current - count;
    if (next <= 0) this.items.delete(itemId); else this.items.set(itemId, next);
    return true;
  }

  count(itemId: string) {
    return this.items.get(itemId) ?? 0;
  }

  weapons(): ItemDefinition[] {
    return [...this.items.keys()].map((id) => ITEMS[id]).filter((item) => item?.type === 'weapon');
  }

  cycleWeapon(index: number) {
    const weapon = this.weapons()[index];
    if (weapon) this.equippedWeaponId = weapon.id;
  }

  equippedWeapon(): ItemDefinition | null {
    return this.equippedWeaponId ? ITEMS[this.equippedWeaponId] : null;
  }

  ammoForEquippedWeapon() {
    const weapon = this.equippedWeapon();
    const ammoType = weapon?.weapon?.ammoType;
    return ammoType ? this.count(ammoType) : 0;
  }

  useBestFood() {
    const food = [...this.items.keys()].map((id) => ITEMS[id]).find((item) => item.type === 'food');
    if (!food) return null;
    this.remove(food.id);
    return food;
  }

  useBestDrink() {
    const drink = [...this.items.keys()].map((id) => ITEMS[id]).find((item) => item.type === 'drink');
    if (!drink) return null;
    this.remove(drink.id);
    return drink;
  }

  useMedical() {
    const medical = [...this.items.keys()].map((id) => ITEMS[id]).find((item) => item.type === 'medical');
    if (!medical) return null;
    this.remove(medical.id);
    return medical;
  }

  entries(): InventoryEntry[] {
    return [...this.items.entries()].map(([id, count]) => ({ id, name: ITEMS[id]?.name ?? id, count }));
  }
}
