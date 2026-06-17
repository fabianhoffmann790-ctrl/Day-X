import * as THREE from 'three';
import type { ZoneType } from './types';

export interface ZombieRig {
  root: THREE.Group;
  head: THREE.Object3D;
  torso: THREE.Object3D;
  leftArm: THREE.Object3D;
  rightArm: THREE.Object3D;
  leftLeg: THREE.Object3D;
  rightLeg: THREE.Object3D;
}

function mat(color: number) { return new THREE.MeshStandardMaterial({ color, roughness: 1, metalness: 0.02 }); }
function box(w: number, h: number, d: number, color: number) { return new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat(color)); }
function capsule(r: number, length: number, color: number) { return new THREE.Mesh(new THREE.CapsuleGeometry(r, length, 3, 8), mat(color)); }

export class ZombieModelFactory {
  static create(zoneType: ZoneType): ZombieRig {
    const root = new THREE.Group();
    const heightScale = 0.92 + Math.random() * 0.22;
    const tint = zoneType === 'military' ? 0x3f4d3b : zoneType === 'hospital' ? 0x686d68 : zoneType === 'forest' ? 0x3e5138 : 0x50584f;
    const skin = 0x6f7568;
    const torso = box(0.52, 0.88, 0.28, tint);
    torso.position.set(0, 1.08, -0.04);
    torso.rotation.x = 0.15;
    const head = new THREE.Mesh(new THREE.SphereGeometry(0.23, 12, 8), mat(skin));
    head.position.set(0.04, 1.73, -0.12);
    const jaw = box(0.18, 0.08, 0.08, 0x394137);
    jaw.position.set(0.05, 1.58, -0.26);
    const leftArm = capsule(0.08, 0.72, 0x4b4e46);
    const rightArm = capsule(0.08, 0.72, 0x4b4e46);
    leftArm.position.set(-0.42, 1.03, -0.08);
    rightArm.position.set(0.42, 1.03, -0.08);
    leftArm.rotation.z = -0.26;
    rightArm.rotation.z = 0.26;
    const leftLeg = capsule(0.1, 0.78, 0x2d302c);
    const rightLeg = capsule(0.1, 0.78, 0x2d302c);
    leftLeg.position.set(-0.17, 0.43, 0);
    rightLeg.position.set(0.17, 0.43, 0);
    const torn = box(0.28, 0.1, 0.03, 0x1e211e);
    torn.position.set(-0.14, 1.28, -0.19);
    root.add(torso, head, jaw, leftArm, rightArm, leftLeg, rightLeg, torn);
    root.scale.setScalar(heightScale);
    return { root, head, torso, leftArm, rightArm, leftLeg, rightLeg };
  }

  static animate(rig: ZombieRig, state: string, elapsed: number, speed: number) {
    const aggressive = state === 'chasing' || state === 'investigating';
    const walk = Math.sin(elapsed * (aggressive ? 9 : 5.5)) * Math.min(0.7, speed * 0.35);
    rig.leftLeg.rotation.x = walk;
    rig.rightLeg.rotation.x = -walk;
    rig.leftArm.rotation.x = -walk * 0.7 + (aggressive ? -0.7 : -0.18);
    rig.rightArm.rotation.x = walk * 0.7 + (aggressive ? -0.7 : -0.18);
    rig.head.rotation.y = Math.sin(elapsed * 1.3) * 0.18;
    rig.torso.rotation.z = Math.sin(elapsed * 2.1) * 0.06;
  }
}
