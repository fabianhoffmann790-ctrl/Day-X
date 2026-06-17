import * as THREE from 'three';
import { BALANCE } from './Balance';
import { BUILDING_LOOT, ITEMS } from './data';
import { LootSystem } from './LootSystem';
import type { BuildingType, LootSpotDefinition, SpawnedLoot, SpawnZoneDefinition, ZoneType } from './types';

export interface WorldLootSpot {
  id: string;
  mesh: THREE.Mesh;
  definition: LootSpotDefinition;
  spawnedLoot: SpawnedLoot | null;
  taken: boolean;
  respawnAt: number | null;
  buildingType: BuildingType;
}

export interface WorldBuildResult {
  lootSpots: WorldLootSpot[];
  spawnZones: SpawnZoneDefinition[];
  ambient: THREE.HemisphereLight;
  sun: THREE.DirectionalLight;
}

interface BuildingPlan {
  id: string;
  type: BuildingType;
  zone: ZoneType;
  x: number;
  z: number;
  width: number;
  depth: number;
  color: number;
  yaw?: number;
}

export class WorldBuilder {
  private lootSpots: WorldLootSpot[] = [];
  private spawnZones: SpawnZoneDefinition[] = [];

  constructor(private scene: THREE.Scene, private loot: LootSystem) {}

  build(): WorldBuildResult {
    const ambient = new THREE.HemisphereLight(0xaab0a0, 0x0b0f0b, 1.2);
    const sun = new THREE.DirectionalLight(0xf1e6c8, 1.35);
    sun.position.set(32, 55, 18);
    this.scene.add(ambient, sun);

    this.addGround();
    this.addRoads();
    this.addFields();
    this.addSettlement();
    this.addServiceArea();
    this.addClinicAndPolice();
    this.addMilitaryCheckpoint();
    this.addForest();
    this.addFences();
    this.addVehicles();
    this.addSpawnZones();

    return { lootSpots: this.lootSpots, spawnZones: this.spawnZones, ambient, sun };
  }

  private addGround() {
    const ground = new THREE.Mesh(
      new THREE.PlaneGeometry(BALANCE.world.halfSize * 2, BALANCE.world.halfSize * 2),
      new THREE.MeshStandardMaterial({ color: 0x2d332b, roughness: 1 })
    );
    ground.rotation.x = -Math.PI / 2;
    this.scene.add(ground);
  }

  private addRoads() {
    this.addRoad(0, 0, 330, 9, 0);
    this.addRoad(-45, -12, 8, 125, 0);
    this.addRoad(60, 36, 8, 130, 0);
    this.addRoad(5, 55, 145, 7, 0);
    this.addRoad(104, -20, 7, 88, 0);
  }

  private addRoad(x: number, z: number, width: number, depth: number, yaw: number) {
    const road = new THREE.Mesh(
      new THREE.BoxGeometry(width, 0.04, depth),
      new THREE.MeshStandardMaterial({ color: 0x242522, roughness: 0.95 })
    );
    road.position.set(x, 0.025, z);
    road.rotation.y = yaw;
    this.scene.add(road);
  }

  private addFields() {
    const fieldMaterial = new THREE.MeshStandardMaterial({ color: 0x39402e, roughness: 1 });
    const fieldOne = new THREE.Mesh(new THREE.BoxGeometry(52, 0.035, 72), fieldMaterial);
    fieldOne.position.set(-105, 0.03, -82);
    const fieldTwo = new THREE.Mesh(new THREE.BoxGeometry(70, 0.035, 54), fieldMaterial.clone());
    fieldTwo.position.set(112, 0.03, 88);
    this.scene.add(fieldOne, fieldTwo);
  }

  private addSettlement() {
    const houses: BuildingPlan[] = [
      { id: 'house-01', type: 'house', zone: 'residential', x: -78, z: -32, width: 10, depth: 8, color: 0x4a453a },
      { id: 'house-02', type: 'house', zone: 'residential', x: -58, z: -52, width: 9, depth: 8, color: 0x3f4239 },
      { id: 'house-03', type: 'house', zone: 'residential', x: -34, z: -34, width: 10, depth: 9, color: 0x514938 },
      { id: 'house-04', type: 'house', zone: 'residential', x: -84, z: 28, width: 9, depth: 8, color: 0x45483e },
      { id: 'house-05', type: 'house', zone: 'residential', x: -58, z: 38, width: 10, depth: 8, color: 0x4e463b },
      { id: 'house-06', type: 'house', zone: 'residential', x: -28, z: 28, width: 9, depth: 8, color: 0x3d443d }
    ];
    houses.forEach((plan) => this.addBuilding(plan));
  }

