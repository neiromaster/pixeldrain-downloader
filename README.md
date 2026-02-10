# pixeldrain-downloader

CLI tool for downloading files from PixelDrain with automatic retry logic and speed monitoring.

## Features

- **Two-phase download**: First tries without API key, then falls back to API key if needed
- **Speed monitoring**: Detects slow downloads (< 1.5 MB/s) using 10-second sliding window
- **Progress tracking**: Real-time progress bar with speed display
- **Retry logic**: Configurable retries with delays
- **Zero dependencies**: Uses native Node.js APIs only
- **Cross-platform**: Works with both Bun and Node.js 18+

## Installation

```bash
bun install
bun run build
```

## Configuration

Create a `config.json` file in the project root:

```json
{
  "settings": {
    "pixeldrain_api_key": "your-api-key-here",
    "retries": 3,
    "retry_delay": 5,
    "min_speed": 1536
  }
}
```

See `config.json.example` for a template.

## Usage

### Interactive CLI

```bash
bun run start
# Or after building:
./dist/index.js
```

Enter a PixelDrain URL when prompted:
```
Enter PixelDrain file URL: https://pixeldrain.com/u/FILE_ID
```

### As a Library

```typescript
import { downloadWithRetry } from './services/downloader.js';

const success = await downloadWithRetry(
  'file-id',
  'api-key', // optional
  3, // retries
  5 // retry delay in seconds
);
```

## Download Behavior

### Phase 1: Download without API key
- Downloads file without authentication
- Monitors speed using 10-second sliding window
- If max speed in any 10s window < 1.5 MB/s → switches to Phase 2
- Retries on failure

### Phase 2: Download with API key
- Uses API key for authentication
- Higher speed limits
- Retries on failure

### Exit Codes
- `0`: Download successful
- `1`: Download failed

## Development

```bash
# Build
bun run build

# Run linter
bun run lint

# Format code
bun run format

# Type check
bun run typecheck
```

## Project Structure

```
src/
├── index.ts                 # CLI entry point
├── constants.ts             # Constants and thresholds
├── config/
│   ├── loader.ts           # JSON config loader
│   └── schema.ts           # Type definitions
├── services/
│   ├── pixeldrain.ts       # PixelDrain API integration
│   └── downloader.ts       # Download orchestration
└── utils/
    ├── progress.ts         # Progress bar
    ├── http.ts             # HTTP utilities
    └── logger.ts           # Colored logging
```

## License

MIT
