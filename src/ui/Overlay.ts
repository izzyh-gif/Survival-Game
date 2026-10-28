import { settings } from '../core/Settings';

/**
 * Start / pause overlay (static markup lives in index.html). This is the seed
 * of the home screen; settings, game history and the tutorial will hang off it.
 */
export class Overlay {
  private readonly root = document.getElementById('overlay') as HTMLElement;
  private readonly crosshair = document.getElementById('crosshair') as HTMLElement;
  private readonly button = document.getElementById('resume') as HTMLButtonElement;
  private readonly slider = document.getElementById('sensitivity') as HTMLInputElement;

  constructor(onResume: () => void) {
    this.slider.value = String(settings.sensitivity);
    this.slider.addEventListener('input', () => {
      settings.sensitivity = Number(this.slider.value);
    });
    this.root.addEventListener('click', (e) => {
      // Clicking the panel (e.g. the slider) must not resume; the button or backdrop does.
      if (e.target === this.root || e.target === this.button) onResume();
    });
  }

  show(paused: boolean): void {
    this.button.textContent = paused ? 'Click to resume' : 'Click to play';
    this.root.classList.remove('hidden');
    this.crosshair.classList.add('hidden');
  }

  hide(): void {
    this.root.classList.add('hidden');
    this.crosshair.classList.remove('hidden');
  }
}
