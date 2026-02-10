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

  // Validate download_dir is string if provided
  if (cfg.settings?.download_dir && typeof cfg.settings.download_dir !== 'string') {
    return null;
  }

  return cfg as Config;
}
