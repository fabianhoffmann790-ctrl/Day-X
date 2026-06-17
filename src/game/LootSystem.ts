import { ITEMS, LOOT_POOLS } from './data';
import type { ItemDefinition } from './types';

export class LootSystem {
  roll(poolId: string, chance: number): ItemDefinition | null {
    if (Math.random() > chance) return null;
    const pool = LOOT_POOLS[poolId];
    if (!pool?.length) return null;
    const total = pool.reduce((sum, entry) => sum + entry.weight, 0);
    let cursor = Math.random() * total;
    for (const entry of pool) {
      cursor -= entry.weight;
      if (cursor <= 0) return ITEMS[entry.itemId] ?? null;
    }
    return ITEMS[pool[pool.length - 1].itemId] ?? null;
  }
}
