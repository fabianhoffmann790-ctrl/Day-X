import * as THREE from 'three';
import { BALANCE } from './Balance';
import { ITEMS } from './data';
import { Inventory } from './Inventory';
import { ItemModelFactory } from './ItemModelFactory';
import type { DroppedItemSaveData, SpawnedLoot } from './types';
import type { WorldLootSpot } from './WorldBuilder';

interface DroppedItem {
  id: string;
  itemId: string;
  count: number;
  group: THREE.Group;
}

const MODEL_CHILD_NAME = 'spawned-item-model';

export class ItemWorldSystem {
  private dropped: DroppedItem[] = [];
  private hoveredDropped: DroppedItem | null = null;
  private raycaster = new THREE.Raycaster();

  constructor(private scene: THREE.Scene) {}

  refreshLootSpots(spots: WorldLootSpot[]) {
    for (const spot of spots) this.decorateLootSpot(spot);
  }

  update(camera: THREE.Camera) {
    this.hoveredDropped = null;
    this.raycaster.setFromCamera(new THREE.Vector2(0, 0), camera);
    const hit = this.raycaster.intersectObjects(this.dropped.map((entry) => entry.group), true).find((entry) => entry.distance <= BALANCE.interaction.range);
    if (!hit) return;
    const root = this.dropped.find((entry) => hit.object === entry.group || entry.group.children.includes(hit.object));
    this.hoveredDropped = root ?? null;
  }

  prompt() {
    if (!this.hoveredDropped) return '';
    const item = ITEMS[this.hoveredDropped.itemId];
    return `[E] Aufheben: ${item?.name ?? this.hoveredDropped.itemId}${this.hoveredDropped.count > 1 ? ` x${this.hoveredDropped.count}` : ''}`;
  }

  pickupHovered(inventory: Inventory) {
    if (!this.hoveredDropped) return null;
    const target = this.hoveredDropped;
    const item = ITEMS[target.itemId];
    if (!item) return 'Unbekanntes Item.';
    if (!inventory.add(target.itemId, target.count)) return `Inventar voll: ${item.name} bleibt liegen.`;
    this.scene.remove(target.group);
    this.dropped = this.dropped.filter((entry) => entry.id !== target.id);
    this.hoveredDropped = null;
    return `Aufgehoben: ${item.name}${target.count > 1 ? ` x${target.count}` : ''}.`;
  }

  drop(itemId: string, count: number, origin: THREE.Vector3, direction: THREE.Vector3) {
    const position = origin.clone().addScaledVector(direction.setY(0).normalize(), BALANCE.interaction.dropDistance);
    position.y = 0.18;
    const group = this.createDroppedGroup(itemId, count, position, `drop-${Date.now()}-${Math.floor(Math.random() * 9999)}`);
    this.dropped.push({ id: group.userData.id, itemId, count, group });
  }

  decorateLootSpot(spot: WorldLootSpot) {
    const old = spot.mesh.children.find((child) => child.name === MODEL_CHILD_NAME);
    if (old) spot.mesh.remove(old);
    const loot = spot.spawnedLoot as SpawnedLoot | null;
    if (!loot) return;
    const model = ItemModelFactory.create(loot.itemId);
    model.name = MODEL_CHILD_NAME;
    model.position.set(0, 0.22, 0);
    model.rotation.y = Math.random() * Math.PI * 2;
    spot.mesh.add(model);
    const material = spot.mesh.material;
    if (material instanceof THREE.MeshStandardMaterial) material.color.set(ItemModelFactory.tintForItem(loot.itemId));
  }

  toSaveData(): DroppedItemSaveData[] {
    return this.dropped.map((entry) => ({ id: entry.id, itemId: entry.itemId, count: entry.count, position: { x: entry.group.position.x, y: entry.group.position.y, z: entry.group.position.z } }));
  }

  loadSaveData(items: DroppedItemSaveData[] = []) {
    for (const entry of this.dropped) this.scene.remove(entry.group);
    this.dropped = [];
    for (const item of items) {
      if (!ITEMS[item.itemId]) continue;
      const group = this.createDroppedGroup(item.itemId, item.count, new THREE.Vector3(item.position.x, item.position.y, item.position.z), item.id);
      this.dropped.push({ id: item.id, itemId: item.itemId, count: item.count, group });
    }
  }

  count() { return this.dropped.length; }

  private createDroppedGroup(itemId: string, count: number, position: THREE.Vector3, id: string) {
    const group = ItemModelFactory.create(itemId);
    group.position.copy(position);
    group.rotation.y = Math.random() * Math.PI * 2;
    group.userData.id = id;
    group.userData.itemId = itemId;
    group.userData.count = count;
    this.scene.add(group);
    return group;
  }
}
