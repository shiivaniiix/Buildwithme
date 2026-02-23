# Runner Service

Local development code execution service for Buildwithme.

## Setup

1. Install dependencies:
```bash
npm install
```

2. Start the service:
```bash
npm run dev
```

The service will start on `http://localhost:3001`

## API Endpoints

### POST /run

Execute code in a temporary directory.

**Request Body:**
```json
{
  "language": "python" | "javascript",
  "files": [
    {
      "path": "main.py",
      "content": "print('Hello, World!')"
    }
  ]
}
```

**Response:**
```json
{
  "success": true,
  "output": "Hello, World!",
  "error": null,
  "exitCode": 0
}
```

### GET /health

Health check endpoint.

**Response:**
```json
{
  "status": "ok",
  "service": "runner-service"
}
```

## Supported Languages

- **Python**: Executes `.py` files using `python` command
- **JavaScript**: Executes `.js` files using `node` command

## Features

- ✅ Temporary directory creation and cleanup
- ✅ Multi-file support with folder structure
- ✅ 5-second execution timeout
- ✅ stdout and stderr capture
- ✅ Exit code tracking
- ✅ Automatic cleanup of temp files

## Development

Keep this service running in a separate terminal while developing:

```bash
cd runner-service
npm run dev
```

Then start your Next.js app in another terminal:

```bash
npm run dev
```
