#!/bin/bash
set -e

# Create unique results directory using timestamp and task ID
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
TASK_ID=$1
RESULTS_DIR="results/${TIMESTAMP}_${TASK_ID}"

# Create the directory
mkdir -p "$RESULTS_DIR"

# Run the container
docker run --rm \
  -e ANTHROPIC_API_KEY="your-key" \
  -e ANTHROPIC_BASE_URL="your-url" \
  -e TASK_ID="$TASK_ID" \
  -e TASK_PROMPT="$2" \
  -e DEBUG=false \
  -e RESULTS_DIR="/app/results" \
  -v "$(pwd)/$RESULTS_DIR:/app/results" \
  --shm-size=1gb \
  eko-task-runner
