import { DEFAULT_DOWNLOAD_RETRIES, DEFAULT_MIN_SPEED_THRESHOLD, DEFAULT_RETRY_DELAY } from '../constants.js';
import { log } from '../utils/logger.js';
import { sleep } from '../utils/progress.js';
import { performDownloadAttempt } from './pixeldrain.js';

async function retryDownload(
  fileId: string,
  apiKey: string | undefined,
  downloadDir: string | undefined,
  retries: number,
  retryDelay: number,
  handleLowSpeed: boolean,
  minSpeedThreshold: number,
): Promise<'success' | 'failed' | 'low_speed'> {
  for (let attempt = 0; attempt < retries; attempt++) {
    log(`      Attempt ${attempt + 1}/${retries}...`, 'info');

    const result = await performDownloadAttempt(fileId, apiKey, undefined, minSpeedThreshold, downloadDir);

    if (result.status === 'success') return 'success';
    if (result.status === 'low_speed') {
      if (handleLowSpeed) {
        return 'low_speed';
      }
    }

    if (attempt < retries - 1) {
      log(`      Error. Retrying in ${retryDelay}s...`, 'warn');
      await sleep(retryDelay * 1000);
    }
  }

  return 'failed';
}

export async function downloadWithRetry(
  fileId: string,
  apiKey?: string,
  downloadDir?: string,
  retries: number = DEFAULT_DOWNLOAD_RETRIES,
  retryDelay: number = DEFAULT_RETRY_DELAY,
  minSpeedThreshold: number = DEFAULT_MIN_SPEED_THRESHOLD,
): Promise<boolean> {
  // Phase 1: Download without API key
  log('\n--- Phase 1: Download without API key ---', 'info');

  const phase1Result = await retryDownload(
    fileId,
    undefined,
    downloadDir,
    retries,
    retryDelay,
    true,
    minSpeedThreshold,
  );

  if (phase1Result === 'success') return true;

  // Phase 2: Download with API key
  if (!apiKey) {
    log('\n      ❌ Failed without API key, and no key provided', 'error');
    return false;
  }

  log('\n--- Phase 2: Download with API key ---', 'info');

  const phase2Result = await retryDownload(fileId, apiKey, downloadDir, retries, retryDelay, false, minSpeedThreshold);

  if (phase2Result === 'success') return true;

  log('\n      ❌ Failed after all retries', 'error');
  return false;
}
