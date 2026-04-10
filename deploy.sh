#!/usr/bin/env bash
set -euo pipefail

REMOTE_USER="${REMOTE_USER:?Set REMOTE_USER}"
REMOTE_HOST="${REMOTE_HOST:?Set REMOTE_HOST}"
REMOTE_PATH="${REMOTE_PATH:?Set REMOTE_PATH}"

echo "Building project..."
npm run build

echo "Deploying to server..."
rsync -avz --delete out/ "${REMOTE_USER}@${REMOTE_HOST}:${REMOTE_PATH}"

echo "Deployment complete."
