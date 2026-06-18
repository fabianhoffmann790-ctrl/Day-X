import * as THREE from 'three';
import { AssetRegistry, type ItemModelKind } from './AssetRegistry';
import { ITEMS } from './data';
import type { ItemType } from './types';

const categoryColors: Record<ItemType, number> = {
  food: 0xb78d45, drink: 0x4f83a8, medical: 0xd7ded8, ammo: 0x8a7a4f, melee_weapon: 0x5f5a52, ranged_weapon: 0x2f3031, armor: 0x4a5360, clothing: 0x58605a, backpack: 0x5a4830, tool: 0x7a6a48
};
const mats = new Map<string, THREE.MeshStandardMaterial>();
function mat(color: number, metalness = 0.05) { const key = `${color}-${metalness}`; const cached = mats.get(key); if (cached) return cached; const created = new THREE.MeshStandardMaterial({ color, roughness: 0.9, metalness }); mats.set(key, created); return created; }
function box(w: number, h: number, d: number, color: number, x = 0, y = 0, z = 0, metalness = 0.05) { const mesh = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat(color, metalness)); mesh.position.set(x, y, z); return mesh; }
function cyl(radius: number, height: number, color: number, x = 0, y = 0, z = 0, radial = 12, metalness = 0.05) { const mesh = new THREE.Mesh(new THREE.CylinderGeometry(radius, radius, height, radial), mat(color, metalness)); mesh.position.set(x, y, z); return mesh; }
function sphere(radius: number, color: number, x = 0, y = 0, z = 0) { const mesh = new THREE.Mesh(new THREE.SphereGeometry(radius, 12, 8), mat(color)); mesh.position.set(x, y, z); return mesh; }
function cone(radius: number, height: number, color: number, x = 0, y = 0, z = 0, radial = 10) { const mesh = new THREE.Mesh(new THREE.ConeGeometry(radius, height, radial), mat(color)); mesh.position.set(x, y, z); return mesh; }
function torus(radius: number, tube: number, color: number, x = 0, y = 0, z = 0) { const mesh = new THREE.Mesh(new THREE.TorusGeometry(radius, tube, 8, 18), mat(color)); mesh.position.set(x, y, z); return mesh; }

export class ItemModelFactory {
  static create(itemId: string, options: { viewModel?: boolean } = {}) {
    const group = new THREE.Group();
    group.name = `item-model-${itemId}`;
    const asset = AssetRegistry.item(itemId);
    this.populate(group, asset.modelKind, itemId);
    group.scale.setScalar((options.viewModel ? 1.15 : 0.72) * asset.scale);
    return group;
  }

  static tintForItem(itemId: string) { const item = ITEMS[itemId]; return item ? categoryColors[item.type] : 0x8f876d; }

