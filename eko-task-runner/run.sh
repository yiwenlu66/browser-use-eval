#!/bin/bash
set -e

# Ensure log directory exists
mkdir -p $RESULTS_DIR/logs

# Run the command and save outputs
yarn tsx main.ts > >(tee "$RESULTS_DIR/logs/stdout.log") 2> >(tee "$RESULTS_DIR/logs/stderr.log" >&2)
