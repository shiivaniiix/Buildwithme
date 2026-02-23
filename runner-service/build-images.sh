#!/bin/bash

# Build Docker images for code execution

echo "Building Docker images for code execution..."

docker build -f Dockerfile.python -t runner-python .
docker build -f Dockerfile.node -t runner-node .
docker build -f Dockerfile.c -t runner-c .
docker build -f Dockerfile.cpp -t runner-cpp .
docker build -f Dockerfile.java -t runner-java .

echo "All images built successfully!"

