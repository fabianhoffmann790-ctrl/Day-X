import * as THREE from 'three';

type ZombieState = 'wandering' | 'investigating' | 'chasing' | 'searching';

interface ZombieUpdateContext {
  playerPosition: THREE.Vector3;
  noiseOrigin: THREE.Vector3;
  noiseRadius: number;
  onAttack: (damage: number, bleedChance: number) => void;
}

export class Zombie {
  public mesh: THREE.Group;
  public hp = 76;
  public alerted = false;
  public state: ZombieState = 'wandering';

  private attackCooldown = 0;
  private lostSightTimer = 0;
  private searchTimer = 0;
  private wanderTarget = new THREE.Vector3();
  private investigationTarget = new THREE.Vector3();
  private lastKnownPlayerPosition = new THREE.Vector3();
  private readonly spawnPoint = new THREE.Vector3();

  constructor(position: THREE.Vector3) {
    this.mesh = new THREE.Group();
    const body = new THREE.Mesh(
      new THREE.CapsuleGeometry(0.35, 1.1, 4, 8),
      new THREE.MeshStandardMaterial({ color: 0x556052, roughness: 1 })
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

  damage(amount: number) {
    this.hp -= amount;
    this.alerted = true;
    this.state = 'chasing';
    this.lastKnownPlayerPosition.copy(this.mesh.position);
    if (this.hp <= 0) this.mesh.visible = false;
  }

  update(delta: number, context: ZombieUpdateContext) {
    if (!this.alive) return;

    this.attackCooldown = Math.max(0, this.attackCooldown - delta);
    const toPlayer = context.playerPosition.clone().sub(this.mesh.position);
    const playerDistance = toPlayer.length();
    const canSeePlayer = this.canSeePlayer(playerDistance);
    const canHearPlayer = context.noiseRadius > 0 && this.mesh.position.distanceTo(context.noiseOrigin) <= context.noiseRadius;

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
      if (this.lostSightTimer > 4.5) {
        this.state = 'searching';
        this.searchTimer = 4;
      }
    }

    if (this.state === 'wandering') this.updateWandering(delta);
    if (this.state === 'investigating') this.moveTowards(this.investigationTarget, 1.45, delta, () => {
      this.state = 'searching';
      this.searchTimer = 3.5;
    });
    if (this.state === 'searching') this.updateSearching(delta);
    if (this.state === 'chasing') this.moveTowards(this.lastKnownPlayerPosition, 2.35, delta);

    if (playerDistance < 1.55 && this.attackCooldown <= 0) {
      this.attackCooldown = 1.25;
      context.onAttack(19, 0.28);
    }
  }

  private updateWandering(delta: number) {
    this.moveTowards(this.wanderTarget, 0.62, delta, () => this.pickWanderTarget());
  }

  private updateSearching(delta: number) {
    this.searchTimer -= delta;
    const jitterTarget = this.lastKnownPlayerPosition.clone().add(new THREE.Vector3(Math.sin(performance.now() * 0.001) * 2.4, 0, Math.cos(performance.now() * 0.0013) * 2.4));
    this.moveTowards(jitterTarget, 1.05, delta);
    if (this.searchTimer <= 0) {
      this.alerted = false;
      this.state = 'wandering';
      this.lostSightTimer = 0;
      this.pickWanderTarget();
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

  private canSeePlayer(distance: number) {
    if (distance < 3) return true;
    const sightRange = this.alerted ? 24 : 18;
    return distance <= sightRange;
  }

  private pickWanderTarget() {
    const angle = Math.random() * Math.PI * 2;
    const radius = 6 + Math.random() * 16;
    this.wanderTarget.set(
      this.spawnPoint.x + Math.cos(angle) * radius,
      0,
      this.spawnPoint.z + Math.sin(angle) * radius
    );
  }
}
