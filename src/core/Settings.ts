import { DEFAULT_SENSITIVITY } from '../config';

const STORAGE_KEY = 'stranded.settings.v1';

interface SettingsData {
  /** Mouse look multiplier (1 = default). */
  sensitivity: number;
}

/**
 * User preferences persisted in localStorage. Add new settings (volume, etc.)
 * to SettingsData and DEFAULTS; unknown/missing keys fall back to defaults.
 */
class SettingsStore {
  private data: SettingsData = { sensitivity: DEFAULT_SENSITIVITY };

  constructor() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) this.data = { ...this.data, ...(JSON.parse(raw) as Partial<SettingsData>) };
    } catch {
      /* storage unavailable or corrupt: keep defaults */
    }
  }

  get sensitivity(): number {
    return this.data.sensitivity;
  }

  set sensitivity(value: number) {
    this.data.sensitivity = value;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(this.data));
    } catch {
      /* ignore */
    }
  }
}

export const settings = new SettingsStore();
