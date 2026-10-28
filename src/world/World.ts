import * as THREE from 'three';
import {
  BASE_UNLOCK_RADIUS,
  CAMPFIRE_GROUND_HEIGHT,
  CAMPFIRE_SAFE_RADIUS,
  DESERT_UNLOCK_LEVEL,
  ISLAND_RADIUS,
  MIN_WALK_HEIGHT,
  TERRAIN_SIZE,
  UNLOCK_RADIUS_PER_LEVEL,
  WATER_LEVEL,
} from '../config';
import { Livestock } from '../entities/Livestock';
import { Campfire } from './Campfire';
import { ColliderGrid } from './Colliders';
import { DayNight } from './DayNight';
import { DroppedItems } from './DroppedItems';
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
  readonly drops: DroppedItems;
  readonly livestock: Livestock;

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

    this.drops = new DroppedItems((x, z) => this.terrain.heightAt(x, z));
    this.scene.add(this.drops.group);

    this.livestock = new Livestock(this);
    this.scene.add(this.livestock.group);
  }

  /** Campfire level. Higher levels unlock more of the map. */
  get campfireLevel(): number {
    return this.campfire.level;
  }

  /** Debug/cheat hook; normal play levels up by feeding logs to the fire. */
  set campfireLevel(level: number) {
    this.campfire.level = Math.max(1, Math.floor(level));
  }

  /** Radius around the campfire the player may currently explore. */
  get unlockedRadius(): number {
    return Math.min(ISLAND_RADIUS, BASE_UNLOCK_RADIUS + (this.campfire.level - 1) * UNLOCK_RADIUS_PER_LEVEL);
  }

  groundHeight(x: number, z: number): number {
    return this.terrain.heightAt(x, z);
  }

  /** Forest ground that animals may use: on the island, dry, and not desert. */
  isLand(x: number, z: number): boolean {
    return (
      Math.hypot(x, z) < ISLAND_RADIUS - 15 &&
      this.terrain.heightAt(x, z) >= MIN_WALK_HEIGHT + 0.3 &&
      this.terrain.biomeAt(x, z) === 'forest'
    );
  }

  /** True if the player may stand at (x, z): unlocked, dry, not locked desert. */
  isWalkable(x: number, z: number): boolean {
    if (Math.hypot(x, z) > this.unlockedRadius) return false;
    if (this.terrain.heightAt(x, z) < MIN_WALK_HEIGHT) return false;
    if (this.campfire.level < DESERT_UNLOCK_LEVEL && this.terrain.biomeAt(x, z) === 'desert') return false;
    return true;
  }

  /** True if (x, z) is inside the campfire's active safe zone. Enemies must respect this. */
  isSafe(x: number, z: number): boolean {
    return this.campfire.safeZoneActive && Math.hypot(x, z) <= CAMPFIRE_SAFE_RADIUS;
  }

  update(dt: number, focus: THREE.Vector3): void {
    this.dayNight.update(dt);
    this.dayNight.follow(focus);
    this.campfire.update(dt);
    this.forest.update(dt, focus.x, focus.z);
    this.livestock.update(dt, focus.x, focus.z);
  }
}
