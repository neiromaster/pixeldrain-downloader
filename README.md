# pixeldrain-downloader

CLI tool for downloading files from PixelDrain with automatic retry logic and speed monitoring.

## Features

- **Two-phase download**: First tries without API key, then falls back to API key if needed
- **Speed monitoring**: Detects slow downloads (< 1.5 MB/s) using 10-second sliding window
- **Progress tracking**: Real-time progress bar with speed display in MB/s
- **Retry logic**: Configurable retries with delays
- **Zero dependencies**: Uses native Node.js APIs only
- **Cross-platform**: Works with both Bun and Node.js 18+

## Usage

### Via npx / bunx (No installation required)

```bash
npx pixeldrain-downloader
# or
bunx pixeldrain-downloader
```

### Via mise (Recommended for mise users)

```bash
mise use -g npm:pixeldrain-downloader@latest
pixeldrain-downloader
```

### Global Installation

```bash
# Using npm
npm install -g pixeldrain-downloader

# Using bun
bun install -g pixeldrain-downloader
```

Then run:
```bash
pixeldrain-downloader
```

### From source

```bash
git clone https://github.com/yourusername/pixeldrain-downloader.git
cd pixeldrain-downloader
bun install
bun run build
./dist/index.js
```

## Configuration

Create a `config.json` file in the current directory or `~/.config/pixeldrain-downloader/`:

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

**Settings:**
- `pixeldrain_api_key`: Your PixelDrain API key for authenticated downloads (get it at https://pixeldrain.com/user/api_keys)
- `retries`: Number of retry attempts (default: 3)
- `retry_delay`: Delay between retries in seconds (default: 5)
- `min_speed`: Minimum speed threshold in KB/s to trigger Phase 2 (default: 1536 KB/s = 1.5 MB/s)

See `config.json.example` for a template.

## How It Works

### Phase 1: Download without API key
- Downloads file without authentication
- Monitors speed using 10-second sliding window
- If max speed in any 10s window < 1.5 MB/s → switches to Phase 2
- Retries on failure

### Phase 2: Download with API key
- Uses API key for authentication
- Higher speed limits (effectively unlimited)
- Retries on failure

### Exit Codes
- `0`: Download successful
- `1`: Download failed

## Development

```bash
# Install dependencies
bun install

# Build
bun run build

# Run CLI
bun run start

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
