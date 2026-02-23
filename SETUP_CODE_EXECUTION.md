# Secure Multi-Language Code Execution Setup Guide

## Overview

This implementation provides secure, sandboxed code execution for Python, JavaScript, C, C++, and Java using Docker containers.

## Architecture

```
Frontend (Next.js)
  ↓
API Route: /api/projects/[id]/run
  ↓
Runner Service (Node.js on port 3001)
  ↓
Docker Containers (isolated execution)
```

## Prerequisites

1. **Docker** must be installed and running
2. **Node.js** 18+ for the runner service
3. **PostgreSQL** database (for File model storage)

## Setup Steps

### 1. Database Migration

Run Prisma migration to add File model:

```bash
npx prisma migrate dev --name add_file_model
npx prisma generate
```

### 2. Build Docker Images

Navigate to `runner-service` directory:

```bash
cd runner-service
npm install
chmod +x build-images.sh
./build-images.sh
```

Or manually build each image:

```bash
docker build -f Dockerfile.python -t runner-python .
docker build -f Dockerfile.node -t runner-node .
docker build -f Dockerfile.c -t runner-c .
docker build -f Dockerfile.cpp -t runner-cpp .
docker build -f Dockerfile.java -t runner-java .
```

### 3. Start Runner Service

```bash
cd runner-service
npm start
```

The service will run on `http://localhost:3001` by default.

### 4. Configure Environment Variables

Add to `.env`:

```env
RUNNER_SERVICE_URL=http://localhost:3001
```

### 5. Start Next.js Application

```bash
npm run dev
```

## Security Features

- **5-second execution timeout** - Prevents infinite loops
- **256MB memory limit** - Prevents memory exhaustion
- **0.5 CPU limit** - Prevents CPU abuse
- **No network access** - Isolated execution
- **Read-only file system** - Cannot modify host files
- **Automatic cleanup** - Containers removed after execution

## Supported Languages

| Language | Docker Image | Entry Point Detection |
|----------|-------------|----------------------|
| Python | runner-python | `main.py` or first `.py` file |
| JavaScript | runner-node | `main.js` or first `.js` file |
| C | runner-c | `main.c` or first `.c` file |
| C++ | runner-cpp | `main.cpp` or first `.cpp` file |
| Java | runner-java | `Main.java` or first `.java` file |

## File Structure Support

- **Multi-file projects** - Supports nested folders
- **Path-based organization** - Files stored with full path (e.g., `src/main.py`)
- **Folder support** - `isFolder` flag in File model

## API Usage

### Frontend → API Route

```typescript
POST /api/projects/[id]/run
{
  "language": "python",
  "code": "print('Hello')",  // Single file
  "entryFileName": "main.py",
  // OR for multi-file:
  "files": [
    { "name": "main.py", "content": "..." },
    { "name": "utils/helper.py", "content": "..." }
  ]
}
```

### API Route → Runner Service

```typescript
POST http://localhost:3001/run
{
  "language": "python",
  "files": [
    { "path": "main.py", "content": "..." },
    { "path": "utils/helper.py", "content": "..." }
  ]
}
```

## Response Format

```json
{
  "state": "completed" | "failed",
  "stdout": "Output text",
  "stderr": "Error text",
  "exitCode": 0,
  "success": true,
  "executedAt": "2024-01-01T00:00:00.000Z"
}
```

## Testing

1. Create a project in the dashboard
2. Add files (Python, JavaScript, C, C++, or Java)
3. Click "Run" button
4. View output in terminal console

## Troubleshooting

### Runner service not starting
- Check Docker is running: `docker ps`
- Verify port 3001 is available
- Check logs: `cd runner-service && npm start`

### Docker images not found
- Build images: `./build-images.sh`
- Verify: `docker images | grep runner-`

### Execution timeout
- Code may contain infinite loop
- Increase timeout in `runner-service/index.js` (default: 5000ms)

### Permission errors
- Ensure Docker daemon is running
- Check Docker permissions: `docker ps`

## Production Deployment

1. Deploy runner service separately (e.g., separate server/container)
2. Update `RUNNER_SERVICE_URL` in production `.env`
3. Ensure Docker is available on runner service host
4. Consider using Docker-in-Docker or remote Docker socket
5. Add monitoring and logging
6. Implement rate limiting
7. Add authentication to runner service

## Next Steps

- [ ] Add MySQL preview support
- [ ] Implement file import/export
- [ ] Add execution history
- [ ] Implement code sharing
- [ ] Add collaborative editing

