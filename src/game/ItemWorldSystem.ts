import * as THREE from 'three';
import { BALANCE } from './Balance';
import { ITEMS } from './data';
import { conditionLabel, conditionFromDurability, Inventory } from './Inventory';
import { ItemModelFactory } from './ItemModelFactory';
import type { DroppedItemSaveData, NearbyWorldItemView, SpawnedLoot } from './types';
import type { WorldLootSpot } from './WorldBuilder';

interface DroppedItem { id: string; itemId: string; count: number; group: THREE.Group; durability?: number; rotated?: boolean; customData?: Record<string, unknown>; }
const MODEL_CHILD_NAME = 'spawned-item-model';

export class ItemWorldSystem {
  private dropped: DroppedItem[] = [];
  private hoveredDropped: DroppedItem | null = null;
  private raycaster = new THREE.Raycaster();

  constructor(private scene: THREE.Scene) {}
  refreshLootSpots(spots: WorldLootSpot[]) { for (const spot of spots) this.decorateLootSpot(spot); }
  update(camera: THREE.Camera) { this.hoveredDropped = null; this.raycaster.setFromCamera(new THREE.Vector2(0, 0), camera); const hit = this.raycaster.intersectObjects(this.dropped.map((entry) => entry.group), true).find((entry) => entry.distance <= BALANCE.interaction.range); if (!hit) return; const root = this.dropped.find((entry) => hit.object === entry.group || this.isDescendant(hit.object, entry.group)); this.hoveredDropped = root ?? null; }
  prompt() { if (!this.hoveredDropped) return ''; const item = ITEMS[this.hoveredDropped.itemId]; return `[E] Aufheben: ${item?.name ?? this.hoveredDropped.itemId}${this.hoveredDropped.count > 1 ? ` x${this.hoveredDropped.count}` : ''}`; }

  pickupHovered(inventory: Inventory) { return this.hoveredDropped ? this.pickupById(this.hoveredDropped.id, inventory) : null; }
  pickupById(id: string, inventory: Inventory, placement?: { x: number; y: number; rotated: boolean }) {
    const target = this.dropped.find((entry) => entry.id === id);
    if (!target) return null;
    const item = ITEMS[target.itemId];
    if (!item) return 'Unbekanntes Item.';
    const result = placement ? inventory.addWithResultAt(target.itemId, target.count, placement.x, placement.y, placement.rotated) : inventory.addWithResult(target.itemId, target.count);
    if (result.accepted <= 0) return result.message;
    target.count = result.remaining;
    target.group.userData.count = target.count;
    if (target.count <= 0) this.removeDropped(target.id);
    return result.message;
  }

  drop(itemId: string, count: number, origin: THREE.Vector3, direction: THREE.Vector3, meta: Partial<DroppedItemSaveData> = {}) {
    const flat = direction.clone().setY(0);
    if (flat.lengthSq() < 0.01) flat.set(0, 0, -1);
    const base = origin.clone().addScaledVector(flat.normalize(), BALANCE.interaction.dropDistance);
    base.y = 0.18;
    this.spawnClustered([{ itemId, count, meta }], base);
  }

  spawnDebugLoot(origin: THREE.Vector3, mode: 'mixed' | 'ammo' | 'nonstack' | 'small_backpack' | 'large_backpack') {
    if (mode === 'ammo') return this.spawnClustered([{ itemId: 'ammo_9mm', count: 35 }], origin);
    if (mode === 'nonstack') return this.spawnClustered([{ itemId: 'pistol', count: 1 }, { itemId: 'pistol', count: 1 }, { itemId: 'rifle', count: 1 }, { itemId: 'hatchet', count: 1 }], origin);
    if (mode === 'small_backpack') return this.spawnClustered([{ itemId: 'small_backpack', count: 1 }], origin);
    if (mode === 'large_backpack') return this.spawnClustered([{ itemId: 'field_pack', count: 1 }], origin);
    return this.spawnClustered([{ itemId: 'ammo_9mm', count: 18 }, { itemId: 'bandage', count: 3 }, { itemId: 'water_bottle', count: 1 }, { itemId: 'canned_food', count: 1 }, { itemId: 'pistol', count: 1 }], origin);
  }

  nearby(position: THREE.Vector3, radius = BALANCE.interaction.nearbyInventoryRadius): NearbyWorldItemView[] {
    return this.dropped.map((entry) => ({ entry, distance: entry.group.position.distanceTo(position) })).filter(({ distance }) => distance <= radius).sort((a, b) => a.distance - b.distance).map(({ entry, distance }) => {
      const item = ITEMS[entry.itemId]; const durability = entry.durability ?? 100; const condition = conditionFromDurability(durability);
      return { id: entry.id, itemId: entry.itemId, name: item?.name ?? entry.itemId, type: item?.type ?? 'tool', count: entry.count, conditionLabel: conditionLabel(condition), distance: Math.round(distance * 10) / 10, weight: item?.weight ?? 1, totalWeight: Math.round((item?.weight ?? 1) * entry.count * 10) / 10, description: item?.description ?? '', rotated: entry.rotated };
    });
  }

