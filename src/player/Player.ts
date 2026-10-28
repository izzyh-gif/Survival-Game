import * as THREE from 'three';
import {
  BACKWARD_MULTIPLIER,
  EYE_HEIGHT,
  FIRST_PERSON_THRESHOLD,
  KEY_TURN_SPEED,
  MAX_ZOOM_DISTANCE,
  MOUSE_RADIANS_PER_PIXEL,
  PLAYER_RADIUS,
  SPRINT_MULTIPLIER,
  STARVING_SPEED_MULTIPLIER,
  WALK_SPEED,
  WATER_LEVEL,
  ZOOM_HOLD_SPEED,
  ZOOM_TAP_DISTANCE,
  ZOOM_TAP_STEP,
} from '../config';
import type { Input } from '../core/Input';
import { settings } from '../core/Settings';
import { clamp } from '../world/noise';
import type { World } from '../world/World';

const MAX_PITCH = Math.PI / 2 - 0.05;
const ZOOM_IN_KEYS = ['NumpadAdd', 'Equal'];
const ZOOM_OUT_KEYS = ['NumpadSubtract', 'Minus'];

/**
 * Player controller with first/third-person camera.
 *
 * Controls (SPEC "User Controls"):
 *  - W/Up, S/Down: move forward/back
 *  - A/Left, D/Right: turn the view (no strafing, per spec) ; mouse also looks
 *  - Shift: sprint
 *  - Numpad + / Numpad - (or = / - on keyboards without a keypad): zoom the
 *    camera in/out. Zoomed all the way in = first person; out = third person.
 *
 * The body always faces `yaw`; actions (chop, pick up...) use that facing, not
 * the camera position. `isMoving` / `isSprinting` are exposed for other
 * systems (hunger drain, footstep sounds). Terrain-following, no jumping.
 */
export class Player {
  readonly camera: THREE.PerspectiveCamera;
  /** Visible character model. Add this to the scene. Hidden in first person. */
  readonly body: THREE.Group;
  /** Feet position on the ground. */
  readonly position = new THREE.Vector3();
  yaw = 0;
  pitch = 0;
  isMoving = false;
  isSprinting = false;
  /** Set by Game each frame: starving players can't sprint and move slower. */
  starving = false;

  /** Desired and current camera distance behind the player (0 = first person). */
  private targetDistance = 0;
  private distance = 0;
  private bobTime = 0;
  private swingAmp = 0;
  private readonly legs: THREE.Object3D[] = [];
  private readonly arms: THREE.Object3D[] = [];

  constructor(aspect: number, spawn: THREE.Vector3) {
    this.camera = new THREE.PerspectiveCamera(70, aspect, 0.1, 400);
    this.camera.rotation.order = 'YXZ';
    this.position.copy(spawn);
    this.body = this.buildBody();
    this.syncCamera(0);
  }

  /** Unit vector the player is facing on the XZ plane. */
  get facing(): { x: number; z: number } {
    return { x: -Math.sin(this.yaw), z: -Math.cos(this.yaw) };
  }

  update(dt: number, input: Input, world: World): void {
    // --- Looking ---
    const { dx, dy } = input.consumeMouseDelta();
    const sens = settings.sensitivity * MOUSE_RADIANS_PER_PIXEL;
    this.yaw -= dx * sens;
    this.pitch = clamp(this.pitch - dy * sens, -MAX_PITCH, MAX_PITCH);
    if (input.anyDown('KeyA', 'ArrowLeft')) this.yaw += KEY_TURN_SPEED * dt;
    if (input.anyDown('KeyD', 'ArrowRight')) this.yaw -= KEY_TURN_SPEED * dt;

    this.updateZoom(dt, input);

    // --- Moving ---
    const forward = (input.anyDown('KeyW', 'ArrowUp') ? 1 : 0) - (input.anyDown('KeyS', 'ArrowDown') ? 1 : 0);
    this.isMoving = forward !== 0;
    // Sprint only counts when actually moving forward.
    this.isSprinting = forward > 0 && !this.starving && input.anyDown('ShiftLeft', 'ShiftRight');

    if (this.isMoving) {
      let speed = WALK_SPEED;
      if (this.isSprinting) speed *= SPRINT_MULTIPLIER;
      if (forward < 0) speed *= BACKWARD_MULTIPLIER;
      if (this.starving) speed *= STARVING_SPEED_MULTIPLIER;
      const dist = speed * dt * Math.sign(forward);
      this.tryMove(world, -Math.sin(this.yaw) * dist, -Math.cos(this.yaw) * dist);
      this.bobTime += dt * (this.isSprinting ? 14 : 9);
    }

    this.syncCamera(dt, world);
  }

