import * as THREE from 'three';
import type { ItemId } from '../inventory/Item';

export type AnimalKind = 'cow' | 'sheep' | 'chicken';

export interface DropRule {
  item: ItemId;
  min: number;
  max: number;
}

/** Static stats for each animal. Tweak balance here. */
export interface AnimalDef {
  name: string;
  hp: number;
  /** Collision radius (metres). */
  radius: number;
  walkSpeed: number;
  fleeSpeed: number;
  drops: DropRule[];
}

export const ANIMALS: Record<AnimalKind, AnimalDef> = {
  cow: {
    name: 'cow',
    hp: 6,
    radius: 0.6,
    walkSpeed: 0.9,
    fleeSpeed: 3.2,
    drops: [
      { item: 'raw_meat', min: 2, max: 3 },
      { item: 'leather', min: 1, max: 2 },
    ],
  },
  sheep: {
    name: 'sheep',
    hp: 4,
    radius: 0.5,
    walkSpeed: 0.8,
    fleeSpeed: 3.4,
    drops: [
      { item: 'raw_meat', min: 1, max: 2 },
      { item: 'wool', min: 1, max: 3 },
    ],
  },
  chicken: {
    name: 'chicken',
    hp: 2,
    radius: 0.25,
    walkSpeed: 0.7,
    fleeSpeed: 3.8,
    drops: [
      { item: 'raw_meat', min: 1, max: 1 },
      { item: 'feather', min: 1, max: 3 },
    ],
  },
};

export interface AnimalModel {
  group: THREE.Group;
  /** Pivots at the hip; rotate .x to swing. Alternate pairs swing opposite. */
  legs: THREE.Object3D[];
}

const materials = new Map<number, THREE.MeshStandardMaterial>();
function mat(color: number): THREE.MeshStandardMaterial {
  let m = materials.get(color);
  if (!m) {
    m = new THREE.MeshStandardMaterial({ color, roughness: 1, flatShading: true });
    materials.set(color, m);
  }
  return m;
}

function box(w: number, h: number, d: number, color: number, x: number, y: number, z: number): THREE.Mesh {
  const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat(color));
  m.position.set(x, y, z);
  return m;
}

interface QuadrupedOptions {
  bodyW: number;
  bodyL: number;
  bodyH: number;
  legH: number;
  body: number;
  head: number;
  leg: number;
  headSize: number;
}

/** Four-legged body, facing -Z (same convention as the player). */
function quadruped(o: QuadrupedOptions, extras: (g: THREE.Group) => void): AnimalModel {
  const g = new THREE.Group();
  const legs: THREE.Object3D[] = [];
  g.add(box(o.bodyW, o.bodyH, o.bodyL, o.body, 0, o.legH + o.bodyH / 2, 0));
  const hy = o.legH + o.bodyH * 0.85;
  g.add(box(o.headSize, o.headSize, o.headSize, o.head, 0, hy, -o.bodyL / 2 - o.headSize * 0.4));
  for (const [sx, sz] of [
    [-1, -1],
    [1, 1],
    [1, -1],
    [-1, 1],
  ]) {
    const pivot = new THREE.Group();
    pivot.position.set(sx * o.bodyW * 0.35, o.legH, sz * o.bodyL * 0.36);
    const leg = box(0.14, o.legH, 0.14, o.leg, 0, -o.legH / 2, 0);
    pivot.add(leg);
    g.add(pivot);
    legs.push(pivot);
  }
  extras(g);
  return { group: g, legs };
}

export function createAnimalModel(kind: AnimalKind): AnimalModel {
  switch (kind) {
    case 'cow':
      return quadruped(
        { bodyW: 0.7, bodyL: 1.3, bodyH: 0.8, legH: 0.6, body: 0xf4f1ea, head: 0xf4f1ea, leg: 0x3a3a3a, headSize: 0.42 },
        (g) => {
          g.add(box(0.72, 0.4, 0.45, 0x2b2b2b, 0, 1.25, 0.2)); // dark patches
          g.add(box(0.5, 0.25, 0.4, 0x2b2b2b, 0, 1.05, -0.35));
          g.add(box(0.26, 0.14, 0.12, 0xe8b0a8, 0, 1.2, -1.02)); // snout
          g.add(box(0.1, 0.18, 0.1, 0xddd5c0, -0.2, 1.62, -0.78)); // horns
          g.add(box(0.1, 0.18, 0.1, 0xddd5c0, 0.2, 1.62, -0.78));
        },
      );
    case 'sheep':
      return quadruped(
        { bodyW: 0.75, bodyL: 0.95, bodyH: 0.75, legH: 0.45, body: 0xf2f2ee, head: 0x3a3a3a, leg: 0x3a3a3a, headSize: 0.3 },
        (g) => {
          g.add(box(0.85, 0.3, 1.05, 0xffffff, 0, 1.12, 0)); // fluffy top
          g.add(box(0.5, 0.2, 0.3, 0xffffff, 0, 1.15, -0.45)); // forelock
        },
      );
    case 'chicken': {
      const g = new THREE.Group();
      const legs: THREE.Object3D[] = [];
      const body = new THREE.Mesh(new THREE.SphereGeometry(0.2, 8, 6), mat(0xffffff));
      body.scale.set(0.9, 0.85, 1.2);
      body.position.y = 0.35;
      const head = new THREE.Mesh(new THREE.SphereGeometry(0.1, 7, 5), mat(0xffffff));
      head.position.set(0, 0.6, -0.2);
      const beak = new THREE.Mesh(new THREE.ConeGeometry(0.04, 0.1, 4), mat(0xf5a623));
      beak.rotation.x = -Math.PI / 2;
      beak.position.set(0, 0.59, -0.32);
      g.add(body, head, beak, box(0.04, 0.08, 0.1, 0xd32f2f, 0, 0.7, -0.2), box(0.1, 0.12, 0.08, 0xffffff, 0, 0.45, 0.25));
      for (const sx of [-1, 1]) {
        const pivot = new THREE.Group();
        pivot.position.set(sx * 0.07, 0.2, 0);
        pivot.add(box(0.03, 0.2, 0.03, 0xf5a623, 0, -0.1, 0));
        g.add(pivot);
        legs.push(pivot);
      }
      return { group: g, legs };
    }
  }
}
