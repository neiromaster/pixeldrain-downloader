export function updateProgress(downloaded: number, total: number, speed: number, prefix: string = ''): void {
  const progress = (downloaded / total) * 100;
  const mbTotal = total / 1024 / 1024;
  const kbSpeed = speed / 1024;

  process.stdout.write(
    `\r${prefix}[pixeldrain] ${progress.toFixed(1)}% of ${mbTotal.toFixed(2)}MB at ${kbSpeed.toFixed(1)} KB/s`,
  );
}

export function clearLine(): void {
  process.stdout.write('\n');
}

export function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
