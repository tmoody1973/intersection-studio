FROM nousresearch/hermes-agent:latest

# Install Node.js for the routing proxy
RUN apt-get update && apt-get install -y curl && \
    curl -fsSL https://deb.nodesource.com/setup_22.x | bash - && \
    apt-get install -y nodejs && \
    apt-get clean && rm -rf /var/lib/apt/lists/*

# Create directories
RUN mkdir -p /opt/studio/souls /opt/studio/scripts /opt/studio/skills /opt/studio/plugins

# Copy soul files (SOUL.md per agent)
COPY souls/ /opt/studio/souls/

# Copy routing proxy and startup scripts
COPY scripts/ /opt/studio/scripts/
RUN chmod +x /opt/studio/scripts/start.sh

# Copy Bumwad methodology skills
COPY skills/ /opt/studio/skills/

# Copy studio-dashboard plugin
COPY plugins/studio-dashboard/ /opt/studio/plugins/studio-dashboard/

WORKDIR /root

ENTRYPOINT ["/opt/studio/scripts/start.sh"]
