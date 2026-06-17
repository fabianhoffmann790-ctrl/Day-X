import * as THREE from 'three';

export class Zombie {
  public mesh: THREE.Group;
  public hp = 70;
  public alerted = false;
  private attackCooldown = 0;
  private wanderTarget = new THREE.Vector3();

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
    this.pickWanderTarget();
  }

  get alive() {
    return this.hp > 0;
  }

  damage(amount: number) {
    this.hp -= amount;
    this.alerted = true;
    if (this.hp <= 0) this.mesh.visible = false;
  }

  update(delta: number, playerPosition: THREE.Vector3, playerNoise: number, onAttack: (damage: number) => void) {
    if (!this.alive) return;
    this.attackCooldown = Math.max(0, this.attackCooldown - delta);
    const toPlayer = playerPosition.clone().sub(this.mesh.position);
    const distance = toPlayer.length();
    const canSee = distance < 22;
    const canHear = distance < 8 + playerNoise * 30;
    if (canSee || canHear) this.alerted = true;

    const target = this.alerted ? playerPosition : this.wanderTarget;
    const direction = target.clone().sub(this.mesh.position);
    direction.y = 0;
    const targetDistance = direction.length();
    if (targetDistance > 0.15) {
      direction.normalize();
      const speed = this.alerted ? 2.15 : 0.55;
      this.mesh.position.addScaledVector(direction, speed * delta);
      this.mesh.lookAt(target.x, this.mesh.position.y, target.z);
    }

    if (!this.alerted && this.mesh.position.distanceTo(this.wanderTarget) < 1) this.pickWanderTarget();
    if (distance < 1.55 && this.attackCooldown <= 0) {
      this.attackCooldown = 1.35;
      onAttack(18);
    }
  }

  private pickWanderTarget() {
    this.wanderTarget.set((Math.random() - 0.5) * 70, 0, (Math.random() - 0.5) * 70);
  }
}
