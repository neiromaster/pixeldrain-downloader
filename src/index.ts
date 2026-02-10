import { createInterface } from 'node:readline';

import { loadConfig } from './config/loader.js';
import { DEFAULT_DOWNLOAD_RETRIES, DEFAULT_MIN_SPEED_THRESHOLD, DEFAULT_RETRY_DELAY } from './constants.js';
import { downloadWithRetry } from './services/downloader.js';
import { log } from './utils/logger.js';

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

  const apiKey = settings.pixeldrain_api_key ?? undefined;
  const retries = settings.retries ?? DEFAULT_DOWNLOAD_RETRIES;
  const retryDelay = settings.retry_delay ?? DEFAULT_RETRY_DELAY;
  const minSpeedThreshold = settings.min_speed ?? DEFAULT_MIN_SPEED_THRESHOLD;

  // Get URL from user
  const url = await getUserPrompt();

  if (!url) {
    log('❌ URL cannot be empty', 'error');
    process.exit(1);
  }

  // Extract file ID from URL
  const fileId = url.split('/').pop() || '';

  if (!fileId) {
    log('❌ Could not extract file ID from URL', 'error');
    process.exit(1);
  }

  const success = await downloadWithRetry(fileId, apiKey, retries, retryDelay, minSpeedThreshold);
  process.exit(success ? 0 : 1);
}

main().catch((error) => {
  log(`❌ Fatal error: ${error}`, 'error');
  process.exit(1);
});
