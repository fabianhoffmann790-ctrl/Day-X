import * as THREE from 'three';
import { BUILDING_LOOT, ITEMS } from './data';
import { Inventory } from './Inventory';
import { LootSystem } from './LootSystem';
import { Zombie } from './Zombie';
import type { BuildingType, HudState, LootSpotDefinition } from './types';

type KeyMap = Record<string, boolean>;

interface LootSpot {
  mesh: THREE.Mesh;
  definition: LootSpotDefinition;
  searched: boolean;
}

export class GameEngine {
  private renderer: THREE.WebGLRenderer;
  private scene = new THREE.Scene();
  private camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
  private keys: KeyMap = {};
  private zombies: Zombie[] = [];
  private lootSpots: LootSpot[] = [];
  private inventory = new Inventory();
  private loot = new LootSystem();
  private clock = new THREE.Clock();
  private animationId = 0;
  private yaw = 0;
  private pitch = 0;
  private verticalVelocity = 0;
  private grounded = true;
  private noise = 0;
  private message = 'Suche Häuser ab. Ressourcen sind knapp.';
  private inventoryOpen = false;
  private stats = { hp: 100, stamina: 100, hunger: 86, thirst: 82, bleeding: false };
  private lastPrimaryAttack = 0;
  private scratchVector = new THREE.Vector3();

  constructor(private canvas: HTMLCanvasElement, private onHudChange: (state: HudState) => void) {
    this.renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.camera.position.set(0, 1.75, 8);
    this.camera.rotation.order = 'YXZ';
    this.setupScene();
    this.bindEvents();
    this.emitHud();
    this.loop();
  }

  dispose() {
    cancelAnimationFrame(this.animationId);
    window.removeEventListener('resize', this.onResize);
    window.removeEventListener('keydown', this.onKeyDown);
    window.removeEventListener('keyup', this.onKeyUp);
    document.removeEventListener('mousemove', this.onMouseMove);
    document.removeEventListener('mousedown', this.onMouseDown);
  }

  private setupScene() {
    this.scene.background = new THREE.Color(0x111611);
    this.scene.fog = new THREE.Fog(0x111611, 20, 95);
    this.scene.add(new THREE.HemisphereLight(0xaab0a0, 0x0b0f0b, 1.3));
    const sun = new THREE.DirectionalLight(0xf1e6c8, 1.5);
    sun.position.set(18, 28, 10);
    this.scene.add(sun);

    const ground = new THREE.Mesh(
      new THREE.PlaneGeometry(140, 140),
      new THREE.MeshStandardMaterial({ color: 0x2d332b, roughness: 1 })
    );
    ground.rotation.x = -Math.PI / 2;
    this.scene.add(ground);

    this.addBuilding('house', -16, -6, 8, 7, 0x3f4239);
    this.addBuilding('house', -4, -18, 7, 7, 0x4a453a);
    this.addBuilding('market', 13, -14, 12, 8, 0x56513f);
    this.addBuilding('police', 19, 7, 9, 8, 0x334657);
    this.addBuilding('hospital', -18, 17, 13, 8, 0x575f5d);
    this.addBuilding('workshop', 2, 17, 10, 7, 0x534734);
    this.addBuilding('military', 35, -3, 13, 10, 0x31432e);

    for (let i = 0; i < 15; i += 1) {
      const zombie = new Zombie(new THREE.Vector3((Math.random() - 0.5) * 82, 0, (Math.random() - 0.5) * 82));
      this.zombies.push(zombie);
      this.scene.add(zombie.mesh);
    }
  }

  private addBuilding(type: BuildingType, x: number, z: number, width: number, depth: number, color: number) {
    const height = type === 'military' ? 4.4 : 3.4;
    const mesh = new THREE.Mesh(
      new THREE.BoxGeometry(width, height, depth),
      new THREE.MeshStandardMaterial({ color, roughness: 0.9 })
    );
    mesh.position.set(x, height / 2, z);
    this.scene.add(mesh);

    const doorway = new THREE.Mesh(
      new THREE.BoxGeometry(1.8, 2.2, 0.08),
      new THREE.MeshBasicMaterial({ color: 0x111111 })
    );
    doorway.position.set(x, 1.1, z + depth / 2 + 0.045);
    this.scene.add(doorway);

    const spots = BUILDING_LOOT[type];
    spots.forEach((definition, index) => {
      const spot = new THREE.Mesh(
        new THREE.BoxGeometry(0.75, 0.28, 0.75),
        new THREE.MeshStandardMaterial({ color: 0xb7a66f, roughness: 0.7 })
      );
      const offsetX = -width / 2 + 1.5 + (index % 3) * 2.2;
      const offsetZ = depth / 2 + 1.4;
      spot.position.set(x + offsetX, 0.14, z + offsetZ);
      this.scene.add(spot);
      this.lootSpots.push({ mesh: spot, definition, searched: false });
    });
  }

