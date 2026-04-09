#!/bin/bash
set -e

echo "=== Intersection Studio Hermes Deploy ==="
echo "Starting at $(date -u)"

SETUP_MARKER="/opt/data/.setup-complete"

# First boot: create profiles and write configs
if [ ! -f "$SETUP_MARKER" ]; then
  echo "First boot detected. Setting up profiles..."

  # --- CEO Agent ---
  echo "Creating CEO profile..."
  hermes profile create ceo

  cat > /opt/data/profiles/ceo/.env << EOF
OPENROUTER_API_KEY=$OPENROUTER_API_KEY
API_SERVER_ENABLED=true
API_SERVER_PORT=8650
API_SERVER_HOST=0.0.0.0
API_SERVER_KEY=$STUDIO_API_KEY
EOF

  cat > /opt/data/profiles/ceo/config.yaml << EOF
model:
  provider: openrouter
  model: anthropic/claude-sonnet-4
terminal:
  backend: local
compression:
  enabled: true
  threshold: 0.50
EOF

  cp /opt/studio/souls/ceo.md /opt/data/profiles/ceo/SOUL.md

  touch "$SETUP_MARKER"
  echo "Setup complete."
fi

# Start the routing proxy (lightweight Node.js server on port 3000)
echo "Starting routing proxy on port 3000..."
node /opt/studio/scripts/proxy.mjs &
PROXY_PID=$!

# Start the CEO gateway (blocking — keeps container alive)
echo "Starting CEO gateway on port 8650..."
hermes -p ceo gateway run
