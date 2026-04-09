#!/bin/bash
set -e

echo "=== Intersection Studio Hermes Deploy ==="
echo "Starting at $(date -u)"

# Hermes stores profiles at ~/.hermes/profiles/ (NOT /opt/data/profiles/)
HERMES_HOME="${HOME}/.hermes"
PROFILE_DIR="${HERMES_HOME}/profiles/ceo"
SETUP_MARKER="/opt/data/.setup-complete"

# First boot: create profile and write configs
if [ ! -f "$SETUP_MARKER" ]; then
  echo "First boot detected. Setting up profiles..."

  echo "Creating CEO profile..."
  hermes profile create ceo

  # Wait for profile directory to exist
  sleep 1

  # Write .env directly to the profile directory
  echo "Writing CEO .env to ${PROFILE_DIR}/.env"
  cat > "${PROFILE_DIR}/.env" << EOF
OPENROUTER_API_KEY=${OPENROUTER_API_KEY}
API_SERVER_ENABLED=true
API_SERVER_PORT=8650
API_SERVER_HOST=0.0.0.0
API_SERVER_KEY=${STUDIO_API_KEY}
EOF

  # Write config.yaml
  echo "Writing CEO config.yaml"
  cat > "${PROFILE_DIR}/config.yaml" << EOF
model:
  provider: openrouter
  model: anthropic/claude-sonnet-4
terminal:
  backend: local
compression:
  enabled: true
  threshold: 0.50
EOF

  # Copy SOUL.md
  echo "Copying CEO SOUL.md"
  cp /opt/studio/souls/ceo.md "${PROFILE_DIR}/SOUL.md"

  touch "$SETUP_MARKER"
  echo "Setup complete."
else
  echo "Setup already complete, skipping profile creation."
fi

# Start the routing proxy (lightweight Node.js server on port 3000)
echo "Starting routing proxy on port 3000..."
node /opt/studio/scripts/proxy.mjs &
PROXY_PID=$!

# Start the CEO gateway (blocking — keeps container alive)
echo "Starting CEO gateway on port 8650..."
hermes -p ceo gateway run
