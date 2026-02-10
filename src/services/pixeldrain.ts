import { copyFile, mkdir, rename, unlink, writeFile } from 'node:fs/promises';
import path from 'node:path';

import {
  DEFAULT_MIN_SPEED_THRESHOLD,
  DEFAULT_USER_AGENT,
  PIXELDRAIN_API_FILE_URL,
  PIXELDRAIN_API_INFO_URL,
  SPEED_CHECK_WINDOW_SECONDS,
} from '../constants.js';
import type { DownloadAttemptOptions, DownloadResult, FileInfo, SpeedSample } from '../types/api.js';
import { log } from '../utils/logger.js';
import { clearLine, updateProgress } from '../utils/progress.js';

async function ensureDirectory(dirPath: string | undefined, fallbackToCwd: boolean = false): Promise<string> {
  const resolved = dirPath ? path.resolve(dirPath) : fallbackToCwd ? process.cwd() : '.';

  if (!dirPath && !fallbackToCwd) {
    return resolved;
  }

  try {
    await mkdir(resolved, { recursive: true });
    return resolved;
  } catch (error: any) {
    if (dirPath) {
      log(`⚠️ Cannot create directory ${resolved}: ${error.message}`, 'warn');
      if (fallbackToCwd) {
        log('Falling back to current directory', 'info');
        return process.cwd();
      }
    }
    throw error;
  }
}

async function cleanupPartialDownload(filePath: string): Promise<void> {
  try {
    await unlink(filePath);
    log(`      🧹 Cleaned up partial download: ${path.basename(filePath)}`, 'info');
  } catch (error: any) {
    if (error.code !== 'ENOENT') {
      log(`      ⚠️ Failed to cleanup: ${error.message}`, 'warn');
    }
  }
}

async function moveFileAfterDownload(sourcePath: string, filename: string, downloadDir: string): Promise<boolean> {
  try {
    const resolvedDir = await ensureDirectory(downloadDir);
    const destPath = path.join(resolvedDir, filename);

    if (path.resolve(sourcePath) === path.resolve(destPath)) {
      log(`      ✅ File already in target directory: ${destPath}`, 'success');
      return true;
    }

    try {
      await rename(sourcePath, destPath);
      log(`      ✅ File moved to ${destPath}`, 'success');
      return true;
    } catch (renameError: any) {
      // Windows EXDEV fallback - different drives
      if (renameError.code === 'EXDEV') {
        await copyFile(sourcePath, destPath);
        await unlink(sourcePath);
        log(`      ✅ File copied to ${destPath}`, 'success');
        return true;
      }
      throw renameError;
    }
  } catch (error) {
    log(`      ⚠️ Failed to move file: ${(error as Error).message}`, 'warn');
    log('      File remains in current directory', 'info');
    return false;
  }
}

async function getFileInfo(fileId: string, apiKey?: string): Promise<FileInfo | null> {
  const url = PIXELDRAIN_API_INFO_URL(fileId);

  const headers: Record<string, string> = {
    'User-Agent': DEFAULT_USER_AGENT,
  };
  if (apiKey) {
    const auth = Buffer.from(`:${apiKey}`).toString('base64');
    headers.Authorization = `Basic ${auth}`;
  }

  try {
    const response = await fetch(url, { headers });
    if (!response.ok) return null;

    const data = (await response.json()) as { name?: string; size?: number };
    if (data.name && typeof data.size === 'number') {
      return { name: data.name, size: data.size };
    }
    return null;
  } catch {
    return null;
  }
}

