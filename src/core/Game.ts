import * as THREE from 'three';
import { CAMPFIRE_GROUND_HEIGHT } from '../config';
import { Player } from '../player/Player';
import { Overlay } from '../ui/Overlay';
import { World } from '../world/World';
import { Input } from './Input';

/**
 * Top-level orchestrator: renderer, main loop, pause state. Systems are
 * updated in a fixed order each frame (input -> player -> world -> render).
 * New systems (hunger, inventory, monsters...) should be constructed here and
 * updated inside `tick()` only while not paused.
 */
export class Game {
  private readonly renderer: THREE.WebGLRenderer;
  private readonly world = new World();
  private readonly input: Input;
  private readonly player: Player;
  private readonly overlay: Overlay;
  private readonly clock = new THREE.Clock();
  private paused = true;
  private started = false;

  constructor(container: HTMLElement) {
    this.renderer = new THREE.WebGLRenderer({ antialias: true });
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    container.appendChild(this.renderer.domElement);

    this.input = new Input(this.renderer.domElement);
    // Spawn just south of the fire, looking at it (camera looks down -Z at yaw 0).
    this.player = new Player(
      window.innerWidth / window.innerHeight,
      new THREE.Vector3(0, CAMPFIRE_GROUND_HEIGHT, 5),
    );

    // Dev shortcut: ?hour=22 starts at 10pm, to eyeball the night look.
    const hour = Number(new URLSearchParams(location.search).get('hour'));
    if (hour) this.world.dayNight.setHour(hour);

    this.overlay = new Overlay(() => this.resume());
    this.overlay.show(false);

    document.addEventListener('pointerlockchange', () => {
      if (document.pointerLockElement !== this.renderer.domElement) this.pause();
    });
    window.addEventListener('resize', () => {
      this.renderer.setSize(window.innerWidth, window.innerHeight);
      this.player.resize(window.innerWidth / window.innerHeight);
    });
  }

  start(): void {
    this.renderer.setAnimationLoop(() => this.tick());
  }

  private resume(): void {
    this.renderer.domElement.requestPointerLock();
    this.paused = false;
    this.started = true;
    this.input.clear();
    this.clock.getDelta(); // discard time spent paused
    this.overlay.hide();
  }

  private pause(): void {
    this.paused = true;
    this.input.clear();
    this.overlay.show(this.started);
  }

  private tick(): void {
    const dt = Math.min(this.clock.getDelta(), 0.1);
    if (!this.paused) {
      this.player.update(dt, this.input, this.world);
      this.world.update(dt, this.player.position);
    }
    this.input.endFrame();
    this.renderer.render(this.world.scene, this.player.camera);
  }
}