  private bindEvents() {
    this.canvas.addEventListener('click', () => this.canvas.requestPointerLock());
    window.addEventListener('resize', this.onResize);
    window.addEventListener('keydown', this.onKeyDown);
    window.addEventListener('keyup', this.onKeyUp);
    document.addEventListener('mousemove', this.onMouseMove);
    document.addEventListener('mousedown', this.onMouseDown);
  }

  private onResize = () => {
    this.camera.aspect = window.innerWidth / window.innerHeight;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(window.innerWidth, window.innerHeight);
  };

  private onKeyDown = (event: KeyboardEvent) => {
    this.keys[event.code] = true;
    if (event.code === 'Tab') {
      event.preventDefault();
      this.inventoryOpen = !this.inventoryOpen;
      this.emitHud();
    }
    if (event.code === 'KeyE') this.searchNearbyLoot();
    if (event.code === 'Digit1') this.inventory.cycleWeapon(0);
    if (event.code === 'Digit2') this.inventory.cycleWeapon(1);
    if (event.code === 'Digit3') this.inventory.cycleWeapon(2);
    if (event.code === 'KeyR') this.message = `Munition geprüft: ${this.inventory.ammoForEquippedWeapon()} Schuss verfügbar.`;
    if (event.code === 'KeyF') this.consumeFood();
    if (event.code === 'KeyG') this.consumeDrink();
    if (event.code === 'KeyH') this.useMedical();
  };

  private onKeyUp = (event: KeyboardEvent) => {
    this.keys[event.code] = false;
  };

  private onMouseMove = (event: MouseEvent) => {
    if (document.pointerLockElement !== this.canvas) return;
    this.yaw -= event.movementX * 0.002;
    this.pitch -= event.movementY * 0.002;
    this.pitch = THREE.MathUtils.clamp(this.pitch, -1.35, 1.35);
    this.camera.rotation.set(this.pitch, this.yaw, 0);
  };

  private onMouseDown = (event: MouseEvent) => {
    if (event.button !== 0 || document.pointerLockElement !== this.canvas) return;
    this.primaryAttack();
  };

  private loop = () => {
    const delta = Math.min(this.clock.getDelta(), 0.05);
    this.update(delta);
    this.renderer.render(this.scene, this.camera);
    this.animationId = requestAnimationFrame(this.loop);
  };

  private update(delta: number) {
    this.updateMovement(delta);
    this.updateSurvival(delta);
    let alerted = 0;
    for (const zombie of this.zombies) {
      zombie.update(delta, this.camera.position, this.noise, (damage) => this.takeDamage(damage));
      if (zombie.alive && zombie.alerted) alerted += 1;
    }
    this.noise = Math.max(0, this.noise - delta * 1.6);
    this.emitHud(alerted);
  }

  private updateMovement(delta: number) {
    const forward = Number(this.keys.KeyW) - Number(this.keys.KeyS);
    const strafe = Number(this.keys.KeyD) - Number(this.keys.KeyA);
    const moving = forward !== 0 || strafe !== 0;
    const sneaking = this.keys.ControlLeft || this.keys.ControlRight || this.keys.KeyC;
    const sprinting = this.keys.ShiftLeft && moving && !sneaking && this.stats.stamina > 4;
    const speed = sneaking ? 1.45 : sprinting ? 6.0 : 3.25;

    const direction = this.scratchVector.set(strafe, 0, -forward);
    if (direction.lengthSq() > 0) {
      direction.normalize().applyAxisAngle(new THREE.Vector3(0, 1, 0), this.yaw);
      this.camera.position.addScaledVector(direction, speed * delta);
    }

    if (sprinting) this.stats.stamina = Math.max(0, this.stats.stamina - 18 * delta);
    else this.stats.stamina = Math.min(100, this.stats.stamina + (sneaking ? 12 : 9) * delta);

    if (this.keys.Space && this.grounded && this.stats.stamina > 8) {
      this.verticalVelocity = 5;
      this.grounded = false;
      this.stats.stamina -= 8;
    }
    this.verticalVelocity -= 12 * delta;
    this.camera.position.y += this.verticalVelocity * delta;
    if (this.camera.position.y <= 1.75) {
      this.camera.position.y = 1.75;
      this.verticalVelocity = 0;
      this.grounded = true;
    }
    this.camera.position.x = THREE.MathUtils.clamp(this.camera.position.x, -66, 66);
    this.camera.position.z = THREE.MathUtils.clamp(this.camera.position.z, -66, 66);

    if (moving) this.noise = Math.max(this.noise, sneaking ? 0.08 : sprinting ? 0.72 : 0.26);
  }

  private updateSurvival(delta: number) {
    this.stats.hunger = Math.max(0, this.stats.hunger - delta * 0.45);
    this.stats.thirst = Math.max(0, this.stats.thirst - delta * 0.62);
    if (this.stats.bleeding) this.stats.hp = Math.max(0, this.stats.hp - delta * 1.1);
    if (this.stats.hunger <= 0 || this.stats.thirst <= 0) this.stats.hp = Math.max(0, this.stats.hp - delta * 1.6);
    if (this.stats.hp <= 0) this.message = 'Du bist gestorben. Reload im Browser startet den Prototyp neu.';
  }

