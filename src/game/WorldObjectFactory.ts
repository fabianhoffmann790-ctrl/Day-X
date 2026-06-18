import * as THREE from 'three';
import type { BuildingType, ContainerKind, VehicleKind } from './types';

const mats = new Map<string, THREE.MeshStandardMaterial>();
function mat(color: number, metalness = 0.03) { const key = `${color}-${metalness}`; const cached = mats.get(key); if (cached) return cached; const created = new THREE.MeshStandardMaterial({ color, roughness: 0.92, metalness }); mats.set(key, created); return created; }
function box(w: number, h: number, d: number, color: number, x = 0, y = 0, z = 0, metalness = 0.03) { const mesh = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat(color, metalness)); mesh.position.set(x, y, z); return mesh; }
function cyl(r: number, h: number, color: number, x = 0, y = 0, z = 0, seg = 10, metalness = 0.03) { const mesh = new THREE.Mesh(new THREE.CylinderGeometry(r, r, h, seg), mat(color, metalness)); mesh.position.set(x, y, z); return mesh; }
function cone(r: number, h: number, color: number, x = 0, y = 0, z = 0, seg = 8) { const mesh = new THREE.Mesh(new THREE.ConeGeometry(r, h, seg), mat(color)); mesh.position.set(x, y, z); return mesh; }

export class WorldObjectFactory {
  static createBuilding(type: BuildingType, width: number, depth: number, color: number, floors = 1) {
    const group = new THREE.Group();
    const floorHeight = type === 'workshop' || type === 'military' ? 4.2 : 3.2;
    const height = floorHeight * floors;
    const bodyColor = color;
    group.add(box(width, height, depth, bodyColor, 0, height / 2, 0));
    group.add(box(width + 0.55, 0.22, depth + 0.55, 0x171a17, 0, 0.08, 0));
    if (type === 'house') this.addHouseRoof(group, width, depth, height);
    else group.add(box(width + 0.7, 0.28, depth + 0.7, 0x23241f, 0, height + 0.15, 0));
    this.addDoor(group, width, depth);
    this.addWindows(group, width, depth, floors, type);
    if (type === 'market') this.addSign(group, 'MARKT', 0xcab36b, width, depth, height);
    if (type === 'police') this.addSign(group, 'POLIZEI', 0x88a8c8, width, depth, height);
    if (type === 'hospital') this.addSign(group, 'KLINIK', 0xd8dddd, width, depth, height);
    if (type === 'workshop') this.addWorkshopDetails(group, width, depth, height);
    if (type === 'military') this.addMilitaryDetails(group, width, depth, height);
    if (floors > 1) this.addApartmentDetails(group, width, depth, floors, height);
    return group;
  }

  static createLootSpot(label: string, color: number) {
    const mesh = new THREE.Mesh(new THREE.BoxGeometry(0.78, 0.28, 0.72), mat(color));
    mesh.add(box(0.82, 0.08, 0.76, 0x1b1d18, 0, 0.18, 0));
    mesh.add(box(0.08, 0.16, 0.76, 0x2d261b, -0.28, 0.12, 0));
    mesh.add(box(0.08, 0.16, 0.76, 0x2d261b, 0.28, 0.12, 0));
    mesh.userData.label = label;
    return mesh;
  }

