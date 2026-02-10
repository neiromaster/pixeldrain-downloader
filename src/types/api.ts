export type DownloadResult = {
  status: 'success' | 'low_speed' | 'failed';
  filename?: string;
};

export type SpeedSample = {
  timestamp: number;
  bytes: number;
};

export type DownloadOptions = {
  fileId: string;
  apiKey?: string;
  tempDir?: string;
  downloadDir?: string;
  retries?: number;
  retryDelay?: number;
  minSpeedThreshold?: number;
};

export interface RetryOptions extends DownloadOptions {
  handleLowSpeed: boolean;
}

export type DownloadAttemptOptions = {
  fileId: string;
  apiKey?: string;
  tempDir?: string;
  minSpeedThreshold?: number;
  downloadDir?: string;
};

export type Config = {
  settings?: {
    pixeldrain_api_key?: string | null;
    retries?: number;
    retry_delay?: number;
    min_speed?: number; // KB/s
    download_dir?: string;
    temp_dir?: string;
  };
};

export type DownloadProgress = {
  totalSize: number;
  downloadedSize: number;
  speed: number; // KB/s
  progress: number; // 0-100
};

export type FileInfo = {
  name: string;
  size: number;
};
