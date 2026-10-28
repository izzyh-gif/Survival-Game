import * as THREE from 'three';

/** Add new item ids here, then give them an entry in ITEMS below. */
export type ItemId = 'log' | 'raw_meat' | 'cooked_meat' | 'leather' | 'wool' | 'feather';

export interface ItemDef {
  id: ItemId;
  name: string;
  maxStack: number;
  /** CSS colour used for the hotbar icon. */
  color: string;
  /** If set, the item can be used with click and restores this much hunger. */
  hunger?: number;
  /** If set, using the item also restores this much health (food, bandage, medkit). */
  heal?: number;
  /** Damage dealt per hit when this is the selected item (default: fists, PUNCH_DAMAGE). */
  damage?: number;
  /** 3D model for a dropped pile of `count` items (origin at ground level). */
  createMesh(count: number): THREE.Object3D;
}

const LOG_GEO = new THREE.CylinderGeometry(0.12, 0.12, 0.9, 7).rotateZ(Math.PI / 2);
const LOG_MAT = new THREE.MeshStandardMaterial({ color: 0x7a5230, roughness: 1, flatShading: true });
/** Local offsets for up to 6 visible logs in a small stack. */
const LOG_SLOTS: [number, number, number, number][] = [
  [0, 0.12, -0.14, 0],
  [0, 0.12, 0.14, 0.1],
  [0, 0.12, 0.42, -0.08],
  [0, 0.34, 0, 0.05],
  [0, 0.34, 0.28, -0.12],
  [0, 0.56, 0.14, 0.08],
];

/** Builds a small cluster of `n` copies of one shape for dropped piles. */
function cluster(geo: THREE.BufferGeometry, mat: THREE.Material, count: number, lift: number): THREE.Group {
  const g = new THREE.Group();
  const n = Math.min(4, Math.max(1, count));
  for (let i = 0; i < n; i++) {
    const m = new THREE.Mesh(geo, mat);
    const a = (i / n) * Math.PI * 2;
    m.position.set(n > 1 ? Math.cos(a) * 0.14 : 0, lift, n > 1 ? Math.sin(a) * 0.14 : 0);
    m.rotation.y = a * 2;
    g.add(m);
  }
  return g;
}

const MEAT_GEO = new THREE.BoxGeometry(0.22, 0.12, 0.16);
const MEAT_MAT = new THREE.MeshStandardMaterial({ color: 0xc9475a, roughness: 0.8, flatShading: true });
const COOKED_MAT = new THREE.MeshStandardMaterial({ color: 0x7a4326, roughness: 0.9, flatShading: true });
const LEATHER_GEO = new THREE.BoxGeometry(0.34, 0.03, 0.26);
const LEATHER_MAT = new THREE.MeshStandardMaterial({ color: 0x8b5a2b, roughness: 1, flatShading: true });
const WOOL_GEO = new THREE.IcosahedronGeometry(0.15, 0);
const WOOL_MAT = new THREE.MeshStandardMaterial({ color: 0xf4f1e8, roughness: 1, flatShading: true });
const FEATHER_GEO = new THREE.ConeGeometry(0.04, 0.3, 4).rotateZ(Math.PI / 2);
const FEATHER_MAT = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 1, flatShading: true });

export const ITEMS: Record<ItemId, ItemDef> = {
  raw_meat: {
    id: 'raw_meat',
    name: 'Raw Meat',
    maxStack: 20,
    color: '#c9475a',
    hunger: 8, // cook it in the campfire for much more
    createMesh: (count) => cluster(MEAT_GEO, MEAT_MAT, count, 0.07),
  },
  cooked_meat: {
    id: 'cooked_meat',
    name: 'Cooked Meat',
    maxStack: 20,
    color: '#7a4326',
    hunger: 35,
    heal: 5,
    createMesh: (count) => cluster(MEAT_GEO, COOKED_MAT, count, 0.07),
  },
  leather: {
    id: 'leather',
    name: 'Leather',
    maxStack: 50,
    color: '#8b5a2b',
    createMesh: (count) => cluster(LEATHER_GEO, LEATHER_MAT, count, 0.03),
  },
  wool: {
    id: 'wool',
    name: 'Wool',
    maxStack: 50,
    color: '#f4f1e8',
    createMesh: (count) => cluster(WOOL_GEO, WOOL_MAT, count, 0.14),
  },
  feather: {
    id: 'feather',
    name: 'Feather',
    maxStack: 50,
    color: '#dfe9f2',
    createMesh: (count) => cluster(FEATHER_GEO, FEATHER_MAT, count, 0.05),
  },
  log: {
    id: 'log',
    name: 'Log',
    maxStack: 99,
    color: '#8a5a2b',
    createMesh(count) {
      const g = new THREE.Group();
      const visible = Math.min(LOG_SLOTS.length, Math.max(1, Math.ceil(count / 2)));
      for (let i = 0; i < visible; i++) {
        const [x, y, z, yaw] = LOG_SLOTS[i];
        const log = new THREE.Mesh(LOG_GEO, LOG_MAT);
        log.position.set(x, y, z - 0.14);
        log.rotation.y = yaw;
        g.add(log);
      }
      return g;
    },
  },
};