  static createVehicle(kind: VehicleKind, wrecked = true) {
    const group = new THREE.Group();
    const color = kind === 'ambulance' ? 0xd7d5cc : kind === 'police_car' ? 0x25384f : kind === 'military_truck' ? 0x354a31 : kind === 'van' ? 0x5d5c50 : 0x383d39;
    const length = kind === 'military_truck' ? 5.2 : kind === 'van' ? 4.8 : 3.8;
    const height = kind === 'military_truck' || kind === 'van' ? 1.65 : 1.15;
    group.add(box(length, height, 1.85, color, 0, 0.55, 0));
    group.add(box(length * 0.42, 0.78, 1.55, 0x182125, -length * 0.12, 1.25, 0));
    group.add(box(length * 0.36, 0.05, 1.7, 0x0d1010, length * 0.18, 1.16, 0));
    [-1, 1].forEach((sx) => [-1, 1].forEach((sz) => { const wheel = cyl(0.35, 0.28, 0x111111, sx * length * 0.32, 0.28, sz * 0.92, 14, 0.1); wheel.rotation.x = Math.PI / 2; group.add(wheel); }));
    group.add(box(0.8, 0.12, 1.92, 0x262a26, length * 0.36, 0.65, 0));
    if (kind === 'police_car') group.add(box(0.55, 0.1, 0.18, 0x9db8d4, -0.25, 1.72, 0));
    if (kind === 'ambulance') { group.add(box(0.1, 0.44, 0.05, 0xb23834, length * 0.05, 1.65, 0.94), box(0.44, 0.1, 0.05, 0xb23834, length * 0.05, 1.65, 0.94)); }
    if (kind === 'military_truck') group.add(box(1.2, 0.45, 1.65, 0x263722, length * 0.23, 1.65, 0));
    if (wrecked) group.rotation.z = (Math.random() - 0.5) * 0.05;
    return group;
  }

  static createContainer(kind: ContainerKind, locked = false) {
    const group = new THREE.Group();
    const baseColor = locked ? 0x4e3a2c : kind === 'medical_cabinet' ? 0xd6d8d4 : kind === 'military_crate' ? 0x344331 : kind === 'fridge' ? 0xc6c9c1 : kind === 'toolbox' ? 0x8b3f34 : kind === 'trash' ? 0x303430 : 0x66583d;
    if (kind === 'fridge' || kind === 'medical_cabinet' || kind === 'locker' || kind === 'weapon_cabinet') group.add(box(0.78, 1.45, 0.55, baseColor, 0, 0.72, 0), box(0.06, 1.2, 0.04, 0x222222, 0.32, 0.75, 0.29));
    else if (kind === 'trash') { const bin = cyl(0.38, 0.82, baseColor, 0, 0.42, 0, 12); group.add(bin, box(0.72, 0.08, 0.72, 0x1d1f1d, 0, 0.86, 0)); }
    else group.add(box(1.15, 0.68, 0.86, baseColor, 0, 0.34, 0), box(1.18, 0.08, 0.9, 0x2a2419, 0, 0.72, 0), box(0.12, 0.28, 0.08, 0xc0a55c, 0.52, 0.46, 0.43));
    return group;
  }

  static createDoor(kind: string, open = false) {
    const group = new THREE.Group();
    const color = kind === 'military' ? 0x2d3a2a : kind === 'police' || kind === 'metal' ? 0x30383b : 0x5a3e28;
    const panel = box(1.2, 2.2, 0.12, color, open ? 0.48 : 0, 1.1, 0);
    panel.rotation.y = open ? -Math.PI / 2.6 : 0;
    group.add(panel, box(0.09, 2.3, 0.16, 0x141414, -0.64, 1.15, 0));
    return group;
  }

