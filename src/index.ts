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

let currentDownloadPath: string | null = null;

function setupSignalHandlers(): void {
  const cleanup = async (): Promise<void> => {
    if (currentDownloadPath) {
      log('\n🧹 Cleaning up partial download...', 'info');
      try {
        await unlink(currentDownloadPath);
        log('✅ Cleanup complete', 'success');
      } catch (error: unknown) {
        const message = error instanceof Error ? error.message : String(error);
        log(`⚠️ Cleanup failed: ${message}`, 'warn');
      }
    }
  };

  const exitHandler = async (signal: string): Promise<void> => {
    await cleanup();
    process.exit(signal === 'SIGINT' ? 130 : 128 + 15); // 130 for SIGINT, 143 for SIGTERM
  };

  process.once('SIGINT', () => exitHandler('SIGINT'));
  process.once('SIGTERM', () => exitHandler('SIGTERM'));
}

function getUserPrompt(): Promise<string> {
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
    log('URL cannot be empty', 'error');
    process.exit(1);
  }

  const fileId = url.split('/').pop() || '';
  if (!fileId) {
    log('Could not extract file ID from URL', 'error');
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
    onFileChange: (filePath: string | null) => {
      currentDownloadPath = filePath;
    },
  };

  setupSignalHandlers();

  const success = await downloadWithRetry(downloadOptions);
  process.exit(success ? 0 : 1);
}

main().catch((error) => {
  log(`Fatal error: ${error}`, 'error');
  process.exit(1);
});
