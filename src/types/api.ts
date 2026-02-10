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
  onFileChange?: (filePath: string | null) => void;
};

export type Config = {
  settings?: {
    pixeldrain_api_key?: string | null;
    retries?: number;
    retry_delay?: number;
    min_speed?: number;
    download_dir?: string;
    temp_dir?: string;
  };
};

export type FileInfo = {
  name: string;
  size: number;
};
