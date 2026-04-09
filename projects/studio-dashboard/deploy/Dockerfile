FROM nousresearch/hermes-agent:latest

# Install Node.js for the routing proxy
RUN apt-get update && apt-get install -y curl && \
    curl -fsSL https://deb.nodesource.com/setup_22.x | bash - && \
    apt-get install -y nodejs && \
    apt-get clean && rm -rf /var/lib/apt/lists/*

# Create directories
RUN mkdir -p /opt/studio/souls /opt/studio/scripts

# Copy files
COPY souls/ /opt/studio/souls/
COPY scripts/ /opt/studio/scripts/
RUN chmod +x /opt/studio/scripts/start.sh

ENTRYPOINT ["/opt/studio/scripts/start.sh"]
