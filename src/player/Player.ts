import * as THREE from 'three';
import {
  BACKWARD_MULTIPLIER,
  EYE_HEIGHT,
  KEY_TURN_SPEED,
  MOUSE_RADIANS_PER_PIXEL,
  PLAYER_RADIUS,
  SPRINT_MULTIPLIER,
  WALK_SPEED,
} from '../config';
import type { Input } from '../core/Input';
import { settings } from '../core/Settings';
import { clamp } from '../world/noise';
import type { World } from '../world/World';

const MAX_PITCH = Math.PI / 2 - 0.05;

/**
 * First-person controller.
 *
 * Controls (SPEC "User Controls"):
 *  - W/Up, S/Down: move forward/back
 *  - A/Left, D/Right: turn the view (no strafing, per spec) ; mouse also looks
 *  - Shift: sprint
 *
 * `isMoving` / `isSprinting` are exposed for other systems (hunger drain,
 * footstep sounds). The player follows terrain height; there is no jumping.
 */
export class Player {
  readonly camera: THREE.PerspectiveCamera;
  /** Feet position on the ground. */
  readonly position = new THREE.Vector3();
  yaw = 0;
  pitch = 0;
  isMoving = false;
  isSprinting = false;

  private bobTime = 0;

  constructor(aspect: number, spawn: THREE.Vector3) {
    this.camera = new THREE.PerspectiveCamera(70, aspect, 0.1, 400);
    this.camera.rotation.order = 'YXZ';
    this.position.copy(spawn);
    this.syncCamera(0);
  }

  update(dt: number, input: Input, world: World): void {
    // --- Looking ---
    const { dx, dy } = input.consumeMouseDelta();
    const sens = settings.sensitivity * MOUSE_RADIANS_PER_PIXEL;
    this.yaw -= dx * sens;
    this.pitch = clamp(this.pitch - dy * sens, -MAX_PITCH, MAX_PITCH);
    if (input.anyDown('KeyA', 'ArrowLeft')) this.yaw += KEY_TURN_SPEED * dt;
    if (input.anyDown('KeyD', 'ArrowRight')) this.yaw -= KEY_TURN_SPEED * dt;

    // --- Moving ---
    const forward = (input.anyDown('KeyW', 'ArrowUp') ? 1 : 0) - (input.anyDown('KeyS', 'ArrowDown') ? 1 : 0);
    this.isMoving = forward !== 0;
    // Sprint only counts when actually moving forward.
    this.isSprinting = forward > 0 && input.anyDown('ShiftLeft', 'ShiftRight');

    if (this.isMoving) {
      let speed = WALK_SPEED;
      if (this.isSprinting) speed *= SPRINT_MULTIPLIER;
      if (forward < 0) speed *= BACKWARD_MULTIPLIER;
      const dist = speed * dt * Math.sign(forward);
      this.tryMove(world, -Math.sin(this.yaw) * dist, -Math.cos(this.yaw) * dist);
      this.bobTime += dt * (this.isSprinting ? 14 : 9);
    }

    this.syncCamera(dt, world);
  }

  /** Move by (dx, dz), sliding along blocked axes (water, bounds, trees). */
  private tryMove(world: World, dx: number, dz: number): void {
    const { x, z } = this.position;
    const attempts: [number, number][] = [
      [x + dx, z + dz],
      [x + dx, z],
      [x, z + dz],
    ];
    for (const [nx, nz] of attempts) {
      const r = world.colliders.resolve(nx, nz, PLAYER_RADIUS);
      if (world.isWalkable(r.x, r.z)) {
        this.position.x = r.x;
        this.position.z = r.z;
        return;
      }
    }
  }

  private syncCamera(dt: number, world?: World): void {
    if (world) {
      const ground = world.groundHeight(this.position.x, this.position.z);
      // Smooth steps over uneven terrain.
      this.position.y += (ground - this.position.y) * Math.min(1, dt * 15);
    }
    const bob = this.isMoving ? Math.sin(this.bobTime) * 0.04 : 0;
    this.camera.position.set(this.position.x, this.position.y + EYE_HEIGHT + bob, this.position.z);
    this.camera.rotation.set(this.pitch, this.yaw, 0);
  }

  resize(aspect: number): void {
    this.camera.aspect = aspect;
    this.camera.updateProjectionMatrix();
  }
}