  decorateLootSpot(spot: WorldLootSpot) { const old = spot.mesh.children.find((child) => child.name === MODEL_CHILD_NAME); if (old) spot.mesh.remove(old); const loot = spot.spawnedLoot as SpawnedLoot | null; if (!loot) return; const model = ItemModelFactory.create(loot.itemId); model.name = MODEL_CHILD_NAME; model.position.set(0, 0.22, 0); model.rotation.y = Math.random() * Math.PI * 2; spot.mesh.add(model); const material = spot.mesh.material; if (material instanceof THREE.MeshStandardMaterial) material.color.set(ItemModelFactory.tintForItem(loot.itemId)); }
  toSaveData(): DroppedItemSaveData[] { return this.dropped.map((entry) => ({ id: entry.id, itemId: entry.itemId, count: entry.count, position: { x: entry.group.position.x, y: entry.group.position.y, z: entry.group.position.z }, durability: entry.durability, rotated: entry.rotated, customData: entry.customData })); }
  loadSaveData(items: DroppedItemSaveData[] = []) { for (const entry of this.dropped) this.scene.remove(entry.group); this.dropped = []; const seen = new Set<string>(); for (const item of items) { if (!ITEMS[item.itemId] || seen.has(item.id)) continue; seen.add(item.id); const group = this.createDroppedGroup(item.itemId, item.count, this.findFreeDropPosition(new THREE.Vector3(item.position.x, item.position.y, item.position.z)), item.id); this.dropped.push({ id: item.id, itemId: item.itemId, count: item.count, group, durability: item.durability, rotated: item.rotated, customData: item.customData }); } }
  count() { return this.dropped.length; }
  overlapWarnings() { let warnings = 0; for (let i = 0; i < this.dropped.length; i += 1) for (let j = i + 1; j < this.dropped.length; j += 1) if (this.dropped[i].group.position.distanceTo(this.dropped[j].group.position) < BALANCE.worldItems.minDistance * 0.75) warnings += 1; if (warnings > 0) console.warn('WorldItems liegen zu nah beieinander', warnings); return warnings; }

  private spawnClustered(entries: Array<{ itemId: string; count: number; meta?: Partial<DroppedItemSaveData> }>, origin: THREE.Vector3) {
    const expanded: Array<{ itemId: string; count: number; meta?: Partial<DroppedItemSaveData> }> = [];
    for (const entry of entries) {
      const item = ITEMS[entry.itemId]; if (!item) continue;
      if (item.maxStack > 1) { let remaining = entry.count; while (remaining > 0) { const stack = Math.min(remaining, item.maxStack); expanded.push({ ...entry, count: stack }); remaining -= stack; } }
      else for (let i = 0; i < entry.count; i += 1) expanded.push({ ...entry, count: 1 });
    }
    for (const entry of expanded) { const position = this.findFreeDropPosition(origin); const id = `drop-${Date.now()}-${Math.floor(Math.random() * 999999)}`; const group = this.createDroppedGroup(entry.itemId, entry.count, position, id); this.dropped.push({ id, itemId: entry.itemId, count: entry.count, group, durability: entry.meta?.durability, rotated: entry.meta?.rotated, customData: entry.meta?.customData }); }
  }

  private findFreeDropPosition(origin: THREE.Vector3) {
    const base = origin.clone(); base.y = 0.18;
    if (this.isDropPositionFree(base)) return base;
    for (let attempt = 1; attempt <= BALANCE.worldItems.maxScatterAttempts; attempt += 1) {
      const angle = attempt * 2.399963;
      const radius = Math.min(BALANCE.worldItems.scatterRadius, 0.18 + attempt * 0.09);
      const candidate = base.clone().add(new THREE.Vector3(Math.cos(angle) * radius, 0, Math.sin(angle) * radius));
      candidate.y = 0.18;
      if (this.isDropPositionFree(candidate)) return candidate;
    }
    return base.add(new THREE.Vector3((Math.random() - 0.5) * BALANCE.worldItems.scatterRadius * 2, 0, (Math.random() - 0.5) * BALANCE.worldItems.scatterRadius * 2));
  }
  private isDropPositionFree(position: THREE.Vector3) { return this.dropped.every((entry) => entry.group.position.distanceTo(position) >= BALANCE.worldItems.minDistance); }
  private removeDropped(id: string) { const target = this.dropped.find((entry) => entry.id === id); if (!target) return; this.scene.remove(target.group); this.dropped = this.dropped.filter((entry) => entry.id !== id); if (this.hoveredDropped?.id === id) this.hoveredDropped = null; }
  private createDroppedGroup(itemId: string, count: number, position: THREE.Vector3, id: string) { const group = ItemModelFactory.create(itemId); group.position.copy(position); group.rotation.y = Math.random() * Math.PI * 2; group.userData.id = id; group.userData.itemId = itemId; group.userData.count = count; this.scene.add(group); return group; }
  private isDescendant(object: THREE.Object3D, root: THREE.Object3D): boolean { let current: THREE.Object3D | null = object; while (current) { if (current === root) return true; current = current.parent; } return false; }
}
