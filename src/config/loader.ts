import { readFile } from 'node:fs/promises';
import type { Config } from '../types/api.js';
import { log } from '../utils/logger.js';

export async function loadConfig(configPath: string = 'config.json'): Promise<Config | null> {
  try {
    const text = await readFile(configPath, 'utf-8');
    return JSON.parse(text) as Config;
  } catch (error) {
    if (error instanceof Error && 'code' in error && (error as NodeJS.ErrnoException).code === 'ENOENT') {
      return null;
    }
    log(`❌ Error loading config: ${(error as Error).message}`, 'error');
    return null;
  }
}
