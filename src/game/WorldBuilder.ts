import * as THREE from 'three';
import { BALANCE } from './Balance';
import { BUILDING_LOOT, ITEMS } from './data';
import { LootSystem } from './LootSystem';
import { WorldObjectFactory } from './WorldObjectFactory';
import type { BuildingType, LootSpotDefinition, SpawnedLoot, SpawnZoneDefinition, VehicleKind, ZoneType } from './types';

export interface WorldLootSpot { id: string; mesh: THREE.Mesh; definition: LootSpotDefinition; spawnedLoot: SpawnedLoot | null; taken: boolean; respawnAt: number | null; buildingType: BuildingType; }
export interface WorldBuildResult { lootSpots: WorldLootSpot[]; spawnZones: SpawnZoneDefinition[]; ambient: THREE.HemisphereLight; sun: THREE.DirectionalLight; }
interface BuildingPlan { id: string; type: BuildingType; zone: ZoneType; x: number; z: number; width: number; depth: number; color: number; yaw?: number; floors?: number; }

export class WorldBuilder {
  private lootSpots: WorldLootSpot[] = [];
  private spawnZones: SpawnZoneDefinition[] = [];
  constructor(private scene: THREE.Scene, private loot: LootSystem) {}

  build(): WorldBuildResult {
    const ambient = new THREE.HemisphereLight(0xaab0a0, 0x0b0f0b, 1.2);
    const sun = new THREE.DirectionalLight(0xf1e6c8, 1.35);
    sun.position.set(32, 55, 18);
    this.scene.add(ambient, sun);
    this.addGround(); this.addRoads(); this.addFields(); this.addSettlement(); this.addServiceArea(); this.addClinicAndPolice(); this.addMilitaryCheckpoint(); this.addForest(); this.addFences(); this.addVehicles(); this.addWorldProps(); this.addSpawnZones();
    return { lootSpots: this.lootSpots, spawnZones: this.spawnZones, ambient, sun };
  }

  private addGround() { const ground = new THREE.Mesh(new THREE.PlaneGeometry(BALANCE.world.halfSize * 2, BALANCE.world.halfSize * 2), new THREE.MeshStandardMaterial({ color: 0x2d332b, roughness: 1 })); ground.rotation.x = -Math.PI / 2; this.scene.add(ground); }
  private addRoads() { this.addRoad(0, 0, 330, 9, 0); this.addRoad(-45, -12, 8, 125, 0); this.addRoad(60, 36, 8, 130, 0); this.addRoad(5, 55, 145, 7, 0); this.addRoad(104, -20, 7, 88, 0); }
  private addRoad(x: number, z: number, width: number, depth: number, yaw: number) { const road = new THREE.Mesh(new THREE.BoxGeometry(width, 0.04, depth), new THREE.MeshStandardMaterial({ color: 0x242522, roughness: 0.95 })); road.position.set(x, 0.025, z); road.rotation.y = yaw; this.scene.add(road); }
  private addFields() { const fieldMaterial = new THREE.MeshStandardMaterial({ color: 0x39402e, roughness: 1 }); const fieldOne = new THREE.Mesh(new THREE.BoxGeometry(52, 0.035, 72), fieldMaterial); fieldOne.position.set(-105, 0.03, -82); const fieldTwo = new THREE.Mesh(new THREE.BoxGeometry(70, 0.035, 54), fieldMaterial.clone()); fieldTwo.position.set(112, 0.03, 88); this.scene.add(fieldOne, fieldTwo); }

