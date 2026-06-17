import * as THREE from 'three';
import { Zombie } from './Zombie';
import type { SpawnZoneDefinition } from './types';

export class ZombieSpawner {
  constructor(private scene: THREE.Scene, private zombies: Zombie[], private spawnZones: SpawnZoneDefinition[]) {}

  spawnInitial(playerPosition: THREE.Vector3) {
    for (const zone of this.spawnZones) {
      let spawned = 0;
      let attempts = 0;
      while (spawned < zone.maxZombies && attempts < zone.maxZombies * 8) {
        attempts += 1;
        if (Math.random() > zone.spawnChance) continue;
        const position = this.randomPointInZone(zone);
        if (position.distanceTo(playerPosition) < 26) continue;
        const zombie = new Zombie(position, zone.type);
        this.zombies.push(zombie);
        this.scene.add(zombie.mesh);
        spawned += 1;
      }
    }
  }

  private randomPointInZone(zone: SpawnZoneDefinition) {
    const angle = Math.random() * Math.PI * 2;
    const radius = Math.sqrt(Math.random()) * zone.radius;
    return new THREE.Vector3(zone.position.x + Math.cos(angle) * radius, 0, zone.position.z + Math.sin(angle) * radius);
  }
}
