export type DownloadResult = {
  status: 'success' | 'low_speed' | 'failed';
  filename?: string;
};

export type SpeedSample = {
  timestamp: number;
  bytes: number;
};

export type Config = {
  settings?: {
    pixeldrain_api_key?: string | null;
    retries?: number;
    retry_delay?: number;
    min_speed?: number; // KB/s
  };
};

export type DownloadProgress = {
  totalSize: number;
  downloadedSize: number;
  speed: number; // KB/s
  progress: number; // 0-100
};