  private addSettlement() {
    const houses: BuildingPlan[] = [
      { id: 'house-01', type: 'house', zone: 'residential', x: -78, z: -32, width: 10, depth: 8, color: 0x4a453a }, { id: 'house-02', type: 'house', zone: 'residential', x: -58, z: -52, width: 9, depth: 8, color: 0x3f4239 }, { id: 'house-03', type: 'house', zone: 'residential', x: -34, z: -34, width: 10, depth: 9, color: 0x514938 },
      { id: 'house-04', type: 'house', zone: 'residential', x: -84, z: 28, width: 9, depth: 8, color: 0x45483e }, { id: 'house-05', type: 'house', zone: 'residential', x: -58, z: 38, width: 10, depth: 8, color: 0x4e463b }, { id: 'house-06', type: 'house', zone: 'residential', x: -28, z: 28, width: 9, depth: 8, color: 0x3d443d },
      { id: 'block-01', type: 'house', zone: 'residential', x: -112, z: -8, width: 15, depth: 12, color: 0x45473f, floors: 4 }
    ];
    houses.forEach((plan) => this.addBuilding(plan));
  }
  private addServiceArea() { this.addBuilding({ id: 'market-01', type: 'market', zone: 'market', x: 18, z: -42, width: 19, depth: 13, color: 0x56513f }); this.addBuilding({ id: 'workshop-01', type: 'workshop', zone: 'industrial', x: 62, z: -54, width: 18, depth: 14, color: 0x534734 }); this.addBuilding({ id: 'warehouse-01', type: 'workshop', zone: 'industrial', x: 88, z: -74, width: 24, depth: 15, color: 0x4b493f }); }
  private addClinicAndPolice() { this.addBuilding({ id: 'police-01', type: 'police', zone: 'police', x: 34, z: 34, width: 15, depth: 12, color: 0x334657 }); this.addBuilding({ id: 'clinic-01', type: 'hospital', zone: 'hospital', x: -8, z: 72, width: 20, depth: 14, color: 0x575f5d }); }
  private addMilitaryCheckpoint() { this.addBuilding({ id: 'checkpoint-01', type: 'military', zone: 'military', x: 118, z: 18, width: 16, depth: 10, color: 0x31432e }); this.addBuilding({ id: 'checkpoint-02', type: 'military', zone: 'military', x: 140, z: 18, width: 12, depth: 8, color: 0x263826 }); this.addBarrier(104, 8, 36, 0); this.addBarrier(138, 31, 42, Math.PI / 2); this.addBarrier(138, 3, 42, Math.PI / 2); }

  private addBuilding(plan: BuildingPlan) {
    const group = WorldObjectFactory.createBuilding(plan.type, plan.width, plan.depth, plan.color, plan.floors ?? 1);
    group.position.set(plan.x, 0, plan.z); group.rotation.y = plan.yaw ?? 0; this.scene.add(group);
    const innerBlock = new THREE.Mesh(new THREE.BoxGeometry(Math.max(2, plan.width * 0.35), 1.8, 0.22), new THREE.MeshStandardMaterial({ color: 0x111411, roughness: 1 }));
    innerBlock.position.set(plan.x - plan.width * 0.18, 0.95, plan.z - plan.depth * 0.1); innerBlock.rotation.y = group.rotation.y; this.scene.add(innerBlock);
    this.addLootSpots(plan);
  }
  private addLootSpots(plan: BuildingPlan) {
    const definitions = BUILDING_LOOT[plan.type]; const columns = Math.min(3, definitions.length);
    definitions.forEach((definition, index) => { const spawnedLoot = this.loot.spawn(definition); const spot = WorldObjectFactory.createLootSpot(definition.label, this.colorForLoot(spawnedLoot?.itemId)); const offsetX = -plan.width / 2 + 1.4 + (index % columns) * 2.25; const offsetZ = -plan.depth / 2 + 1.25 + Math.floor(index / columns) * 2.15; spot.position.set(plan.x + offsetX, 0.16, plan.z + offsetZ); spot.visible = Boolean(spawnedLoot); spot.userData.label = definition.label; this.scene.add(spot); this.lootSpots.push({ id: `${plan.id}-loot-${index}`, mesh: spot, definition, spawnedLoot, taken: false, respawnAt: null, buildingType: plan.type }); });
    if ((plan.floors ?? 1) > 1) {
      const extra: LootSpotDefinition[] = [{ pool: 'residential_common', chance: 0.42, label: 'Wohnblock Küche EG' }, { pool: 'hospital_medical', chance: 0.12, label: 'Wohnblock Bad 1.OG' }, { pool: 'residential_rare', chance: 0.22, label: 'Wohnblock Schlafzimmer 2.OG' }, { pool: 'residential_common', chance: 0.34, label: 'Wohnblock Flur 3.OG' }];
      extra.forEach((definition, index) => { const spawnedLoot = this.loot.spawn(definition); const spot = WorldObjectFactory.createLootSpot(definition.label, this.colorForLoot(spawnedLoot?.itemId)); spot.position.set(plan.x + 3.7, 0.18 + index * 0.02, plan.z - 3.5 + index * 1.9); spot.visible = Boolean(spawnedLoot); this.scene.add(spot); this.lootSpots.push({ id: `${plan.id}-floor-loot-${index}`, mesh: spot, definition, spawnedLoot, taken: false, respawnAt: null, buildingType: plan.type }); });
    }
  }
  private colorForLoot(itemId?: string) { if (!itemId) return 0x2f332d; const item = ITEMS[itemId]; if (!item) return 0xb7a66f; if (item.type === 'food' || item.type === 'drink') return 0xc0aa6d; if (item.type === 'medical') return 0xd6d8d4; if (item.type === 'ammo' || item.type === 'ranged_weapon') return 0x8a7d5b; if (item.type === 'armor' || item.type === 'clothing') return 0x6f7780; if (item.type === 'backpack') return 0x6c5b3e; return 0x9c8b65; }

