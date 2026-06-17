import * as THREE from 'three';
import { BALANCE } from './Balance';
import type { ZoneType, WeatherType } from './types';

type ZombieState = 'idle' | 'wandering' | 'investigating' | 'chasing' | 'searching';

interface ZombieUpdateContext {
  playerPosition: THREE.Vector3;
  noiseOrigin: THREE.Vector3;
  noiseRadius: number;
  isNight: boolean;
  weather: WeatherType;
  onAttack: (damage: number, bleedChance: number) => void;
}

export class Zombie {
  public mesh: THREE.Group;
  public hp = 76;
  public alerted = false;
  public state: ZombieState = 'idle';

  private attackCooldown = 0;
  private idleTimer = 1 + Math.random() * 3;
  private lostSightTimer = 0;
  private searchTimer = 0;
  private wanderTarget = new THREE.Vector3();
  private investigationTarget = new THREE.Vector3();
  private lastKnownPlayerPosition = new THREE.Vector3();
  private readonly spawnPoint = new THREE.Vector3();

  constructor(position: THREE.Vector3, private zoneType: ZoneType = 'road') {
    this.mesh = new THREE.Group();
    const body = new THREE.Mesh(
      new THREE.CapsuleGeometry(0.35, 1.1, 4, 8),
      new THREE.MeshStandardMaterial({ color: this.colorForZone(), roughness: 1 })
    );
    body.position.y = 0.95;
    const head = new THREE.Mesh(
      new THREE.SphereGeometry(0.25, 10, 8),
      new THREE.MeshStandardMaterial({ color: 0x6f7568, roughness: 1 })
    );
    head.position.y = 1.75;
    this.mesh.add(body, head);
    this.mesh.position.copy(position);
    this.spawnPoint.copy(position);
    this.pickWanderTarget();
  }

  get alive() {
    return this.hp > 0;
  }

  damage(amount: number, sourcePosition?: THREE.Vector3) {
    this.hp -= amount;
    this.alerted = true;
    this.state = 'chasing';
    if (sourcePosition) this.lastKnownPlayerPosition.copy(sourcePosition);
    else this.lastKnownPlayerPosition.copy(this.mesh.position);
    if (this.hp <= 0) this.mesh.visible = false;
  }

  update(delta: number, context: ZombieUpdateContext) {
    if (!this.alive) return;

    this.attackCooldown = Math.max(0, this.attackCooldown - delta);
    const playerDistance = context.playerPosition.distanceTo(this.mesh.position);
    const canSeePlayer = this.canSeePlayer(playerDistance, context.isNight, context.weather);
    const canHearPlayer = context.noiseRadius > 0 && this.mesh.position.distanceTo(context.noiseOrigin) <= context.noiseRadius * BALANCE.zombie.hearingMultiplier;

    if (canSeePlayer) {
      this.alerted = true;
      this.state = 'chasing';
      this.lostSightTimer = 0;
      this.lastKnownPlayerPosition.copy(context.playerPosition);
    } else if (canHearPlayer) {
      this.alerted = true;
      this.state = this.state === 'chasing' ? 'chasing' : 'investigating';
      this.investigationTarget.copy(context.noiseOrigin);
      this.lastKnownPlayerPosition.copy(context.noiseOrigin);
    } else if (this.state === 'chasing') {
      this.lostSightTimer += delta;
      if (this.lostSightTimer > BALANCE.zombie.loseSightSeconds) {
        this.state = 'searching';
        this.searchTimer = BALANCE.zombie.searchSeconds;
      }
    }

    if (this.state === 'idle') this.updateIdle(delta);
    if (this.state === 'wandering') this.updateWandering(delta);
    if (this.state === 'investigating') this.moveTowards(this.investigationTarget, BALANCE.zombie.investigateSpeed, delta, () => {
      this.state = 'searching';
      this.searchTimer = BALANCE.zombie.searchSeconds;
    });
    if (this.state === 'searching') this.updateSearching(delta);
    if (this.state === 'chasing') {
      const nightBonus = context.isNight ? BALANCE.zombie.nightChaseSpeedBonus : 0;
      this.moveTowards(this.lastKnownPlayerPosition, BALANCE.zombie.chaseSpeed + nightBonus, delta);
    }

    if (playerDistance < BALANCE.zombie.attackRange && this.attackCooldown <= 0) {
      this.attackCooldown = BALANCE.zombie.attackCooldownSeconds;
      context.onAttack(BALANCE.zombie.baseDamage, BALANCE.zombie.bleedChance);
    }
  }

  private updateIdle(delta: number) {
    this.idleTimer -= delta;
    if (this.idleTimer <= 0) {
      this.state = 'wandering';
      this.pickWanderTarget();
    }
  }

  private updateWandering(delta: number) {
    this.moveTowards(this.wanderTarget, BALANCE.zombie.wanderSpeed, delta, () => {
      this.state = 'idle';
      this.idleTimer = 1.5 + Math.random() * 4;
    });
  }

  private updateSearching(delta: number) {
    this.searchTimer -= delta;
    const jitterTarget = this.lastKnownPlayerPosition.clone().add(new THREE.Vector3(Math.sin(performance.now() * 0.001) * 2.4, 0, Math.cos(performance.now() * 0.0013) * 2.4));
    this.moveTowards(jitterTarget, 1.05, delta);
    if (this.searchTimer <= 0) {
      this.alerted = false;
      this.state = 'idle';
      this.lostSightTimer = 0;
      this.idleTimer = 1 + Math.random() * 3;
    }
  }

  private moveTowards(target: THREE.Vector3, speed: number, delta: number, onArrive?: () => void) {
    const direction = target.clone().sub(this.mesh.position);
    direction.y = 0;
    const distance = direction.length();
    if (distance <= 0.3) {
      onArrive?.();
      return;
    }

    direction.normalize();
    this.mesh.position.addScaledVector(direction, speed * delta);
    this.mesh.lookAt(target.x, this.mesh.position.y, target.z);
  }

  private canSeePlayer(distance: number, isNight: boolean, weather: WeatherType) {
    if (distance < 3) return true;
    const weatherModifier = weather === 'fog' ? 0.48 : weather === 'rain' ? 0.72 : weather === 'cloudy' ? 0.9 : 1;
    const baseRange = isNight ? BALANCE.zombie.nightSightRange : BALANCE.zombie.daySightRange;
    const alertedBonus = this.alerted ? BALANCE.zombie.alertedSightBonus : 0;
    return distance <= (baseRange + alertedBonus) * weatherModifier;
  }

  private pickWanderTarget() {
    const angle = Math.random() * Math.PI * 2;
    const radius = 5 + Math.random() * (this.zoneType === 'forest' ? 24 : 16);
    this.wanderTarget.set(
      this.spawnPoint.x + Math.cos(angle) * radius,
      0,
      this.spawnPoint.z + Math.sin(angle) * radius
    );
  }

  private colorForZone() {
    if (this.zoneType === 'military') return 0x4b5a48;
    if (this.zoneType === 'hospital') return 0x6b706a;
    if (this.zoneType === 'forest') return 0x44573e;
    return 0x556052;
  }
}
