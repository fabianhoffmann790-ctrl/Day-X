import * as THREE from 'three';
import { BALANCE } from './Balance';
import { ITEMS } from './data';
import { Inventory } from './Inventory';
import { ItemModelFactory } from './ItemModelFactory';
import type { DroppedItemSaveData, SpawnedLoot } from './types';
import type { WorldLootSpot } from './WorldBuilder';

interface DroppedItem { id: string; itemId: string; count: number; group: THREE.Group; durability?: number; rotated?: boolean; customData?: Record<string, unknown>; }
const MODEL_CHILD_NAME = 'spawned-item-model';

export class ItemWorldSystem {
  private dropped: DroppedItem[] = [];
  private hoveredDropped: DroppedItem | null = null;
  private raycaster = new THREE.Raycaster();

  constructor(private scene: THREE.Scene) {}
  refreshLootSpots(spots: WorldLootSpot[]) { for (const spot of spots) this.decorateLootSpot(spot); }
  update(camera: THREE.Camera) { this.hoveredDropped = null; this.raycaster.setFromCamera(new THREE.Vector2(0, 0), camera); const hit = this.raycaster.intersectObjects(this.dropped.map((entry) => entry.group), true).find((entry) => entry.distance <= BALANCE.interaction.range); if (!hit) return; const root = this.dropped.find((entry) => hit.object === entry.group || entry.group.children.includes(hit.object)); this.hoveredDropped = root ?? null; }
  prompt() { if (!this.hoveredDropped) return ''; const item = ITEMS[this.hoveredDropped.itemId]; return `[E] Aufheben: ${item?.name ?? this.hoveredDropped.itemId}${this.hoveredDropped.count > 1 ? ` x${this.hoveredDropped.count}` : ''}`; }

  pickupHovered(inventory: Inventory) {
    if (!this.hoveredDropped) return null;
    const target = this.hoveredDropped;
    const item = ITEMS[target.itemId];
    if (!item) return 'Unbekanntes Item.';
    const result = inventory.addWithResult(target.itemId, target.count);
    if (result.accepted <= 0) return result.message;
    target.count = result.remaining;
    if (target.count <= 0) { this.scene.remove(target.group); this.dropped = this.dropped.filter((entry) => entry.id !== target.id); this.hoveredDropped = null; }
    return result.message;
  }

  drop(itemId: string, count: number, origin: THREE.Vector3, direction: THREE.Vector3, meta: Partial<DroppedItemSaveData> = {}) {
    const flat = direction.clone().setY(0);
    if (flat.lengthSq() < 0.01) flat.set(0, 0, -1);
    const position = origin.clone().addScaledVector(flat.normalize(), BALANCE.interaction.dropDistance);
    position.y = 0.18;
    const group = this.createDroppedGroup(itemId, count, position, `drop-${Date.now()}-${Math.floor(Math.random() * 9999)}`);
    const entry = { id: group.userData.id, itemId, count, group, durability: meta.durability, rotated: meta.rotated, customData: meta.customData };
    this.dropped.push(entry);
  }

  decorateLootSpot(spot: WorldLootSpot) { const old = spot.mesh.children.find((child) => child.name === MODEL_CHILD_NAME); if (old) spot.mesh.remove(old); const loot = spot.spawnedLoot as SpawnedLoot | null; if (!loot) return; const model = ItemModelFactory.create(loot.itemId); model.name = MODEL_CHILD_NAME; model.position.set(0, 0.22, 0); model.rotation.y = Math.random() * Math.PI * 2; spot.mesh.add(model); const material = spot.mesh.material; if (material instanceof THREE.MeshStandardMaterial) material.color.set(ItemModelFactory.tintForItem(loot.itemId)); }
  toSaveData(): DroppedItemSaveData[] { return this.dropped.map((entry) => ({ id: entry.id, itemId: entry.itemId, count: entry.count, position: { x: entry.group.position.x, y: entry.group.position.y, z: entry.group.position.z }, durability: entry.durability, rotated: entry.rotated, customData: entry.customData })); }
  loadSaveData(items: DroppedItemSaveData[] = []) { for (const entry of this.dropped) this.scene.remove(entry.group); this.dropped = []; for (const item of items) { if (!ITEMS[item.itemId]) continue; const group = this.createDroppedGroup(item.itemId, item.count, new THREE.Vector3(item.position.x, item.position.y, item.position.z), item.id); this.dropped.push({ id: item.id, itemId: item.itemId, count: item.count, group, durability: item.durability, rotated: item.rotated, customData: item.customData }); } }
  count() { return this.dropped.length; }
  private createDroppedGroup(itemId: string, count: number, position: THREE.Vector3, id: string) { const group = ItemModelFactory.create(itemId); group.position.copy(position); group.rotation.y = Math.random() * Math.PI * 2; group.userData.id = id; group.userData.itemId = itemId; group.userData.count = count; this.scene.add(group); return group; }
}