  private addForest() { for (let i = 0; i < BALANCE.world.treeCount; i += 1) { const side = Math.random() > 0.45 ? 1 : -1; const x = side > 0 ? 35 + Math.random() * 125 : -155 + Math.random() * 60; const z = -150 + Math.random() * 300; if (Math.abs(z) < 9 && x > -20 && x < 120) continue; this.addTree(x, z); } }
  private addTree(x: number, z: number) { const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.26, 2.4, 6), new THREE.MeshStandardMaterial({ color: 0x3c2d20, roughness: 1 })); trunk.position.set(x, 1.2, z); const crown = new THREE.Mesh(new THREE.ConeGeometry(1.35, 3.4, 8), new THREE.MeshStandardMaterial({ color: 0x1f3b27, roughness: 1 })); crown.position.set(x, 3.2, z); this.scene.add(trunk, crown); }
  private addFences() { this.addFenceLine(-96, -68, 78, true); this.addFenceLine(-96, 58, 78, true); this.addFenceLine(100, -92, 66, false); this.addFenceLine(154, -8, 55, false); }
  private addFenceLine(x: number, z: number, length: number, horizontal: boolean) { const segmentCount = Math.floor(length / BALANCE.world.fenceSegmentLength); for (let i = 0; i < segmentCount; i += 1) { const segment = new THREE.Mesh(new THREE.BoxGeometry(horizontal ? 5.8 : 0.25, 1.35, horizontal ? 0.25 : 5.8), new THREE.MeshStandardMaterial({ color: 0x3b3328, roughness: 1 })); segment.position.set(x + (horizontal ? i * 7 : 0), 0.68, z + (horizontal ? 0 : i * 7)); this.scene.add(segment); } }
  private addVehicles() { const positions: Array<[number, number, VehicleKind, number]> = [[-18, 5, 'car', Math.PI / 2], [24, 6, 'police_car', 0], [44, -10, 'ambulance', Math.PI / 2], [-70, 8, 'car', 0], [95, -18, 'van', Math.PI / 2], [118, 40, 'military_truck', 0], [14, -70, 'car', Math.PI / 2], [-45, -6, 'car', 0], [63, 56, 'van', Math.PI / 2], [-15, 95, 'ambulance', 0]]; positions.forEach(([x, z, kind, yaw]) => this.addVehicle(x, z, yaw, kind)); }
  private addVehicle(x: number, z: number, yaw: number, kind: VehicleKind) { const group = WorldObjectFactory.createVehicle(kind); group.position.set(x, 0, z); group.rotation.y = yaw; this.scene.add(group); }
  private addWorldProps() { const props: Array<[Parameters<typeof WorldObjectFactory.createProp>[0], number, number, number?]> = [['lamp', -18, 12], ['lamp', 30, 12], ['lamp', 60, -18], ['sign', -90, -20], ['bench', -63, -18], ['trashbag', 17, -36], ['barrel', 72, -52], ['pallet', 66, -58], ['barrel', 126, 14], ['pallet', 132, 22], ['sign', 105, -6], ['trashbag', -52, 34]]; props.forEach(([kind, x, z, yaw = 0]) => { const group = WorldObjectFactory.createProp(kind); group.position.set(x, 0, z); group.rotation.y = yaw; this.scene.add(group); }); }
  private addBarrier(x: number, z: number, length: number, yaw: number) { const barrier = WorldObjectFactory.createProp('barrier', length); barrier.position.set(x, 0, z); barrier.rotation.y = yaw; this.scene.add(barrier); }
  private addSpawnZones() { this.spawnZones.push({ id: 'zone-residential-west', type: 'residential', position: { x: -62, z: -8 }, radius: 60, maxZombies: 8, spawnChance: 0.9 }, { id: 'zone-market', type: 'market', position: { x: 18, z: -42 }, radius: 30, maxZombies: 6, spawnChance: 0.9 }, { id: 'zone-police', type: 'police', position: { x: 34, z: 34 }, radius: 30, maxZombies: 6, spawnChance: 0.86 }, { id: 'zone-hospital', type: 'hospital', position: { x: -8, z: 72 }, radius: 34, maxZombies: 8, spawnChance: 0.92 }, { id: 'zone-industrial', type: 'industrial', position: { x: 72, z: -62 }, radius: 42, maxZombies: 7, spawnChance: 0.86 }, { id: 'zone-military', type: 'military', position: { x: 128, z: 18 }, radius: 38, maxZombies: 12, spawnChance: 0.96 }, { id: 'zone-forest-east', type: 'forest', position: { x: 115, z: 118 }, radius: 58, maxZombies: 4, spawnChance: 0.42 }, { id: 'zone-road-main', type: 'road', position: { x: 18, z: 0 }, radius: 130, maxZombies: 8, spawnChance: 0.55 }); }
}