  private addServiceArea() {
    this.addBuilding({ id: 'market-01', type: 'market', zone: 'market', x: 18, z: -42, width: 19, depth: 13, color: 0x56513f });
    this.addBuilding({ id: 'workshop-01', type: 'workshop', zone: 'industrial', x: 62, z: -54, width: 18, depth: 14, color: 0x534734 });
    this.addBuilding({ id: 'warehouse-01', type: 'workshop', zone: 'industrial', x: 88, z: -74, width: 24, depth: 15, color: 0x4b493f });
  }

  private addClinicAndPolice() {
    this.addBuilding({ id: 'police-01', type: 'police', zone: 'police', x: 34, z: 34, width: 15, depth: 12, color: 0x334657 });
    this.addBuilding({ id: 'clinic-01', type: 'hospital', zone: 'hospital', x: -8, z: 72, width: 20, depth: 14, color: 0x575f5d });
  }

  private addMilitaryCheckpoint() {
    this.addBuilding({ id: 'checkpoint-01', type: 'military', zone: 'military', x: 118, z: 18, width: 16, depth: 10, color: 0x31432e });
    this.addBuilding({ id: 'checkpoint-02', type: 'military', zone: 'military', x: 140, z: 18, width: 12, depth: 8, color: 0x263826 });
    this.addBarrier(104, 8, 36, 0);
    this.addBarrier(138, 31, 42, Math.PI / 2);
    this.addBarrier(138, 3, 42, Math.PI / 2);
  }

  private addBuilding(plan: BuildingPlan) {
    const height = plan.type === 'military' || plan.type === 'workshop' ? 4.8 : 3.5;
    const shellMaterial = new THREE.MeshStandardMaterial({ color: plan.color, roughness: 0.92, transparent: true, opacity: 0.58 });
    const shell = new THREE.Mesh(new THREE.BoxGeometry(plan.width, height, plan.depth), shellMaterial);
    shell.position.set(plan.x, height / 2, plan.z);
    shell.rotation.y = plan.yaw ?? 0;
    this.scene.add(shell);

    const floor = new THREE.Mesh(new THREE.BoxGeometry(plan.width - 0.7, 0.06, plan.depth - 0.7), new THREE.MeshStandardMaterial({ color: 0x1d211d, roughness: 1 }));
    floor.position.set(plan.x, 0.055, plan.z);
    floor.rotation.y = shell.rotation.y;
    this.scene.add(floor);

    const doorway = new THREE.Mesh(new THREE.BoxGeometry(2.2, 2.3, 0.09), new THREE.MeshBasicMaterial({ color: 0x050606 }));
    doorway.position.set(plan.x, 1.16, plan.z + plan.depth / 2 + 0.055);
    doorway.rotation.y = shell.rotation.y;
    this.scene.add(doorway);

    const innerBlock = new THREE.Mesh(new THREE.BoxGeometry(Math.max(2, plan.width * 0.35), 1.8, 0.22), new THREE.MeshStandardMaterial({ color: 0x111411, roughness: 1 }));
    innerBlock.position.set(plan.x - plan.width * 0.18, 0.95, plan.z - plan.depth * 0.1);
    innerBlock.rotation.y = shell.rotation.y;
    this.scene.add(innerBlock);

    this.addLootSpots(plan);
  }

  private addLootSpots(plan: BuildingPlan) {
    const definitions = BUILDING_LOOT[plan.type];
    const columns = Math.min(3, definitions.length);

    definitions.forEach((definition, index) => {
      const spawnedLoot = this.loot.spawn(definition);
      const spot = new THREE.Mesh(
        new THREE.BoxGeometry(0.72, 0.28, 0.72),
        new THREE.MeshStandardMaterial({ color: this.colorForLoot(spawnedLoot?.itemId), roughness: 0.7 })
      );
      const offsetX = -plan.width / 2 + 1.4 + (index % columns) * 2.25;
      const offsetZ = -plan.depth / 2 + 1.25 + Math.floor(index / columns) * 2.15;
      spot.position.set(plan.x + offsetX, 0.16, plan.z + offsetZ);
      spot.visible = Boolean(spawnedLoot);
      spot.userData.label = definition.label;
      this.scene.add(spot);
      this.lootSpots.push({
        id: `${plan.id}-loot-${index}`,
        mesh: spot,
        definition,
        spawnedLoot,
        taken: false,
        respawnAt: null,
        buildingType: plan.type
      });
    });
  }

  private colorForLoot(itemId?: string) {
    if (!itemId) return 0x2f332d;
    const item = ITEMS[itemId];
    if (!item) return 0xb7a66f;
    if (item.type === 'food' || item.type === 'drink') return 0xc0aa6d;
    if (item.type === 'medical') return 0xd6d8d4;
    if (item.type === 'ammo' || item.type === 'ranged_weapon') return 0x8a7d5b;
    if (item.type === 'armor' || item.type === 'clothing') return 0x6f7780;
    if (item.type === 'backpack') return 0x6c5b3e;
    return 0x9c8b65;
  }