export async function performDownloadAttempt(options: DownloadAttemptOptions): Promise<DownloadResult> {
  const { fileId, apiKey, tempDir, minSpeedThreshold = DEFAULT_MIN_SPEED_THRESHOLD, downloadDir } = options;

  const url = PIXELDRAIN_API_FILE_URL(fileId);

  const headers: Record<string, string> = {
    'User-Agent': DEFAULT_USER_AGENT,
  };
  if (apiKey) {
    const auth = Buffer.from(`:${apiKey}`).toString('base64');
    headers.Authorization = `Basic ${auth}`;
  }

  let downloadedSize = 0;
  let totalSize = 0;
  const startTime = Date.now();
  let lastProgressUpdate = 0;
  const PROGRESS_UPDATE_INTERVAL = 200; // ms

  const speedSamples: SpeedSample[] = [];

  const fileInfo = await getFileInfo(fileId, apiKey);
  const filename = fileInfo?.name || fileId;

  const tempDirectory = await ensureDirectory(tempDir, true);
  const filePath = path.join(tempDirectory, filename);

  log(`      Filename: ${filename}`, 'info');
  log(`      Temp path: ${filePath}`, 'info');

  try {
    const response = await fetch(url, { headers });
    if (!response.ok) throw new Error(`HTTP ${response.status}: ${response.statusText}`);

    totalSize = parseInt(response.headers.get('content-length') || '0', 10);

    const reader = response.body?.getReader();
    if (!reader) throw new Error('No response body');

    const chunks: Uint8Array[] = [];

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      if (value) {
        chunks.push(value);
        downloadedSize += value.length;
      }

      if (totalSize > 0) {
        const elapsed = (Date.now() - startTime) / 1000;
        const speed = elapsed > 0 ? downloadedSize / elapsed / 1024 : 0; // KB/s

        if (!apiKey) {
          const now = Date.now();

          speedSamples.push({ timestamp: now, bytes: downloadedSize });

          const tenSecondsAgo = now - SPEED_CHECK_WINDOW_SECONDS * 1000;
          while (speedSamples.length > 0) {
            const firstSample = speedSamples[0];
            if (firstSample && firstSample.timestamp < tenSecondsAgo) {
              speedSamples.shift();
            } else {
              break;
            }
          }

          if (speedSamples.length >= 2) {
            const windowStart = speedSamples[0];
            const windowEnd = speedSamples.at(-1);
            if (windowStart && windowEnd) {
              const windowElapsed = (windowEnd.timestamp - windowStart.timestamp) / 1000;
              const windowBytes = windowEnd.bytes - windowStart.bytes;
              const windowSpeed = windowElapsed > 0 ? windowBytes / windowElapsed / 1024 : 0; // KB/s

              if (windowElapsed >= SPEED_CHECK_WINDOW_SECONDS) {
                if (windowSpeed < minSpeedThreshold) {
                  const mbSpeed = windowSpeed / 1024;
                  const mbThreshold = minSpeedThreshold / 1024;
                  clearLine();
                  log(
                    `\n      ❌ Low speed detected: ${mbSpeed.toFixed(2)} MB/s in 10s window (need ${mbThreshold.toFixed(2)} MB/s)`,
                    'warn',
                  );
                  log('      Switching to API key download...', 'info');
                  return { status: 'low_speed' };
                }
              }
            }
          }
        }

        const now = Date.now();
        if (now - lastProgressUpdate >= PROGRESS_UPDATE_INTERVAL) {
          updateProgress(downloadedSize, totalSize, speed);
          lastProgressUpdate = now;
        }
      }
    }

    const finalElapsed = (Date.now() - startTime) / 1000;
    const finalSpeed = finalElapsed > 0 ? downloadedSize / finalElapsed / 1024 : 0;
    updateProgress(downloadedSize, totalSize, finalSpeed);

    const totalLength = chunks.reduce((acc, chunk) => acc + chunk.length, 0);
    const buffer = new Uint8Array(totalLength);
    let offset = 0;
    for (const chunk of chunks) {
      buffer.set(chunk, offset);
      offset += chunk.length;
    }
    await writeFile(filePath, buffer);

    if (downloadDir) {
      await moveFileAfterDownload(filePath, filename, downloadDir);
    }

    clearLine();
    log('      ✅ Download complete', 'success');
    return { status: 'success', filename };
  } catch (error) {
    clearLine();
    log(`\n      ❌ Download error: ${(error as Error).message}`, 'error');

    await cleanupPartialDownload(filePath);

    if ((error as Error).message.includes('403')) {
      log('      ❌ Access forbidden - may require API key', 'error');
    }

    return { status: 'failed' };
  }
}
