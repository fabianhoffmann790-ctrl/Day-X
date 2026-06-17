import { ITEMS, LOOT_POOLS } from './data';
import type { ItemDefinition, LootSpotDefinition, SpawnedLoot } from './types';

function randomIntInclusive(min: number, max: number) {
  return Math.floor(min + Math.random() * (max - min + 1));
}

export class LootSystem {
  spawn(definition: LootSpotDefinition): SpawnedLoot | null {
    const item = this.roll(definition.pool, definition.chance);
    if (!item) return null;

    const poolEntry = LOOT_POOLS[definition.pool]?.find((entry) => entry.itemId === item.id);
    const minCount = poolEntry?.minCount ?? 1;
    const maxCount = poolEntry?.maxCount ?? minCount;
    return {
      itemId: item.id,
      count: randomIntInclusive(minCount, maxCount)
    };
  }

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