  private searchNearbyLoot() {
    const nearest = this.lootSpots
      .filter((spot) => !spot.searched)
      .sort((a, b) => a.mesh.position.distanceTo(this.camera.position) - b.mesh.position.distanceTo(this.camera.position))[0];
    if (!nearest || nearest.mesh.position.distanceTo(this.camera.position) > 3) {
      this.message = 'Kein durchsuchbarer Lootspot in Reichweite.';
      return;
    }
    nearest.searched = true;
    nearest.mesh.visible = false;
    const item = this.loot.roll(nearest.definition.pool, nearest.definition.chance);
    if (!item) {
      this.message = 'Du findest nichts Brauchbares.';
      return;
    }
    const amount = item.type === 'ammo' ? 3 + Math.floor(Math.random() * 5) : 1;
    if (this.inventory.add(item.id, amount)) this.message = `Gefunden: ${item.name}${amount > 1 ? ` x${amount}` : ''}.`;
    else this.message = `Kein Platz für ${item.name}. Suche einen Rucksack.`;
  }

  private primaryAttack() {
    const now = performance.now();
    if (now - this.lastPrimaryAttack < 480) return;
    this.lastPrimaryAttack = now;
    const weapon = this.inventory.equippedWeapon();
    const weaponData = weapon?.weapon ?? { kind: 'melee' as const, damage: 12, range: 1.7, noise: 0.15 };
    if (weaponData.kind === 'ranged') {
      const ammoType = weaponData.ammoType;
      if (!ammoType || !this.inventory.remove(ammoType, 1)) {
        this.message = 'Klick. Keine passende Munition.';
        return;
      }
      this.noise = Math.max(this.noise, weaponData.noise);
      this.message = `${weapon?.name ?? 'Waffe'} abgefeuert. Munition ist wertvoll.`;
    } else {
      this.noise = Math.max(this.noise, weaponData.noise);
    }

    const raycaster = new THREE.Raycaster();
    raycaster.setFromCamera(new THREE.Vector2(0, 0), this.camera);
    let best: Zombie | null = null;
    let bestDistance = Number.POSITIVE_INFINITY;
    for (const zombie of this.zombies) {
      if (!zombie.alive) continue;
      const distance = zombie.mesh.position.distanceTo(this.camera.position);
      if (distance > weaponData.range) continue;
      const toZombie = zombie.mesh.position.clone().sub(this.camera.position).normalize();
      const facing = raycaster.ray.direction.dot(toZombie);
      if (facing > 0.94 && distance < bestDistance) {
        best = zombie;
        bestDistance = distance;
      }
    }
    if (best) {
      best.damage(weaponData.damage);
      this.message = best.alive ? 'Treffer. Der Zombie kommt weiter.' : 'Zombie ausgeschaltet.';
    } else if (weaponData.kind === 'melee') this.message = 'Du triffst ins Leere.';
  }

  private takeDamage(rawDamage: number) {
    const mitigated = rawDamage * (1 - this.inventory.armor);
    this.stats.hp = Math.max(0, this.stats.hp - mitigated);
    if (Math.random() > 0.72) this.stats.bleeding = true;
    this.message = this.stats.bleeding ? 'Zombieangriff! Du blutest.' : 'Zombieangriff! Abstand gewinnen.';
  }

  private consumeFood() {
    const item = this.inventory.useBestFood();
    if (!item) return;
    this.stats.hunger = Math.min(100, this.stats.hunger + (item.nutrition ?? 0));
    this.message = `${item.name} gegessen.`;
  }

  private consumeDrink() {
    const item = this.inventory.useBestDrink();
    if (!item) return;
    this.stats.thirst = Math.min(100, this.stats.thirst + (item.hydration ?? 0));
    this.message = `${item.name} getrunken.`;
  }

  private useMedical() {
    const item = this.inventory.useMedical();
    if (!item) return;
    this.stats.hp = Math.min(100, this.stats.hp + (item.heal ?? 0));
    if (item.stopsBleeding) this.stats.bleeding = false;
    this.message = `${item.name} verwendet.`;
  }

  private emitHud(zombiesAlerted = 0) {
    const weapon = this.inventory.equippedWeapon();
    this.onHudChange({
      hp: Math.round(this.stats.hp),
      stamina: Math.round(this.stats.stamina),
      hunger: Math.round(this.stats.hunger),
      thirst: Math.round(this.stats.thirst),
      bleeding: this.stats.bleeding,
      capacity: this.inventory.capacity,
      usedSlots: this.inventory.usedSlots,
      armor: this.inventory.armor,
      weapon: weapon?.name ?? 'Fäuste',
      ammo: this.inventory.ammoForEquippedWeapon(),
      zombiesAlerted,
      message: this.message,
      inventoryOpen: this.inventoryOpen,
      inventory: this.inventory.entries()
    });
  }
}
