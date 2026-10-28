import * as THREE from 'three';
import {
  BASE_UNLOCK_RADIUS,
  CAMPFIRE_GROUND_HEIGHT,
  DESERT_UNLOCK_LEVEL,
  ISLAND_RADIUS,
  MIN_WALK_HEIGHT,
  TERRAIN_SIZE,
  UNLOCK_RADIUS_PER_LEVEL,
  WATER_LEVEL,
} from '../config';
import { Campfire } from './Campfire';
import { ColliderGrid } from './Colliders';
import { DayNight } from './DayNight';
import { Forest } from './Forest';
import { Terrain } from './Terrain';

/**
 * Owns everything that exists in the 3D world and answers spatial questions
 * ("what's the ground height here?", "can I stand here?"). Systems like the
 * player, monsters and wolves should ask the World rather than reaching into
 * Terrain/Forest directly.
 */
export class World {
  readonly scene = new THREE.Scene();
  readonly terrain = new Terrain();
  readonly colliders = new ColliderGrid();
  readonly campfire: Campfire;
  readonly forest: Forest;
  readonly dayNight: DayNight;
  /** Campfire level. Higher levels unlock more of the map. */
  private _campfireLevel = 1;

  constructor() {
    this.dayNight = new DayNight(this.scene);

    this.scene.add(this.terrain.createMesh());

    const water = new THREE.Mesh(
      new THREE.PlaneGeometry(TERRAIN_SIZE * 4, TERRAIN_SIZE * 4).rotateX(-Math.PI / 2),
      new THREE.MeshStandardMaterial({ color: 0x2f9fd8, transparent: true, opacity: 0.8, roughness: 0.25 }),
    );
    water.position.y = WATER_LEVEL;
    water.name = 'water';
    this.scene.add(water);

    this.campfire = new Campfire(0, CAMPFIRE_GROUND_HEIGHT, 0);
    this.colliders.add(0, 0, this.campfire.collisionRadius);
    this.scene.add(this.campfire.group);

    this.forest = new Forest(this.terrain, this.colliders);
    this.scene.add(this.forest.group);
  }

  get campfireLevel(): number {
    return this._campfireLevel;
  }

  set campfireLevel(level: number) {
    this._campfireLevel = Math.max(1, Math.floor(level));
  }

  /** Radius around the campfire the player may currently explore. */
  get unlockedRadius(): number {
    return Math.min(ISLAND_RADIUS, BASE_UNLOCK_RADIUS + (this._campfireLevel - 1) * UNLOCK_RADIUS_PER_LEVEL);
  }

  groundHeight(x: number, z: number): number {
    return this.terrain.heightAt(x, z);
  }

  /** True if the player may stand at (x, z): unlocked, dry, not locked desert. */
  isWalkable(x: number, z: number): boolean {
    if (Math.hypot(x, z) > this.unlockedRadius) return false;
    if (this.terrain.heightAt(x, z) < MIN_WALK_HEIGHT) return false;
    if (this._campfireLevel < DESERT_UNLOCK_LEVEL && this.terrain.biomeAt(x, z) === 'desert') return false;
    return true;
  }

  update(dt: number, focus: THREE.Vector3): void {
    this.dayNight.update(dt);
    this.dayNight.follow(focus);
    this.campfire.update(dt);
  }
}
