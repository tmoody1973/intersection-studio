#!/bin/bash
set -e

echo "=== Intersection Studio Hermes Deploy ==="
echo "Starting at $(date -u)"

# --- Agent definitions ---
# Format: "profile-id:port:model:toolsets"
# Toolsets: web,terminal,file,browser,memory,delegation,skills,vision,todo,cronjob
AGENTS=(
  "ceo:8650:anthropic/claude-sonnet-4:web,memory,delegation,skills,todo"
  "creative-director:8651:anthropic/claude-sonnet-4:web,memory,delegation,skills,vision"
  "engineering-lead:8652:anthropic/claude-sonnet-4:web,terminal,file,memory,delegation,skills"
  "content-lead:8653:anthropic/claude-sonnet-4:web,memory,delegation,skills"
  "project-manager:8654:anthropic/claude-sonnet-4:web,memory,delegation,skills,todo,cronjob"
  "visual-designer:8655:anthropic/claude-sonnet-4:web,memory,skills,vision"
  "frontend-dev:8656:meta-llama/llama-3.3-70b-instruct:terminal,file,memory,skills"
  "backend-dev:8657:meta-llama/llama-3.3-70b-instruct:terminal,file,memory,skills"
  "content-writer:8658:meta-llama/llama-3.3-70b-instruct:web,memory,skills"
  "social-media:8659:meta-llama/llama-3.3-70b-instruct:web,memory,skills"
  "qa-reviewer:8660:meta-llama/llama-3.3-70b-instruct:web,terminal,browser,memory,skills"
  "data-analyst:8661:meta-llama/llama-3.3-70b-instruct:web,terminal,memory,skills"
)

# --- Persistent volume setup ---
# The official Hermes Docker image uses /opt/data as HERMES_HOME.
# Our Fly.io volume is mounted at /opt/data.
# Profiles go to /opt/data/profiles/<name>/ automatically.
# No symlinks needed — this is how Hermes Docker works by default.
echo "Data dir: /opt/data (Fly.io persistent volume)"
echo "Profiles dir: /opt/data/profiles/"
ls /opt/data/profiles/ 2>/dev/null || echo "  (empty — first boot)"

# --- GBrain initialization ---
# GBrain uses ~/.gbrain/ by default. Symlink to persistent volume so data
# survives across deploys.
echo "Initializing GBrain..."
BRAIN_PERSIST="/opt/data/gbrain"
mkdir -p "$BRAIN_PERSIST"
if [ ! -L "/root/.gbrain" ]; then
  rm -rf /root/.gbrain
  ln -s "$BRAIN_PERSIST" /root/.gbrain
  echo "  Symlinked ~/.gbrain -> $BRAIN_PERSIST"
fi
if [ ! -f "$BRAIN_PERSIST/brain.pglite/PG_VERSION" ]; then
  echo "First boot: initializing brain..."
  gbrain init 2>/dev/null || echo "WARNING: gbrain init failed"
else
  echo "Brain exists at $BRAIN_PERSIST"
fi
gbrain doctor 2>/dev/null && echo "Brain health: OK" || echo "WARNING: Brain health check failed"

SETUP_MARKER="/opt/data/.setup-complete-v2"

# If marker exists but ANY profile is missing, force re-setup
_MISSING=0
for agent_def in "${AGENTS[@]}"; do
  IFS=':' read -r profile port model toolsets <<< "$agent_def"
  if [ ! -d "/opt/data/profiles/$profile" ]; then
    echo "Profile $profile missing despite setup marker."
    _MISSING=1
  fi
done
if [ -f "$SETUP_MARKER" ] && [ "$_MISSING" -eq 1 ]; then
  echo "Re-running setup due to missing profiles..."
  rm -f "$SETUP_MARKER"
fi

# --- First boot: create all profiles ---
if [ ! -f "$SETUP_MARKER" ]; then
  echo "First boot detected. Setting up ${#AGENTS[@]} agent profiles..."

  for agent_def in "${AGENTS[@]}"; do
    IFS=':' read -r profile port model toolsets <<< "$agent_def"
    PROFILE_DIR="/opt/data/profiles/$profile"

    echo "Creating profile: $profile (port $port, model $model, tools: $toolsets)"
    hermes profile create "$profile" 2>/dev/null || echo "  Profile $profile already exists, continuing..."
    sleep 0.5

    # Write .env
    cat > "${PROFILE_DIR}/.env" << ENVEOF
