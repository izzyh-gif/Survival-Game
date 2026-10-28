/**
 * Raw keyboard/mouse state. Gameplay code reads this each frame instead of
 * adding its own listeners. Keys use `KeyboardEvent.code` (layout independent).
 *
 * - isDown(code): held right now
 * - wasPressed(code): went down since the last endFrame() (edge trigger)
 * - consumeMouseDelta(): accumulated mouse movement (only while pointer locked)
 * - consumeClick(): true once per left-click; isMouseDown: left button held
 * - consumeWheel(): accumulated wheel delta
 */
export class Input {
  private down = new Set<string>();
  private pressed = new Set<string>();
  private mouseDX = 0;
  private mouseDY = 0;
  private clicked = false;
  private mouseHeld = false;
  private wheel = 0;

  constructor(private readonly target: HTMLElement) {
    window.addEventListener('keydown', this.onKeyDown);
    window.addEventListener('keyup', this.onKeyUp);
    window.addEventListener('blur', this.clear);
    window.addEventListener('mousemove', this.onMouseMove);
    target.addEventListener('mousedown', this.onMouseDown);
    window.addEventListener('mouseup', this.onMouseUp);
    window.addEventListener('wheel', this.onWheel, { passive: false });
  }

  /** Left mouse button currently held (only while pointer locked). */
  get isMouseDown(): boolean {
    return this.mouseHeld;
  }

  /** Accumulated wheel movement since last call (positive = scroll down). */
  consumeWheel(): number {
    const w = this.wheel;
    this.wheel = 0;
    return w;
  }

  isDown(code: string): boolean {
    return this.down.has(code);
  }

  /** Any of the given codes held, e.g. anyDown('KeyW', 'ArrowUp'). */
  anyDown(...codes: string[]): boolean {
    return codes.some((c) => this.down.has(c));
  }

  wasPressed(code: string): boolean {
    return this.pressed.has(code);
  }

  consumeMouseDelta(): { dx: number; dy: number } {
    const d = { dx: this.mouseDX, dy: this.mouseDY };
    this.mouseDX = 0;
    this.mouseDY = 0;
    return d;
  }

  consumeClick(): boolean {
    const c = this.clicked;
    this.clicked = false;
    return c;
  }

  /** Call once at the end of every frame to reset edge-triggered state. */
  endFrame(): void {
    this.pressed.clear();
  }

  /** Forget all held input (used on pause / window blur). */
  clear = (): void => {
    this.down.clear();
    this.pressed.clear();
    this.mouseDX = this.mouseDY = 0;
    this.clicked = false;
    this.mouseHeld = false;
    this.wheel = 0;
  };

  private onKeyDown = (e: KeyboardEvent): void => {
    // Stop arrows/space from scrolling the page.
    if (e.code.startsWith('Arrow') || e.code === 'Space') e.preventDefault();
    if (!e.repeat) this.pressed.add(e.code);
    this.down.add(e.code);
  };

  private onKeyUp = (e: KeyboardEvent): void => {
    this.down.delete(e.code);
  };

  private onMouseMove = (e: MouseEvent): void => {
    if (document.pointerLockElement !== this.target) return;
    this.mouseDX += e.movementX;
    this.mouseDY += e.movementY;
  };

  private onMouseDown = (e: MouseEvent): void => {
    if (e.button === 0 && document.pointerLockElement === this.target) {
      this.clicked = true;
      this.mouseHeld = true;
    }
  };

  private onMouseUp = (e: MouseEvent): void => {
    if (e.button === 0) this.mouseHeld = false;
  };

  private onWheel = (e: WheelEvent): void => {
    e.preventDefault();
    if (document.pointerLockElement === this.target) this.wheel += e.deltaY;
  };
}
