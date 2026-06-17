import * as THREE from 'three';
import { ITEMS } from './data';
import type { ItemDefinition, ItemType } from './types';

const categoryColors: Record<ItemType, number> = {
  food: 0xb78d45,
  drink: 0x4f83a8,
  medical: 0xd7ded8,
  ammo: 0x8a7a4f,
  melee_weapon: 0x5f5a52,
  ranged_weapon: 0x2f3031,
  armor: 0x4a5360,
  clothing: 0x58605a,
  backpack: 0x5a4830,
  tool: 0x7a6a48
};

function material(color: number) {
  return new THREE.MeshStandardMaterial({ color, roughness: 0.9, metalness: 0.05 });
}

function box(w: number, h: number, d: number, color: number, x = 0, y = 0, z = 0) {
  const mesh = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), material(color));
  mesh.position.set(x, y, z);
  return mesh;
}

function cylinder(radius: number, height: number, color: number, x = 0, y = 0, z = 0, radialSegments = 12) {
  const mesh = new THREE.Mesh(new THREE.CylinderGeometry(radius, radius, height, radialSegments), material(color));
  mesh.position.set(x, y, z);
  return mesh;
}

function sphere(radius: number, color: number, x = 0, y = 0, z = 0) {
  const mesh = new THREE.Mesh(new THREE.SphereGeometry(radius, 12, 8), material(color));
  mesh.position.set(x, y, z);
  return mesh;
}

export class ItemModelFactory {
  static create(itemId: string, options: { viewModel?: boolean } = {}) {
    const item = ITEMS[itemId];
    const group = new THREE.Group();
    group.name = `item-model-${itemId}`;
    const scale = options.viewModel ? 1.15 : 0.72;
    group.scale.setScalar(scale);
    this.populate(group, itemId, item);
    return group;
  }

  static tintForItem(itemId: string) {
    const item = ITEMS[itemId];
    return item ? categoryColors[item.type] : 0x8f876d;
  }

  private static populate(group: THREE.Group, itemId: string, item?: ItemDefinition) {
    if (!item) { group.add(box(0.45, 0.18, 0.35, 0x777777, 0, 0.09, 0)); return; }
    if (itemId.includes('apple')) { group.add(sphere(0.18, 0x8c2f28, 0, 0.18, 0), cylinder(0.025, 0.12, 0x4c3520, 0, 0.38, 0)); return; }
    if (itemId.includes('water') || itemId.includes('canteen')) { const bottle = cylinder(0.12, 0.55, 0x4f83a8, 0, 0.28, 0); bottle.rotation.x = Math.PI / 2; group.add(bottle, cylinder(0.06, 0.12, 0xded7c2, 0.32, 0.28, 0)); return; }
    if (itemId.includes('soda')) { const can = cylinder(0.13, 0.35, 0xb24b37, 0, 0.18, 0); can.rotation.x = Math.PI / 2; group.add(can); return; }
    if (item.type === 'food') { group.add(cylinder(0.17, 0.28, 0x9c8a62, 0, 0.14, 0)); return; }
    if (item.type === 'medical') { group.add(box(0.5, 0.12, 0.32, 0xdedede, 0, 0.08, 0), box(0.08, 0.14, 0.34, 0x9b3030, 0, 0.1, 0)); return; }
    if (itemId === 'pistol') { group.add(box(0.42, 0.16, 0.14, 0x252629, 0.05, 0.18, 0), box(0.12, 0.28, 0.12, 0x1c1c1d, -0.08, 0.02, 0), box(0.24, 0.08, 0.1, 0x111111, 0.34, 0.19, 0)); return; }
    if (itemId === 'rifle') { group.add(box(1.1, 0.12, 0.12, 0x242526, 0.18, 0.18, 0), box(0.34, 0.18, 0.14, 0x4d3524, -0.45, 0.16, 0), box(0.38, 0.08, 0.08, 0x111111, 0.78, 0.18, 0)); return; }
    if (itemId.includes('knife')) { group.add(box(0.15, 0.09, 0.48, 0x3a2a1e, 0, 0.1, -0.18), box(0.1, 0.04, 0.52, 0xbfc2bd, 0, 0.13, 0.22)); return; }
    if (itemId.includes('hatchet')) { group.add(box(0.08, 0.75, 0.08, 0x5b3b22, 0, 0.35, 0), box(0.38, 0.22, 0.08, 0x6f7472, 0.11, 0.72, 0)); return; }
    if (itemId.includes('crowbar')) { const bar = cylinder(0.035, 0.95, 0x7a2f2a, 0, 0.45, 0); bar.rotation.z = 0.28; group.add(bar); return; }
    if (item.type === 'ammo') { group.add(box(0.42, 0.18, 0.28, 0x7f6f42, 0, 0.1, 0)); return; }
    if (item.type === 'backpack') { group.add(box(0.44, 0.55, 0.22, 0x5a4830, 0, 0.28, 0), box(0.08, 0.42, 0.04, 0x33281d, -0.18, 0.29, -0.12), box(0.08, 0.42, 0.04, 0x33281d, 0.18, 0.29, -0.12)); return; }
    if (item.type === 'armor' || item.type === 'clothing') { group.add(box(0.46, 0.5, 0.12, categoryColors[item.type], 0, 0.25, 0)); return; }
    if (itemId.includes('hammer')) { group.add(box(0.08, 0.5, 0.08, 0x6b4a2f, 0, 0.25, 0), box(0.38, 0.12, 0.14, 0x70706a, 0, 0.54, 0)); return; }
    if (itemId.includes('wrench')) { const wrench = cylinder(0.04, 0.55, 0x777a75, 0, 0.28, 0); wrench.rotation.z = 0.4; group.add(wrench, cylinder(0.09, 0.04, 0x777a75, 0.18, 0.52, 0)); return; }
    if (itemId.includes('duct_tape')) { group.add(new THREE.Mesh(new THREE.TorusGeometry(0.16, 0.045, 8, 16), material(0x60605c))); return; }
    if (itemId.includes('toolbox')) { group.add(box(0.55, 0.28, 0.3, 0x8b3f34, 0, 0.15, 0), box(0.28, 0.06, 0.06, 0x242424, 0, 0.33, 0)); return; }
    group.add(box(0.42, 0.22, 0.32, categoryColors[item.type], 0, 0.12, 0));
  }
}
