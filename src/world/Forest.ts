import * as THREE from 'three';
import {
  CAMPFIRE_GROUND_HEIGHT,
  ISLAND_RADIUS,
  TREE_ATTEMPTS,
  TREE_CLEARING_RADIUS,
  TREE_MIN_HEIGHT,
  TREE_MIN_SPACING,
  WORLD_SEED,
} from '../config';
import { ColliderGrid } from './Colliders';
import { mulberry32 } from './noise';
import type { Terrain } from './Terrain';

export interface Tree {
  /** Same id as the tree's collider; use it with Forest.removeTree(). */
  id: number;
  x: number;
  y: number;
  z: number;
  scale: number;
  /** Index into the InstancedMeshes. */
  index: number;
}

const TRUNK_RADIUS = 0.35;

/**
 * Procedurally scattered trees rendered with InstancedMesh (3 draw calls for
 * the whole forest). Each tree registers a trunk collider with the shared grid.
 *
 * Gameplay hooks for the "chop trees" task:
 *  - `trees` / `findNearest()` locate trees,
 *  - `removeTree(id)` hides the instance and removes its collider.
 */
export class Forest {
  readonly trees: Tree[] = [];
  readonly group = new THREE.Group();
  private readonly trunks: THREE.InstancedMesh;
  private readonly lowerLeaves: THREE.InstancedMesh;
  private readonly upperLeaves: THREE.InstancedMesh;
  private readonly byId = new Map<number, Tree>();

  constructor(terrain: Terrain, private readonly colliders: ColliderGrid) {
    const rand = mulberry32(WORLD_SEED + 100);
    const placed: { id: number; x: number; y: number; z: number; scale: number }[] = [];

    for (let i = 0; i < TREE_ATTEMPTS; i++) {
      const angle = rand() * Math.PI * 2;
      const r = Math.sqrt(rand()) * ISLAND_RADIUS;
      const x = Math.cos(angle) * r;
      const z = Math.sin(angle) * r;
      if (r < TREE_CLEARING_RADIUS) continue;
      if (terrain.biomeAt(x, z) !== 'forest') continue;
      const y = terrain.heightAt(x, z);
      if (y < TREE_MIN_HEIGHT || y > CAMPFIRE_GROUND_HEIGHT + 6) continue;
      if (colliders.overlaps(x, z, TREE_MIN_SPACING / 2)) continue;
      const scale = 0.8 + rand() * 0.7;
      const collider = colliders.add(x, z, TRUNK_RADIUS * scale);
      placed.push({ id: collider.id, x, y, z, scale });
    }

    const trunkGeo = new THREE.CylinderGeometry(0.25, 0.35, 3, 6).translate(0, 1.5, 0);
    const lowerGeo = new THREE.ConeGeometry(1.7, 3, 7).translate(0, 4, 0);
    const upperGeo = new THREE.ConeGeometry(1.2, 2.6, 7).translate(0, 5.6, 0);
    const bark = new THREE.MeshStandardMaterial({ color: 0x6b4a2b, roughness: 1, flatShading: true });
    const leaves = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.9, flatShading: true });

    const n = placed.length;
    this.trunks = new THREE.InstancedMesh(trunkGeo, bark, n);
    this.lowerLeaves = new THREE.InstancedMesh(lowerGeo, leaves, n);
    this.upperLeaves = new THREE.InstancedMesh(upperGeo, leaves, n);

    const m = new THREE.Matrix4();
    const q = new THREE.Quaternion();
    const s = new THREE.Vector3();
    const p = new THREE.Vector3();
    const col = new THREE.Color();
    placed.forEach((t, index) => {
      q.setFromAxisAngle(THREE.Object3D.DEFAULT_UP, rand() * Math.PI * 2);
      s.setScalar(t.scale);
      p.set(t.x, t.y - 0.1, t.z);
      m.compose(p, q, s);
      this.trunks.setMatrixAt(index, m);
      this.lowerLeaves.setMatrixAt(index, m);
      this.upperLeaves.setMatrixAt(index, m);
      // Bright, saturated greens: the daytime look should feel almost too perfect.
      col.setHSL(0.27 + rand() * 0.05, 0.55, 0.38 + rand() * 0.1);
      this.lowerLeaves.setColorAt(index, col);
      this.upperLeaves.setColorAt(index, col);
      const tree: Tree = { id: t.id, x: t.x, y: t.y, z: t.z, scale: t.scale, index };
      this.trees.push(tree);
      this.byId.set(t.id, tree);
    });

    this.group.add(this.trunks, this.lowerLeaves, this.upperLeaves);
    this.group.name = 'forest';
  }

  /** Nearest living tree within maxDist of (x, z), or null. */
  findNearest(x: number, z: number, maxDist: number): Tree | null {
    let best: Tree | null = null;
    let bestD = maxDist * maxDist;
    for (const t of this.trees) {
      const d = (t.x - x) ** 2 + (t.z - z) ** 2;
      if (d < bestD) {
        bestD = d;
        best = t;
      }
    }
    return best;
  }

  /** Remove a tree from the scene and from collision (used when chopped). */
  removeTree(id: number): void {
    const tree = this.byId.get(id);
    if (!tree) return;
    const zero = new THREE.Matrix4().makeScale(0, 0, 0);
    for (const mesh of [this.trunks, this.lowerLeaves, this.upperLeaves]) {
      mesh.setMatrixAt(tree.index, zero);
      mesh.instanceMatrix.needsUpdate = true;
    }
    this.colliders.remove(id);
    this.byId.delete(id);
    this.trees.splice(this.trees.indexOf(tree), 1);
  }
}