OPENROUTER_API_KEY=${OPENROUTER_API_KEY}
API_SERVER_ENABLED=true
API_SERVER_PORT=${port}
API_SERVER_HOST=0.0.0.0
API_SERVER_KEY=${STUDIO_API_KEY}
CONVEX_SITE_URL=${CONVEX_SITE_URL}
HERMES_CALLBACK_SECRET=${HERMES_CALLBACK_SECRET}
GATEWAY_ALLOW_ALL_USERS=true
ENVEOF

    # Build config.yaml — model + terminal only.
    # Toolsets are configured in the GLOBAL config.yaml (gateway reads that, not profile configs)
    {
      echo "model:"
      echo "  provider: openrouter"
      echo "  model: ${model}"
      echo "terminal:"
      echo "  backend: local"
      echo "compression:"
      echo "  enabled: true"
      echo "  threshold: 0.50"
    } > "${PROFILE_DIR}/config.yaml"

    # Copy SOUL.md
    SOUL_FILE="/opt/studio/souls/${profile}.md"
    if [ -f "$SOUL_FILE" ]; then
      cp "$SOUL_FILE" "${PROFILE_DIR}/SOUL.md"
      echo "  Copied SOUL.md for $profile"
    else
      echo "  WARNING: No soul file found at $SOUL_FILE"
    fi
  done

  touch "$SETUP_MARKER"
  echo "Setup complete for ${#AGENTS[@]} agents."
else
  echo "Setup already complete, skipping profile creation."
fi

# Always install/update plugin into EVERY profile directory
# hermes -p <name> sets HERMES_HOME to the profile dir, so plugins
# must be inside each profile for the gateway to find them.
echo "Installing studio-dashboard plugin into all profiles..."
for agent_def in "${AGENTS[@]}"; do
  IFS=':' read -r profile port model toolsets <<< "$agent_def"
  PROFILE_PLUGIN_DIR="/opt/data/profiles/$profile/plugins"
  mkdir -p "$PROFILE_PLUGIN_DIR"
  rm -rf "$PROFILE_PLUGIN_DIR/studio-dashboard"
  cp -r /opt/studio/plugins/studio-dashboard "$PROFILE_PLUGIN_DIR/"
done
echo "  Plugin installed in ${#AGENTS[@]} profiles"

# Write config.yaml into EVERY profile directory
# hermes -p <name> reads config from the profile's HERMES_HOME
echo "Writing config.yaml into all profiles..."
for agent_def in "${AGENTS[@]}"; do
  IFS=':' read -r profile port model toolsets <<< "$agent_def"
  PROFILE_DIR="/opt/data/profiles/$profile"

  {
    echo "model:"
    echo "  provider: openrouter"
    echo "  model: ${model}"
    echo "terminal:"
    echo "  backend: local"
    echo "compression:"
    echo "  enabled: true"
    echo "  threshold: 0.50"
    echo "platform_toolsets:"
    echo "  api_server:"
    IFS=',' read -ra TOOL_ARRAY <<< "$toolsets"
    for tool in "${TOOL_ARRAY[@]}"; do
      echo "    - ${tool}"
    done
    echo "    - studio"
    echo "skills:"
    echo "  external_dirs:"
    echo "    - /opt/studio/skills"
  } > "${PROFILE_DIR}/config.yaml"
done
echo "  Config written for ${#AGENTS[@]} profiles"

# --- Verify profiles ---
echo ""
echo "Verifying profiles..."
MISSING=0
for agent_def in "${AGENTS[@]}"; do
  IFS=':' read -r profile port model <<< "$agent_def"
  if [ ! -d "/opt/data/profiles/$profile" ]; then
    echo "  ERROR: Missing profile $profile"
    MISSING=$((MISSING + 1))
  fi
done

if [ "$MISSING" -gt 0 ]; then
  echo "ERROR: $MISSING profiles missing. Listing available:"
  ls -la "/opt/data/profiles/" 2>/dev/null || echo "  No profiles directory"
  exit 1
fi
echo "All ${#AGENTS[@]} profiles verified."

# --- Start routing proxy ---
echo ""
echo "Starting routing proxy on port 3000..."
node /opt/studio/scripts/proxy.mjs &
PROXY_PID=$!
echo "Proxy started (PID $PROXY_PID)"

# --- Start agent gateways ---
# Start all non-CEO agents in background
echo ""
echo "Starting agent gateways..."
PIDS=()

for agent_def in "${AGENTS[@]}"; do
  IFS=':' read -r profile port model <<< "$agent_def"

  # Skip CEO — we start it last as the foreground process
  if [ "$profile" = "ceo" ]; then
    continue
  fi

  echo "  Starting $profile on port $port..."
  hermes -p "$profile" gateway run &
  PIDS+=($!)
  sleep 1  # stagger startup to avoid resource contention
done

echo ""
echo "Started ${#PIDS[@]} background gateways."
echo "Starting CEO gateway on port 8650 (foreground — keeps container alive)..."

# CEO runs in foreground — container stays alive as long as this runs
hermes -p ceo gateway run
