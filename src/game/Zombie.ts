import * as THREE from 'three';
import { BALANCE } from './Balance';
import { ZombieModelFactory, type ZombieRig } from './ZombieModelFactory';
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

  private rig: ZombieRig;
  private attackCooldown = 0;
  private idleTimer = 1 + Math.random() * 3;
  private lostSightTimer = 0;
  private searchTimer = 0;
  private wanderTarget = new THREE.Vector3();
  private investigationTarget = new THREE.Vector3();
  private lastKnownPlayerPosition = new THREE.Vector3();
  private readonly spawnPoint = new THREE.Vector3();
  private animationClock = Math.random() * 10;
  private currentSpeed = 0;

  constructor(position: THREE.Vector3, private zoneType: ZoneType = 'road') {
    this.rig = ZombieModelFactory.create(zoneType);
    this.mesh = this.rig.root;
    this.mesh.position.copy(position);
    this.spawnPoint.copy(position);
    this.pickWanderTarget();
  }

  get alive() { return this.hp > 0; }

  damage(amount: number, sourcePosition?: THREE.Vector3) {
    this.hp -= amount;
    this.alerted = true;
    this.state = 'chasing';
    if (sourcePosition) this.lastKnownPlayerPosition.copy(sourcePosition);
    else this.lastKnownPlayerPosition.copy(this.mesh.position);
    if (this.hp <= 0) {
      this.mesh.visible = false;
      this.mesh.rotation.x = -Math.PI / 2;
    }
  }

  update(delta: number, context: ZombieUpdateContext) {
    if (!this.alive) return;
    this.currentSpeed = 0;
    this.animationClock += delta;
    this.attackCooldown = Math.max(0, this.attackCooldown - delta);
    const playerDistance = context.playerPosition.distanceTo(this.mesh.position);
    const canSeePlayer = this.canSeePlayer(playerDistance, context.isNight, context.weather);
    const canHearPlayer = context.noiseRadius > 0 && this.mesh.position.distanceTo(context.noiseOrigin) <= context.noiseRadius * BALANCE.zombie.hearingMultiplier;

    if (canSeePlayer) { this.alerted = true; this.state = 'chasing'; this.lostSightTimer = 0; this.lastKnownPlayerPosition.copy(context.playerPosition); }
    else if (canHearPlayer) { this.alerted = true; this.state = this.state === 'chasing' ? 'chasing' : 'investigating'; this.investigationTarget.copy(context.noiseOrigin); this.lastKnownPlayerPosition.copy(context.noiseOrigin); }
    else if (this.state === 'chasing') { this.lostSightTimer += delta; if (this.lostSightTimer > BALANCE.zombie.loseSightSeconds) { this.state = 'searching'; this.searchTimer = BALANCE.zombie.searchSeconds; } }

    if (this.state === 'idle') this.updateIdle(delta);
    if (this.state === 'wandering') this.updateWandering(delta);
    if (this.state === 'investigating') this.moveTowards(this.investigationTarget, BALANCE.zombie.investigateSpeed, delta, () => { this.state = 'searching'; this.searchTimer = BALANCE.zombie.searchSeconds; });
    if (this.state === 'searching') this.updateSearching(delta);
    if (this.state === 'chasing') this.moveTowards(this.lastKnownPlayerPosition, BALANCE.zombie.chaseSpeed + (context.isNight ? BALANCE.zombie.nightChaseSpeedBonus : 0), delta);

    if (playerDistance < BALANCE.zombie.attackRange && this.attackCooldown <= 0) {
      this.attackCooldown = BALANCE.zombie.attackCooldownSeconds;
      ZombieModelFactory.animate(this.rig, 'chasing', this.animationClock + 1, 2.5);
      context.onAttack(BALANCE.zombie.baseDamage, BALANCE.zombie.bleedChance);
    } else {
      ZombieModelFactory.animate(this.rig, this.state, this.animationClock, this.currentSpeed);
    }
  }

  private updateIdle(delta: number) { this.idleTimer -= delta; if (this.idleTimer <= 0) { this.state = 'wandering'; this.pickWanderTarget(); } }
  private updateWandering(delta: number) { this.moveTowards(this.wanderTarget, BALANCE.zombie.wanderSpeed, delta, () => { this.state = 'idle'; this.idleTimer = 1.5 + Math.random() * 4; }); }
  private updateSearching(delta: number) { this.searchTimer -= delta; const jitterTarget = this.lastKnownPlayerPosition.clone().add(new THREE.Vector3(Math.sin(performance.now() * 0.001) * 2.4, 0, Math.cos(performance.now() * 0.0013) * 2.4)); this.moveTowards(jitterTarget, 1.05, delta); if (this.searchTimer <= 0) { this.alerted = false; this.state = 'idle'; this.lostSightTimer = 0; this.idleTimer = 1 + Math.random() * 3; } }

  private moveTowards(target: THREE.Vector3, speed: number, delta: number, onArrive?: () => void) {
    const direction = target.clone().sub(this.mesh.position);
    direction.y = 0;
    const distance = direction.length();
    if (distance <= 0.3) { onArrive?.(); return; }
    direction.normalize();
    this.currentSpeed = speed;
    this.mesh.position.addScaledVector(direction, speed * delta);
    this.mesh.lookAt(target.x, this.mesh.position.y, target.z);
  }

  private canSeePlayer(distance: number, isNight: boolean, weather: WeatherType) {
    if (distance < 3) return true;
    const weatherModifier = weather === 'fog' ? 0.48 : weather === 'rain' ? 0.72 : weather === 'cloudy' ? 0.9 : 1;
    const baseRange = isNight ? BALANCE.zombie.nightSightRange : BALANCE.zombie.daySightRange;
    return distance <= (baseRange + (this.alerted ? BALANCE.zombie.alertedSightBonus : 0)) * weatherModifier;
  }

  private pickWanderTarget() {
    const angle = Math.random() * Math.PI * 2;
    const radius = 5 + Math.random() * (this.zoneType === 'forest' ? 24 : 16);
    this.wanderTarget.set(this.spawnPoint.x + Math.cos(angle) * radius, 0, this.spawnPoint.z + Math.sin(angle) * radius);
  }
}
