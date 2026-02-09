import type { Config } from '../types/api.js';

export function validateConfig(config: unknown): Config | null {
  if (typeof config !== 'object' || config === null) {
    return null;
  }

  const cfg = config as Partial<Config>;

  // Basic validation - ensure settings object exists if provided
  if (cfg.settings && typeof cfg.settings !== 'object') {
    return null;
  }

  return cfg as Config;
}