  static createProp(kind: 'barrier' | 'pallet' | 'barrel' | 'lamp' | 'sign' | 'bench' | 'trashbag', length = 2) {
    const group = new THREE.Group();
    if (kind === 'barrier') group.add(box(length, 0.36, 0.28, 0x58452c, 0, 0.45, 0), box(length, 0.18, 0.18, 0x7d6a42, 0, 0.82, 0));
    if (kind === 'pallet') for (let i = 0; i < 4; i += 1) group.add(box(1.4, 0.08, 0.12, 0x5a4328, 0, 0.08 + i * 0.09, -0.42 + i * 0.28));
    if (kind === 'barrel') { const b = cyl(0.32, 0.82, 0x5a3b2e, 0, 0.42, 0, 14, 0.08); group.add(b, cyl(0.33, 0.04, 0x2a2a28, 0, 0.84, 0, 14)); }
    if (kind === 'lamp') group.add(cyl(0.05, 3.2, 0x242827, 0, 1.6, 0, 8), box(0.9, 0.08, 0.08, 0x242827, 0.36, 3.15, 0), box(0.24, 0.16, 0.24, 0xc2b36b, 0.82, 3.02, 0));
    if (kind === 'sign') group.add(cyl(0.035, 1.7, 0x343836, 0, 0.85, 0, 8), box(0.8, 0.45, 0.04, 0x6a7a66, 0, 1.55, 0));
    if (kind === 'bench') group.add(box(1.5, 0.12, 0.35, 0x5a4328, 0, 0.55, 0), box(1.5, 0.12, 0.12, 0x5a4328, 0, 0.9, -0.16), box(0.08, 0.55, 0.08, 0x222222, -0.55, 0.28, 0), box(0.08, 0.55, 0.08, 0x222222, 0.55, 0.28, 0));
    if (kind === 'trashbag') group.add(cone(0.38, 0.72, 0x111411, 0, 0.36, 0, 9), cyl(0.06, 0.1, 0x0a0b0a, 0, 0.74, 0, 8));
    return group;
  }

  private static addHouseRoof(group: THREE.Group, width: number, depth: number, height: number) {
    const roof = cone(Math.max(width, depth) * 0.68, 1.1, 0x2d2720, 0, height + 0.55, 0, 4);
    roof.rotation.y = Math.PI / 4;
    roof.scale.z = depth / width;
    group.add(roof);
  }
  private static addDoor(group: THREE.Group, width: number, depth: number) { group.add(box(1.35, 2.05, 0.12, 0x1d130d, 0, 1.02, depth / 2 + 0.08), box(0.12, 0.12, 0.08, 0xc4a04f, 0.45, 1.05, depth / 2 + 0.16)); }
  private static addWindows(group: THREE.Group, width: number, depth: number, floors: number, type: BuildingType) {
    const perSide = Math.max(2, Math.floor(width / 4));
    for (let floor = 0; floor < floors; floor += 1) for (let i = 0; i < perSide; i += 1) { const x = -width / 2 + 1.4 + i * ((width - 2.8) / Math.max(1, perSide - 1)); const y = 1.45 + floor * 3.15; const color = type === 'hospital' ? 0xb8c8c8 : 0x242c2d; group.add(box(0.72, 0.72, 0.06, color, x, y, depth / 2 + 0.09), box(0.72, 0.72, 0.06, color, x, y, -depth / 2 - 0.09)); }
  }
  private static addSign(group: THREE.Group, _text: string, color: number, width: number, depth: number, height: number) { group.add(box(Math.min(width - 2, 4.2), 0.48, 0.08, color, 0, height - 0.75, depth / 2 + 0.13)); }
  private static addWorkshopDetails(group: THREE.Group, width: number, depth: number, _height: number) { group.add(box(width * 0.36, 2.4, 0.16, 0x22201c, width * 0.18, 1.2, depth / 2 + 0.12)); }
  private static addMilitaryDetails(group: THREE.Group, width: number, depth: number, height: number) { group.add(box(width + 0.8, 0.22, 0.22, 0x222a1e, 0, height + 0.4, depth / 2 + 0.1), cyl(0.25, 1.2, 0x2d3a2a, -width / 2 + 0.8, height + 0.7, depth / 2 + 0.4)); }
  private static addApartmentDetails(group: THREE.Group, width: number, depth: number, floors: number, height: number) { group.add(box(1.4, height, 0.2, 0x1c211d, width / 2 - 1.2, height / 2, depth / 2 + 0.14)); for (let f = 1; f < floors; f += 1) group.add(box(width - 0.8, 0.08, depth - 0.8, 0x252824, 0, f * 3.2, 0)); for (let s = 0; s < floors * 2; s += 1) group.add(box(1.1, 0.12, 0.72, 0x35352d, width / 2 - 1.2, 0.25 + s * 0.55, depth / 2 - 1.2 - s * 0.18)); }
}
