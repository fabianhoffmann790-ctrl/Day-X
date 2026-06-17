import * as THREE from 'three';
import { BALANCE } from './Balance';
import type { CampfireSaveData } from './types';

interface Campfire {
  id: string;
  group: THREE.Group;
  light: THREE.PointLight;
  burnTimeRemaining: number;
  lit: boolean;
}

export class FireSystem {
  private fires: Campfire[] = [];
  private nextId = 1;

  constructor(private scene: THREE.Scene) {}

  place(position: THREE.Vector3) {
    const group = new THREE.Group();
    group.position.set(position.x, 0.08, position.z);

    const base = new THREE.Mesh(new THREE.CylinderGeometry(0.7, 0.8, 0.16, 10), new THREE.MeshStandardMaterial({ color: 0x2a2117, roughness: 1 }));
    const logs = new THREE.Mesh(new THREE.BoxGeometry(1.1, 0.16, 0.18), new THREE.MeshStandardMaterial({ color: 0x4b3522, roughness: 1 }));
    const logsTwo = logs.clone();
    logs.position.y = 0.18;
    logsTwo.position.y = 0.28;
    logsTwo.rotation.y = Math.PI / 2;

    const flame = new THREE.Mesh(new THREE.ConeGeometry(0.32, 0.9, 8), new THREE.MeshBasicMaterial({ color: 0xff8b2c, transparent: true, opacity: 0.72 }));
    flame.position.y = 0.72;
    group.add(base, logs, logsTwo, flame);

    const light = new THREE.PointLight(0xff8b3d, BALANCE.fire.lightIntensity, 18);
    light.position.set(0, 1.2, 0);
    group.add(light);

    const fire: Campfire = {
      id: `fire-${this.nextId++}`,
      group,
      light,
      burnTimeRemaining: BALANCE.fire.burnDurationSeconds,
      lit: true
    };
    this.fires.push(fire);
    this.scene.add(group);
    return fire.id;
  }

  update(delta: number) {
    for (const fire of this.fires) {
      if (!fire.lit) continue;
      fire.burnTimeRemaining = Math.max(0, fire.burnTimeRemaining - delta);
      if (fire.burnTimeRemaining <= 0) fire.lit = false;
      fire.light.visible = fire.lit;
      fire.light.intensity = fire.lit ? BALANCE.fire.lightIntensity * Math.min(1, fire.burnTimeRemaining / 12) : 0;
      const flame = fire.group.children.find((child) => child instanceof THREE.Mesh && child.position.y > 0.6);
      if (flame) flame.visible = fire.lit;
    }
  }

  warmthAt(position: THREE.Vector3) {
    let warmth = 0;
    for (const fire of this.fires) {
      if (!fire.lit) continue;
      const distance = fire.group.position.distanceTo(position);
      if (distance <= BALANCE.fire.warmthRadius) warmth += 1 - distance / BALANCE.fire.warmthRadius;
    }
    return Math.min(1, warmth);
  }

  toSaveData(): CampfireSaveData[] {
    return this.fires.map((fire) => ({
      id: fire.id,
      position: { x: fire.group.position.x, y: fire.group.position.y, z: fire.group.position.z },
      burnTimeRemaining: fire.burnTimeRemaining,
      lit: fire.lit
    }));
  }

  loadSaveData(data: CampfireSaveData[]) {
    for (const fire of this.fires) this.scene.remove(fire.group);
    this.fires = [];
    this.nextId = 1;
    for (const saved of data) {
      const id = this.place(new THREE.Vector3(saved.position.x, saved.position.y, saved.position.z));
      const fire = this.fires.find((entry) => entry.id === id);
      if (!fire) continue;
      fire.id = saved.id;
      fire.burnTimeRemaining = saved.burnTimeRemaining;
      fire.lit = saved.lit;
      const numeric = Number(saved.id.split('-')[1]);
      if (Number.isFinite(numeric)) this.nextId = Math.max(this.nextId, numeric + 1);
    }
  }
}
