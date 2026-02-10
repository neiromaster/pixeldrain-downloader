export const DEFAULT_USER_AGENT =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36 Edg/140.0.0.0';

export const DEFAULT_MIN_SPEED_THRESHOLD = 1536; // KB/s (1.5 MB/s)
export const SPEED_CHECK_WINDOW_SECONDS = 10;

export const DEFAULT_DOWNLOAD_RETRIES = 3;
export const DEFAULT_RETRY_DELAY = 5; // seconds
export const DEFAULT_TEMP_DIR = '.';

export const PIXELDRAIN_API_FILE_URL = (fileId: string): string => `https://pixeldrain.com/api/file/${fileId}`;
export const PIXELDRAIN_API_INFO_URL = (fileId: string): string => `https://pixeldrain.com/api/file/${fileId}/info`;
