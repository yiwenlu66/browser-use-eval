#!/bin/bash
set -e

# Create a temporary build context
BUILD_DIR=$(mktemp -d)
echo "Using temporary build directory: $BUILD_DIR"

# Copy Eko source
echo "Copying Eko source..."
cp -r ../eko $BUILD_DIR/eko

# Copy task runner files
echo "Copying task runner files..."
cp Dockerfile $BUILD_DIR/
cp run.sh $BUILD_DIR/
cp package.json yarn.lock main.ts $BUILD_DIR/
cp .dockerignore $BUILD_DIR/

# Build the image
echo "Building Docker image..."
docker build -t eko-task-runner $BUILD_DIR

# Clean up
echo "Cleaning up..."
rm -rf $BUILD_DIR

echo "Build complete!"
