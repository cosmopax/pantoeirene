#!/usr/bin/env bash
set -euo pipefail

# Pantoeirene Deployment Script

SITE_DIR="$(cd "$(dirname "$0")" && pwd)/site"

if [[ -f "deploy.env" ]]; then
  source deploy.env
else
  echo "Error: deploy.env file not found." >&2
  echo "Please create deploy.env with WEBROOT='/path/to/html' and SITE_URL='https://pantoeirene.org'" >&2
  exit 1
fi

if [[ -z "${WEBROOT:-}" ]]; then
  echo "Error: WEBROOT is not set in deploy.env." >&2
  exit 1
fi

if [[ ! -d "$WEBROOT" ]]; then
  echo "Error: Webroot directory does not exist: $WEBROOT" >&2
  exit 1
fi

if [[ ! -d "$SITE_DIR" ]]; then
  echo "Error: Site directory missing: $SITE_DIR" >&2
  exit 1
fi

echo "☮️ Deploying Pantoeirene to: $WEBROOT"
timestamp=$(date +%Y%m%d-%H%M%S)
quarantine="$WEBROOT/__quarantine__/$timestamp"

echo "  - Quarantining old files..."
mkdir -p "$quarantine"

shopt -s dotglob nullglob
for item in "$WEBROOT"/*; do
  base=$(basename "$item")
  if [[ "$base" == "__quarantine__" ]]; then
    continue
  fi
  mv "$item" "$quarantine/"
done
shopt -u dotglob nullglob

echo "  - Copying new site..."
if command -v rsync >/dev/null 2>&1; then
  if ! rsync -av "$SITE_DIR/" "$WEBROOT/"; then
      echo "Warning: rsync failed. Falling back to cp -a..."
      cp -R "$SITE_DIR/." "$WEBROOT/"
  fi
else
  cp -R "$SITE_DIR/." "$WEBROOT/"
fi

if [[ -n "${SITE_URL:-}" ]]; then
    echo "  - Verifying deployment..."
    status=$(curl -s -o /dev/null -w "%{http_code}" "$SITE_URL" || echo "FAIL")
    echo "    HTTP Status: $status"
    if [[ "$status" == "200" ]]; then
        echo "    ✅ SUCCESS - Peace is online!"
    else
        echo "    ⚠️ WARNING: Site might be down."
    fi
fi

echo "☮️ Deployment Complete."