  private static populate(group: THREE.Group, kind: ItemModelKind, itemId: string) {
    switch (kind) {
      case 'can': return group.add(this.can(0x9c8a62));
      case 'fruit': return group.add(sphere(0.18, itemId === 'rotten_food' ? 0x3f3a22 : 0x8c2f28, 0, 0.2, 0), cyl(0.025, 0.12, 0x4c3520, 0, 0.42, 0));
      case 'bar': return group.add(box(0.54, 0.09, 0.26, 0x9f7140, 0, 0.08, 0), box(0.5, 0.025, 0.22, 0xd0ba82, 0, 0.14, 0));
      case 'bottle': return this.addBottle(group, itemId.includes('dirty') ? 0x375432 : 0x4f83a8);
      case 'soda_can': { const c = this.can(0xb24b37); c.scale.set(0.82, 0.82, 0.82); return group.add(c); }
      case 'canteen': return group.add(box(0.32, 0.38, 0.14, 0x4a5a4a, 0, 0.24, 0), cyl(0.07, 0.08, 0x2f382f, 0, 0.48, 0), box(0.42, 0.04, 0.05, 0x2b2b23, 0, 0.4, -0.08));
      case 'bandage_roll': { const roll = cyl(0.18, 0.22, 0xe8e0cf, 0, 0.2, 0); roll.rotation.x = Math.PI / 2; return group.add(roll, box(0.06, 0.04, 0.34, 0xc64d4d, 0, 0.21, 0)); }
      case 'rag_bundle': return group.add(box(0.42, 0.16, 0.34, 0xaaa08d, 0, 0.11, 0), box(0.35, 0.04, 0.38, 0x786f60, 0.02, 0.2, 0.02));
      case 'med_box': return group.add(box(0.5, 0.14, 0.32, 0xdedede, 0, 0.1, 0), box(0.08, 0.16, 0.34, 0x9b3030, 0, 0.12, 0), box(0.52, 0.035, 0.09, 0x9b3030, 0, 0.18, 0));
      case 'pill_pack': return group.add(box(0.42, 0.05, 0.27, 0xe8e6dc, 0, 0.08, 0), ...[-0.13, 0, 0.13].map((x) => cyl(0.035, 0.02, 0xd0d0d0, x, 0.13, 0, 10)));
      case 'fluid_bottle': return this.addBottle(group, 0xcfd8d1, 0x5a8f92);
      case 'blood_bag': return group.add(box(0.28, 0.42, 0.05, 0x7a1f1f, 0, 0.24, 0), cyl(0.012, 0.45, 0x553333, 0.18, 0.16, 0));
      case 'pistol': return group.add(box(0.42, 0.16, 0.14, 0x252629, 0.05, 0.18, 0, 0.45), box(0.12, 0.28, 0.12, 0x1c1c1d, -0.08, 0.02, 0, 0.4), box(0.24, 0.08, 0.1, 0x111111, 0.34, 0.19, 0, 0.6), box(0.1, 0.05, 0.1, 0x0c0c0c, 0.05, 0.07, 0, 0.6));
      case 'rifle': return group.add(box(1.1, 0.12, 0.12, 0x242526, 0.18, 0.18, 0, 0.5), box(0.34, 0.18, 0.14, 0x4d3524, -0.45, 0.16, 0), box(0.38, 0.08, 0.08, 0x111111, 0.78, 0.18, 0, 0.6), box(0.14, 0.22, 0.08, 0x171717, 0.1, 0.02, 0, 0.5), cyl(0.035, 0.36, 0x111111, 0.35, 0.3, 0, 12, 0.6));
      case 'knife': return group.add(box(0.15, 0.09, 0.48, 0x3a2a1e, 0, 0.1, -0.18), box(0.08, 0.035, 0.56, 0xbfc2bd, 0, 0.13, 0.24, 0.35));
      case 'hatchet': return group.add(box(0.08, 0.75, 0.08, 0x5b3b22, 0, 0.35, 0), box(0.38, 0.22, 0.08, 0x6f7472, 0.11, 0.72, 0, 0.4), box(0.06, 0.14, 0.1, 0x2f2f2f, -0.08, 0.72, 0, 0.4));
      case 'crowbar': { const bar = cyl(0.035, 0.95, 0x7a2f2a, 0, 0.45, 0, 12, 0.35); bar.rotation.z = 0.28; const hook = torus(0.11, 0.025, 0x7a2f2a, 0.18, 0.86, 0); hook.rotation.z = Math.PI / 2; return group.add(bar, hook); }
      case 'spear': { const shaft = cyl(0.025, 1.4, 0x6b4a2e, 0, 0.65, 0, 8); shaft.rotation.z = 0.2; return group.add(shaft, cone(0.08, 0.22, 0xa0a0a0, 0.14, 1.32, 0, 8)); }
      case 'ammo_stack': return this.addAmmo(group, itemId.includes('556') ? 5 : 4);
      case 'backpack_small': return this.addBackpack(group, 0x5a4830, 0.75);
      case 'backpack_medium': return this.addBackpack(group, 0x4b3d2d, 1);
      case 'backpack_large': return this.addBackpack(group, 0x37422f, 1.18);
      case 'vest': return group.add(box(0.5, 0.55, 0.12, 0x39424d, 0, 0.29, 0), box(0.16, 0.42, 0.06, 0x242a30, -0.18, 0.31, -0.04), box(0.16, 0.42, 0.06, 0x242a30, 0.18, 0.31, -0.04));
      case 'helmet': return group.add(sphere(0.22, 0x3b4245, 0, 0.25, 0), box(0.38, 0.09, 0.18, 0x2b3032, 0, 0.14, 0.03));
      case 'clothing_pack': return group.add(box(0.5, 0.16, 0.36, 0x58605a, 0, 0.11, 0), box(0.42, 0.05, 0.38, 0x354038, 0, 0.22, 0));
      case 'boots': return group.add(box(0.18, 0.18, 0.34, 0x2d241b, -0.12, 0.1, 0), box(0.18, 0.18, 0.34, 0x2d241b, 0.12, 0.1, 0));
      case 'hammer': return group.add(box(0.08, 0.5, 0.08, 0x6b4a2f, 0, 0.25, 0), box(0.38, 0.12, 0.14, 0x70706a, 0, 0.54, 0, 0.4));
      case 'wrench': { const w = cyl(0.04, 0.55, 0x777a75, 0, 0.28, 0, 12, 0.4); w.rotation.z = 0.4; return group.add(w, torus(0.09, 0.02, 0x777a75, 0.18, 0.52, 0)); }
      case 'saw': return group.add(box(0.62, 0.05, 0.2, 0xb7b7ad, 0, 0.2, 0, 0.35), box(0.18, 0.13, 0.08, 0x59331f, -0.36, 0.2, 0));
      case 'duct_tape': { const t = torus(0.16, 0.045, 0x60605c, 0, 0.18, 0); t.rotation.x = Math.PI / 2; return group.add(t); }
      case 'toolbox': return group.add(box(0.55, 0.28, 0.3, 0x8b3f34, 0, 0.15, 0), box(0.28, 0.06, 0.06, 0x242424, 0, 0.33, 0));
      case 'nails': return group.add(...[-0.16, -0.06, 0.04, 0.14].map((x) => { const nail = cyl(0.012, 0.35, 0xb8b8aa, x, 0.12, 0, 8, 0.4); nail.rotation.z = Math.PI / 2 + x; return nail; }));
      case 'rope': { const r = torus(0.18, 0.035, 0x8a6a3d, 0, 0.18, 0); r.rotation.x = Math.PI / 2; return group.add(r); }
      case 'firewood': return group.add(box(0.12, 0.12, 0.55, 0x654322, -0.09, 0.1, 0), box(0.12, 0.12, 0.55, 0x6f4a28, 0.08, 0.16, 0.02));
      case 'metal_parts': return group.add(box(0.42, 0.08, 0.22, 0x656b68, 0, 0.1, 0, 0.45), box(0.2, 0.05, 0.14, 0x333837, 0.12, 0.18, 0, 0.45));
      case 'key': return group.add(cyl(0.04, 0.36, 0xc7aa4a, 0, 0.18, 0, 10, 0.35), torus(0.08, 0.014, 0xc7aa4a, -0.2, 0.18, 0));
      case 'map': return group.add(box(0.46, 0.025, 0.34, 0xd4c8a6, 0, 0.06, 0), box(0.02, 0.03, 0.34, 0x7a6848, -0.1, 0.08, 0));
      case 'radio': return group.add(box(0.28, 0.42, 0.12, 0x222824, 0, 0.24, 0), cyl(0.01, 0.44, 0x111111, 0.12, 0.55, 0, 6), box(0.2, 0.08, 0.03, 0x384c42, 0, 0.32, 0.07));
      case 'torch': { const stick = cyl(0.035, 0.82, 0x5a3d25, 0, 0.4, 0, 8); stick.rotation.z = 0.2; return group.add(stick, sphere(0.12, 0x7a2e18, 0.08, 0.82, 0)); }
      case 'campfire_kit': return group.add(box(0.44, 0.14, 0.34, 0x5a3d25, 0, 0.1, 0), cone(0.12, 0.28, 0x3a2a1c, 0.12, 0.29, 0));
      default: return group.add(cyl(0.16, 0.22, 0x7a6a48, 0, 0.13, 0, 8));
    }
  }

