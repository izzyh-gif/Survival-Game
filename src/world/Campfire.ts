import * as THREE from 'three';

/**
 * Placeholder campfire: stone ring, logs, flame and a flickering light.
 *
 * Only visuals + lit/unlit state for now. Planned (see docs/ROADMAP.md): log
 * counts, levelling, the 10-second "out" timer and the safe zone.
 */
export class Campfire {
  readonly group = new THREE.Group();
  /** Radius of the solid base (used for player collision). */
  readonly collisionRadius = 1.0;
  lit = true;

  private readonly flame: THREE.Mesh;
  private readonly light: THREE.PointLight;
  private time = 0;

  constructor(x: number, y: number, z: number) {
    this.group.position.set(x, y, z);
    this.group.name = 'campfire';

    const stone = new THREE.MeshStandardMaterial({ color: 0x8a8a8a, roughness: 1, flatShading: true });
    for (let i = 0; i < 8; i++) {
      const a = (i / 8) * Math.PI * 2;
      const rock = new THREE.Mesh(new THREE.DodecahedronGeometry(0.28, 0), stone);
      rock.position.set(Math.cos(a) * 0.8, 0.15, Math.sin(a) * 0.8);
      rock.rotation.set(a, a * 2, 0);
      this.group.add(rock);
    }

    const wood = new THREE.MeshStandardMaterial({ color: 0x5a3a1e, roughness: 1, flatShading: true });
    for (let i = 0; i < 4; i++) {
      const log = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.1, 1.1, 6), wood);
      log.rotation.z = Math.PI / 2;
      log.rotation.y = (i / 4) * Math.PI;
      log.position.y = 0.15 + (i % 2) * 0.12;
      this.group.add(log);
    }

    this.flame = new THREE.Mesh(
      new THREE.ConeGeometry(0.35, 1.0, 7),
      new THREE.MeshBasicMaterial({ color: 0xff9a2e }),
    );
    this.flame.position.y = 0.7;
    this.group.add(this.flame);

    this.light = new THREE.PointLight(0xff9a40, 25, 28, 1.6);
    this.light.position.y = 1.2;
    this.group.add(this.light);
  }

  update(dt: number): void {
    this.time += dt;
    this.flame.visible = this.lit;
    if (!this.lit) {
      this.light.intensity = 0;
      return;
    }
    const flicker = 1 + Math.sin(this.time * 17) * 0.06 + Math.sin(this.time * 31.7) * 0.05;
    this.flame.scale.set(1, flicker, 1);
    this.light.intensity = 25 * flicker;
  }
}
