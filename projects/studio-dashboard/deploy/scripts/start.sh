#!/bin/bash
set -e

echo "=== Intersection Studio Hermes Deploy ==="
echo "Starting at $(date -u)"

# Hermes profiles ALWAYS go to ~/.hermes/profiles/ (hardcoded in source).
# HERMES_HOME doesn't change profile location (issue #892).
# Solution: symlink ~/.hermes to persistent volume so profiles survive restarts.
PERSISTENT_HERMES="/opt/data/hermes"
mkdir -p "$PERSISTENT_HERMES"

if [ -L "$HOME/.hermes" ]; then
  echo "Symlink already exists: $HOME/.hermes -> $PERSISTENT_HERMES"
elif [ -d "$HOME/.hermes" ]; then
  echo "Moving existing ~/.hermes to persistent volume..."
  cp -a "$HOME/.hermes/." "$PERSISTENT_HERMES/"
  rm -rf "$HOME/.hermes"
  ln -s "$PERSISTENT_HERMES" "$HOME/.hermes"
else
  ln -s "$PERSISTENT_HERMES" "$HOME/.hermes"
  echo "Created symlink: $HOME/.hermes -> $PERSISTENT_HERMES"
fi

PROFILE_DIR="$HOME/.hermes/profiles/ceo"
SETUP_MARKER="/opt/data/.setup-complete"

# If marker exists but profile doesn't, force re-setup
if [ -f "$SETUP_MARKER" ] && [ ! -d "$PROFILE_DIR" ]; then
  echo "Profile directory missing despite setup marker. Re-running setup..."
  rm -f "$SETUP_MARKER"
fi

# First boot: create profile and write configs
if [ ! -f "$SETUP_MARKER" ]; then
  echo "First boot detected. Setting up profiles..."

  echo "Creating CEO profile..."
  hermes profile create ceo 2>/dev/null || echo "Profile already exists, continuing..."
  sleep 1

  # Write .env — use placeholder + sed to avoid bash expansion of special chars
  echo "Writing CEO .env to ${PROFILE_DIR}/.env"
  cat > "${PROFILE_DIR}/.env" << 'ENVEOF'
OPENROUTER_API_KEY=__OPENROUTER_KEY__
API_SERVER_ENABLED=true
API_SERVER_PORT=8650
API_SERVER_HOST=0.0.0.0
API_SERVER_KEY=__STUDIO_KEY__
ENVEOF

  sed -i "s|__OPENROUTER_KEY__|${OPENROUTER_API_KEY}|g" "${PROFILE_DIR}/.env"
  sed -i "s|__STUDIO_KEY__|${STUDIO_API_KEY}|g" "${PROFILE_DIR}/.env"

  echo "Writing CEO config.yaml"
  cat > "${PROFILE_DIR}/config.yaml" << 'EOF'
model:
  provider: openrouter
  model: anthropic/claude-sonnet-4
terminal:
  backend: local
compression:
  enabled: true
  threshold: 0.50
EOF

  echo "Copying CEO SOUL.md"
  cp /opt/studio/souls/ceo.md "${PROFILE_DIR}/SOUL.md"

  touch "$SETUP_MARKER"
  echo "Setup complete."
else
  echo "Setup already complete, skipping profile creation."
fi

# Verify profile exists before starting
if [ ! -d "$PROFILE_DIR" ]; then
  echo "ERROR: Profile directory $PROFILE_DIR does not exist after setup!"
  ls -la "$HOME/.hermes/" 2>/dev/null || echo "~/.hermes does not exist"
  ls -la "$PERSISTENT_HERMES/" 2>/dev/null || echo "Persistent dir empty"
  exit 1
fi

echo "Profile verified at $PROFILE_DIR"
echo "Contents:"
ls -la "$PROFILE_DIR/"

# Start the routing proxy
echo "Starting routing proxy on port 3000..."
node /opt/studio/scripts/proxy.mjs &

# Start the CEO gateway (blocking — keeps container alive)
echo "Starting CEO gateway on port 8650..."
hermes -p ceo gateway run