  private static can(color: number) { const g = new THREE.Group(); const c = cyl(0.17, 0.3, color, 0, 0.16, 0, 14, 0.2); c.rotation.x = Math.PI / 2; g.add(c, cyl(0.172, 0.016, 0xd1d1c7, 0.16, 0.16, 0, 14, 0.25)); return g; }
  private static addBottle(group: THREE.Group, color: number, capColor = 0xded7c2) { const bottle = cyl(0.12, 0.52, color, 0, 0.28, 0, 14); bottle.rotation.x = Math.PI / 2; group.add(bottle, cyl(0.06, 0.13, capColor, 0.32, 0.28, 0, 12), cyl(0.075, 0.12, color, 0.22, 0.28, 0, 12)); }
  private static addAmmo(group: THREE.Group, rows: number) { for (let i = 0; i < rows; i += 1) { const p = cyl(0.025, 0.24, 0xc6a94a, -0.16 + i * 0.08, 0.13, 0, 8, 0.35); p.rotation.z = Math.PI / 2; group.add(p); } group.add(box(0.46, 0.05, 0.18, 0x4d4528, 0, 0.05, 0)); }
  private static addBackpack(group: THREE.Group, color: number, s: number) { group.add(box(0.44 * s, 0.55 * s, 0.22 * s, color, 0, 0.28 * s, 0), box(0.08 * s, 0.42 * s, 0.04 * s, 0x262018, -0.18 * s, 0.29 * s, -0.12 * s), box(0.08 * s, 0.42 * s, 0.04 * s, 0x262018, 0.18 * s, 0.29 * s, -0.12 * s), box(0.36 * s, 0.09 * s, 0.05 * s, 0x1e1a15, 0, 0.58 * s, -0.1 * s)); }
}
