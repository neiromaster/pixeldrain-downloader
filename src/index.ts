import { unlink } from 'node:fs/promises';
import { createInterface } from 'node:readline';

import { loadConfig } from './config/loader.js';
import {
  DEFAULT_DOWNLOAD_RETRIES,
  DEFAULT_MIN_SPEED_THRESHOLD,
  DEFAULT_RETRY_DELAY,
  DEFAULT_TEMP_DIR,
} from './constants.js';
import { downloadWithRetry } from './services/downloader.js';
import type { DownloadOptions } from './types/api.js';
import { log } from './utils/logger.js';

const currentDownloadPath: string | null = null;

async function cleanup(sigint: boolean = false): Promise<void> {
  if (currentDownloadPath) {
    log('\n🧹 Cleaning up partial download...', 'info');
    try {
      await unlink(currentDownloadPath);
    } catch {}
  }
  if (sigint) process.exit(130);
}

process.on('SIGINT', () => cleanup(true));
process.on('SIGTERM', () => cleanup(true));

async function getUserPrompt(): Promise<string> {
  return new Promise((resolve) => {
    const rl = createInterface({
      input: process.stdin,
      output: process.stdout,
    });

    rl.question('Enter PixelDrain file URL: ', (answer) => {
      rl.close();
      resolve(answer.trim());
    });
  });
}

async function main(): Promise<void> {
  const config = (await loadConfig()) || {};
  const settings = config.settings || {};

  // Get URL from user
  const url = await getUserPrompt();
  if (!url) {
    log('❌ URL cannot be empty', 'error');
    process.exit(1);
  }

  const fileId = url.split('/').pop() || '';
  if (!fileId) {
    log('❌ Could not extract file ID from URL', 'error');
    process.exit(1);
  }

  const downloadOptions: DownloadOptions = {
    fileId,
    apiKey: settings.pixeldrain_api_key ?? undefined,
    tempDir: settings.temp_dir ?? DEFAULT_TEMP_DIR,
    downloadDir: settings.download_dir ?? undefined,
    retries: settings.retries ?? DEFAULT_DOWNLOAD_RETRIES,
    retryDelay: settings.retry_delay ?? DEFAULT_RETRY_DELAY,
    minSpeedThreshold: settings.min_speed ?? DEFAULT_MIN_SPEED_THRESHOLD,
  };

  const success = await downloadWithRetry(downloadOptions);
  process.exit(success ? 0 : 1);
}

main().catch((error) => {
  log(`❌ Fatal error: ${error}`, 'error');
  process.exit(1);
});
