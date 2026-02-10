# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

CLI tool for downloading files from PixelDrain with a two-phase approach:
1. **Phase 1**: Download without API key (with speed monitoring)
2. **Phase 2**: Fallback to API key if Phase 1 fails or is too slow

## Development Commands

```bash
bun run start           # Run CLI in development
bun run build           # Build for production (tsup)
bun run typecheck       # Type check without emitting
bun run lint            # Run both Biome and dprint
bun run format          # Format code automatically
bun run test            # Run tests
```

## Architecture

### Core Components

- **`src/index.ts`**: CLI entry point - handles URL parsing and orchestrates downloads
- **`src/services/downloader.ts`**: Two-phase download orchestration and retry logic
- **`src/services/pixeldrain.ts`**: PixelDrain API integration, speed monitoring, file writing
- **`src/config/`**: JSON configuration loader with validation
- **`src/utils/`**: Logging, ANSI progress bar, HTTP streaming utilities

### Two-Phase Download Strategy

**Phase 1 - Unauthenticated:**
- Attempts download without API key
- Monitors download speed using 10-second sliding window
- If max speed < 1.5 MB/s (1536 KB/s) → triggers Phase 2

**Phase 2 - Authenticated:**
- Uses API key via Basic Auth
- Higher speed limits (effectively unlimited)
- Triggered if Phase 1 fails or is too slow

### Speed Monitoring Algorithm

Located in `src/services/pixeldrain.ts:performDownloadAttempt()`

1. Collect speed samples every chunk during download
2. Maintain sliding window of samples from last 10 seconds
3. Calculate speed between oldest and newest sample in window
4. Track maximum speed observed in any 10-second window
5. After 10 seconds, if max speed < 1.5 MB/s → switch to Phase 2

## API Constraints

**IMPORTANT**: This project targets both Bun AND Node.js 18+ compatibility. Unlike typical Bun projects:

### APIs to Use
- `fetch` (native) - for HTTP requests
- `fs/promises` - for file operations (NOT `Bun.file()`)
- `node:readline` - for CLI input
- `process.stdout` - for progress display

### APIs to Avoid
- **Do NOT use `Bun.file()`, `Bun.write()`** - use `fs/promises` instead
- **Do NOT use external HTTP libraries** - native `fetch` is sufficient
- **Do NOT add dependencies** unless absolutely necessary

### Logger Utility

Always use the logger utility from `src/utils/logger.js`:

```typescript
import { log } from './utils/logger.js';

log('info message', 'info');
log('success message', 'success');
log('error message', 'error');
log('warning message', 'warn');
```

## Adding Features

When adding new download-related features:
1. Add constants to `src/constants.ts`
2. Add types to `src/types/api.ts`
3. Implement service logic in `src/services/`
4. Use the logger for all user-facing output
5. Use native Node.js APIs only

## Configuration

Optional `config.json` file:
```json
{
  "settings": {
    "pixeldrain_api_key": "your-api-key",
    "download_dir": "./downloads",
    "retries": 3,
    "retry_delay": 5,
    "min_speed": 1536,
    "temp_dir": "."
  }
}
```

**Settings:**
- `pixeldrain_api_key`: Your PixelDrain API key for authenticated downloads
- `retries`: Number of retry attempts (default: 3)
- `retry_delay`: Delay between retries in seconds (default: 5)
- `min_speed`: Minimum speed threshold in KB/s to trigger Phase 2 (default: 1536 KB/s = 1.5 MB/s)
- `temp_dir`: Directory for temporary/partial downloads (default: current directory ".")
- `download_dir`: Folder path to move downloaded files after successful download (relative or absolute)


## Build System

- **Tool**: tsup (TypeScript bundler)
- **Target**: Node.js 22+
- **Output**: Single ESM bundle with declarations
- **Shebang**: Auto-added for direct CLI execution
