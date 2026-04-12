FROM nousresearch/hermes-agent:latest

# Install Node.js for the routing proxy
RUN apt-get update && apt-get install -y curl && \
    curl -fsSL https://deb.nodesource.com/setup_22.x | bash - && \
    apt-get install -y nodejs && \
    apt-get clean && rm -rf /var/lib/apt/lists/*

# Install Bun for GBrain (Bun-native, needs unzip)
RUN apt-get update && apt-get install -y unzip && apt-get clean && rm -rf /var/lib/apt/lists/*
RUN curl -fsSL https://bun.sh/install | bash
ENV PATH="/root/.bun/bin:$PATH"

# Install GBrain (institutional brain)
RUN bun add -g github:garrytan/gbrain

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
