#!/bin/bash
# Clean up old lock files
rm -f /tmp/.X99-lock

echo "[Entrypoint] Starting Xvfb on :99..."
Xvfb :99 -ac -screen 0 1280x1024x24 > /dev/null 2>&1 &
export DISPLAY=:99

# Wait a moment for Xvfb to be ready
sleep 2

echo "[Entrypoint] Starting Stremio Addon..."
exec node stremio_addon.js
