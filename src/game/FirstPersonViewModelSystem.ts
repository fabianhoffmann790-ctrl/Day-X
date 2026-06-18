import * as THREE from 'three';
import { AssetRegistry } from './AssetRegistry';
import { ItemModelFactory } from './ItemModelFactory';
import { ITEMS } from './data';

export class FirstPersonViewModelSystem {
  private root = new THREE.Group();
  private currentItemId: string | null = null;
  private swingTime = 0;
  private recoilTime = 0;
  private reloadTime = 0;

  constructor(private camera: THREE.Camera) {
    this.root.name = 'first-person-viewmodel';
    this.root.position.set(0.34, -0.34, -0.72);
    this.root.rotation.set(-0.08, -0.24, 0.04);
    this.camera.add(this.root);
  }

  setItem(itemId: string | null) {
    if (this.currentItemId === itemId) return;
    this.currentItemId = itemId;
    this.root.clear();
    if (!itemId) { this.createHands(); return; }
    const item = ITEMS[itemId];
    if (!item?.weapon && item.type !== 'medical' && item.type !== 'food' && item.type !== 'drink') { this.createHands(); return; }
    const asset = AssetRegistry.item(itemId);
    const model = ItemModelFactory.create(itemId, { viewModel: true });
    const cfg = asset.viewModel;
    if (cfg) { model.scale.multiplyScalar(cfg.scale); model.position.set(...cfg.position); model.rotation.set(...cfg.rotation); }
    else model.rotation.set(0.12, item.weapon?.kind === 'melee' ? 0.55 : 0.08, item.weapon?.kind === 'melee' ? -0.55 : 0);
    this.root.add(model);
    this.createHands();
  }

  triggerAttack(kind: 'melee' | 'ranged') { if (kind === 'melee') this.swingTime = 0.22; else this.recoilTime = 0.16; }
  triggerReload() { this.reloadTime = 0.65; }
  triggerUse() { this.swingTime = 0.32; }

  update(delta: number, moving: boolean, sprinting: boolean) {
    this.swingTime = Math.max(0, this.swingTime - delta);
    this.recoilTime = Math.max(0, this.recoilTime - delta);
    this.reloadTime = Math.max(0, this.reloadTime - delta);
    const now = performance.now() * 0.004;
    const bob = moving ? Math.sin(now * (sprinting ? 2.2 : 1.3)) * (sprinting ? 0.045 : 0.022) : Math.sin(now * 0.45) * 0.008;
    this.root.position.x = 0.34 + Math.sin(now) * 0.01;
    this.root.position.y = -0.34 + bob - (sprinting ? 0.08 : 0) - this.reloadTime * 0.12;
    this.root.position.z = -0.72 - this.recoilTime * 0.28;
    this.root.rotation.x = -0.08 - this.swingTime * 1.8 + this.recoilTime * 0.7 + this.reloadTime * 0.8;
    this.root.rotation.y = -0.24 + (sprinting ? 0.18 : 0);
    this.root.rotation.z = 0.04 + this.swingTime * 1.1 + (sprinting ? -0.18 : 0);
  }

  private createHands() {
    const skin = new THREE.MeshStandardMaterial({ color: 0x9a7760, roughness: 0.95 });
    const sleeve = new THREE.MeshStandardMaterial({ color: 0x343b35, roughness: 1 });
    const leftSleeve = new THREE.Mesh(new THREE.CapsuleGeometry(0.06, 0.18, 3, 8), sleeve);
    const rightSleeve = new THREE.Mesh(new THREE.CapsuleGeometry(0.06, 0.18, 3, 8), sleeve);
    const left = new THREE.Mesh(new THREE.CapsuleGeometry(0.055, 0.28, 3, 8), skin);
    const right = new THREE.Mesh(new THREE.CapsuleGeometry(0.055, 0.28, 3, 8), skin);
    leftSleeve.position.set(-0.16, -0.1, 0.16); rightSleeve.position.set(0.2, -0.08, 0.14);
    left.position.set(-0.12, -0.06, 0.1); right.position.set(0.16, -0.04, 0.08);
    left.rotation.set(1.15, 0.1, -0.22); right.rotation.set(1.1, -0.2, 0.24);
    leftSleeve.rotation.copy(left.rotation); rightSleeve.rotation.copy(right.rotation);
    this.root.add(leftSleeve, rightSleeve, left, right);
  }
}
