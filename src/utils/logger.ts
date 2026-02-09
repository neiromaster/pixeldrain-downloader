export function log(message: string, type: 'info' | 'success' | 'error' | 'warn'): void {
  const colors = {
    info: '\x1b[36m', // cyan
    success: '\x1b[32m', // green
    error: '\x1b[31m', // red
    warn: '\x1b[33m', // yellow
  };
  const reset = '\x1b[0m';

  console.log(`${colors[type]}${message}${reset}`);
}