  /**
   * Tap: first press leaves first person (jumps to ZOOM_TAP_DISTANCE), later
   * presses step by ZOOM_TAP_STEP. Hold: continuous zoom at ZOOM_HOLD_SPEED.
   */
  private updateZoom(dt: number, input: Input): void {
    const outPressed = ZOOM_OUT_KEYS.some((k) => input.wasPressed(k));
    const inPressed = ZOOM_IN_KEYS.some((k) => input.wasPressed(k));
    if (outPressed) {
      this.targetDistance =
        this.targetDistance < ZOOM_TAP_DISTANCE - 0.01 ? ZOOM_TAP_DISTANCE : this.targetDistance + ZOOM_TAP_STEP;
    }
    if (inPressed) {
      this.targetDistance =
        this.targetDistance <= ZOOM_TAP_DISTANCE + 0.01 ? 0 : this.targetDistance - ZOOM_TAP_STEP;
    }
    // Holding a key keeps zooming (the press frame itself is handled above).
    const heldOut = input.anyDown(...ZOOM_OUT_KEYS) && !outPressed;
    const heldIn = input.anyDown(...ZOOM_IN_KEYS) && !inPressed;
    this.targetDistance += ((heldOut ? 1 : 0) - (heldIn ? 1 : 0)) * ZOOM_HOLD_SPEED * dt;
    this.targetDistance = clamp(this.targetDistance, 0, MAX_ZOOM_DISTANCE);
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
    this.distance += (this.targetDistance - this.distance) * Math.min(1, dt * 10);
    const firstPerson = this.distance < FIRST_PERSON_THRESHOLD;

    this.updateBody(dt, firstPerson);

    const cam = this.camera.position;
    if (firstPerson) {
      const bob = this.isMoving ? Math.sin(this.bobTime) * 0.04 : 0;
      cam.set(this.position.x, this.position.y + EYE_HEIGHT + bob, this.position.z);
    } else {
      // Orbit behind the head along the (inverted) look direction.
      const cp = Math.cos(this.pitch);
      const dirX = -Math.sin(this.yaw) * cp;
      const dirY = Math.sin(this.pitch);
      const dirZ = -Math.cos(this.yaw) * cp;
      const pivotY = this.position.y + EYE_HEIGHT + 0.1;
      cam.set(
        this.position.x - dirX * this.distance,
        pivotY - dirY * this.distance,
        this.position.z - dirZ * this.distance,
      );
      if (world) {
        // Keep the camera above the ground/water behind the player.
        const floor = Math.max(world.groundHeight(cam.x, cam.z), WATER_LEVEL) + 0.35;
        if (cam.y < floor) cam.y = floor;
      }
    }
    this.camera.rotation.set(this.pitch, this.yaw, 0);
  }

  private updateBody(dt: number, firstPerson: boolean): void {
    this.body.visible = !firstPerson;
    this.body.position.copy(this.position);
    this.body.rotation.y = this.yaw;
    const target = this.isMoving ? (this.isSprinting ? 0.9 : 0.6) : 0;
    this.swingAmp += (target - this.swingAmp) * Math.min(1, dt * 10);
    const swing = Math.sin(this.bobTime) * this.swingAmp;
    this.legs[0].rotation.x = swing;
    this.legs[1].rotation.x = -swing;
    this.arms[0].rotation.x = -swing;
    this.arms[1].rotation.x = swing;
  }

  /** Simple low-poly character. Faces -Z at yaw 0 (same as the camera). */
  private buildBody(): THREE.Group {
    const g = new THREE.Group();
    g.name = 'player-body';
    const mat = (color: number) => new THREE.MeshStandardMaterial({ color, roughness: 0.9, flatShading: true });
    const skin = mat(0xf1c27d);
    const shirt = mat(0x3b6ea5);
    const pants = mat(0x4b4b4b);

    const torso = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.7, 0.28), shirt);
    torso.position.y = 1.1;
    const head = new THREE.Mesh(new THREE.SphereGeometry(0.17, 8, 6), skin);
    head.position.y = 1.62;
    const nose = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.05, 0.06), skin);
    nose.position.set(0, 1.6, -0.18);
    g.add(torso, head, nose);

    const limb = (w: number, h: number, d: number, m: THREE.Material, x: number, pivotY: number) => {
      const pivot = new THREE.Group();
      pivot.position.set(x, pivotY, 0);
      const mesh = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), m);
      mesh.position.y = -h / 2;
      pivot.add(mesh);
      g.add(pivot);
      return pivot;
    };
    this.legs.push(limb(0.2, 0.75, 0.22, pants, -0.13, 0.75), limb(0.2, 0.75, 0.22, pants, 0.13, 0.75));
    this.arms.push(limb(0.14, 0.6, 0.14, shirt, -0.34, 1.42), limb(0.14, 0.6, 0.14, shirt, 0.34, 1.42));
    return g;
  }

  resize(aspect: number): void {
    this.camera.aspect = aspect;
    this.camera.updateProjectionMatrix();
  }
}