  private addForest() {
    for (let i = 0; i < BALANCE.world.treeCount; i += 1) {
      const side = Math.random() > 0.45 ? 1 : -1;
      const x = side > 0 ? 35 + Math.random() * 125 : -155 + Math.random() * 60;
      const z = -150 + Math.random() * 300;
      if (Math.abs(z) < 9 && x > -20 && x < 120) continue;
      this.addTree(x, z);
    }
  }

  private addTree(x: number, z: number) {
    const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.26, 2.4, 6), new THREE.MeshStandardMaterial({ color: 0x3c2d20, roughness: 1 }));
    trunk.position.set(x, 1.2, z);
    const crown = new THREE.Mesh(new THREE.ConeGeometry(1.35, 3.4, 8), new THREE.MeshStandardMaterial({ color: 0x1f3b27, roughness: 1 }));
    crown.position.set(x, 3.2, z);
    this.scene.add(trunk, crown);
  }

  private addFences() {
    this.addFenceLine(-96, -68, 78, true);
    this.addFenceLine(-96, 58, 78, true);
    this.addFenceLine(100, -92, 66, false);
    this.addFenceLine(154, -8, 55, false);
  }

  private addFenceLine(x: number, z: number, length: number, horizontal: boolean) {
    const segmentCount = Math.floor(length / BALANCE.world.fenceSegmentLength);
    for (let i = 0; i < segmentCount; i += 1) {
      const segment = new THREE.Mesh(new THREE.BoxGeometry(horizontal ? 5.8 : 0.25, 1.35, horizontal ? 0.25 : 5.8), new THREE.MeshStandardMaterial({ color: 0x3b3328, roughness: 1 }));
      segment.position.set(x + (horizontal ? i * 7 : 0), 0.68, z + (horizontal ? 0 : i * 7));
      this.scene.add(segment);
    }
  }

  private addVehicles() {
    const positions = [
      [-18, 5], [24, 6], [44, -10], [-70, 8], [95, -18], [118, 40], [14, -70], [-45, -6], [63, 56], [-15, 95]
    ];
    positions.forEach(([x, z], index) => this.addVehicle(x, z, index % 2 === 0 ? Math.PI / 2 : 0));
  }

  private addVehicle(x: number, z: number, yaw: number) {
    const body = new THREE.Mesh(new THREE.BoxGeometry(3.6, 1.1, 1.8), new THREE.MeshStandardMaterial({ color: 0x303533, roughness: 0.95 }));
    body.position.set(x, 0.62, z);
    body.rotation.y = yaw;
    const cabin = new THREE.Mesh(new THREE.BoxGeometry(1.6, 0.8, 1.55), new THREE.MeshStandardMaterial({ color: 0x1d2324, roughness: 1 }));
    cabin.position.set(x - Math.cos(yaw) * 0.35, 1.28, z + Math.sin(yaw) * 0.35);
    cabin.rotation.y = yaw;
    this.scene.add(body, cabin);
  }

  private addBarrier(x: number, z: number, length: number, yaw: number) {
    const barrier = new THREE.Mesh(new THREE.BoxGeometry(length, 1.1, 0.6), new THREE.MeshStandardMaterial({ color: 0x4a4636, roughness: 0.9 }));
    barrier.position.set(x, 0.55, z);
    barrier.rotation.y = yaw;
    this.scene.add(barrier);
  }

  private addSpawnZones() {
    this.spawnZones.push(
      { id: 'zone-residential-west', type: 'residential', position: { x: -62, z: -8 }, radius: 52, maxZombies: 7, spawnChance: 0.9 },
      { id: 'zone-market', type: 'market', position: { x: 18, z: -42 }, radius: 30, maxZombies: 6, spawnChance: 0.9 },
      { id: 'zone-police', type: 'police', position: { x: 34, z: 34 }, radius: 30, maxZombies: 6, spawnChance: 0.86 },
      { id: 'zone-hospital', type: 'hospital', position: { x: -8, z: 72 }, radius: 34, maxZombies: 8, spawnChance: 0.92 },
      { id: 'zone-industrial', type: 'industrial', position: { x: 72, z: -62 }, radius: 42, maxZombies: 7, spawnChance: 0.86 },
      { id: 'zone-military', type: 'military', position: { x: 128, z: 18 }, radius: 38, maxZombies: 12, spawnChance: 0.96 },
      { id: 'zone-forest-east', type: 'forest', position: { x: 115, z: 118 }, radius: 58, maxZombies: 4, spawnChance: 0.42 },
      { id: 'zone-road-main', type: 'road', position: { x: 18, z: 0 }, radius: 130, maxZombies: 8, spawnChance: 0.55 }
    );
  }
}
