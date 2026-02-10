import { DEFAULT_DOWNLOAD_RETRIES, DEFAULT_MIN_SPEED_THRESHOLD, DEFAULT_RETRY_DELAY } from '../constants.js';
import type { DownloadOptions } from '../types/api.js';
import { log } from '../utils/logger.js';
import { sleep } from '../utils/progress.js';
import { performDownloadAttempt } from './pixeldrain.js';

async function retryWithPhase(
  options: DownloadOptions,
  handleLowSpeed: boolean,
): Promise<'success' | 'failed' | 'low_speed'> {
  const {
    fileId,
    apiKey,
    tempDir,
    downloadDir,
    retries = DEFAULT_DOWNLOAD_RETRIES,
    retryDelay = DEFAULT_RETRY_DELAY,
    minSpeedThreshold = DEFAULT_MIN_SPEED_THRESHOLD,
  } = options;

  for (let attempt = 0; attempt < retries; attempt++) {
    log(`      Attempt ${attempt + 1}/${retries}...`, 'info');

    const result = await performDownloadAttempt({
      fileId,
      apiKey,
      tempDir,
      minSpeedThreshold,
      downloadDir,
    });

    if (result.status === 'success') return 'success';
    if (result.status === 'low_speed' && handleLowSpeed) return 'low_speed';

    if (attempt < retries - 1) {
      log(`      Error. Retrying in ${retryDelay}s...`, 'warn');
      await sleep(retryDelay * 1000);
    }
  }

  return 'failed';
}

export async function downloadWithRetry(options: DownloadOptions): Promise<boolean> {
  // Phase 1: Download without API key
  log('\n--- Phase 1: Download without API key ---', 'info');

  const phase1Result = await retryWithPhase({ ...options, apiKey: undefined }, true);

  if (phase1Result === 'success') return true;

  // Phase 2: Download with API key
  if (!options.apiKey) {
    log('\n      ❌ Failed without API key, and no key provided', 'error');
    return false;
  }

  log('\n--- Phase 2: Download with API key ---', 'info');

  const phase2Result = await retryWithPhase(options, false);

  if (phase2Result === 'success') return true;

  log('\n      ❌ Failed after all retries', 'error');
  return false;
}
