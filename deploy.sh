#!/usr/bin/env bash

set -euo pipefail

REMOTE_USER="cristilupchian"
REMOTE_HOST="s1058.use1.mysecurecloudhost.com"
REMOTE_PATH="~/terminal.cristilupchian.me/"

echo "Building project..."
npm run build

echo "Deploying to server..."
rsync -avz --delete out/ "${REMOTE_USER}@${REMOTE_HOST}:${REMOTE_PATH}"

echo "Deployment complete."
