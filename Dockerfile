FROM node:14.18.3-bullseye-slim

# Install Node.js 18
RUN apt-get update && apt-get install -y \
    curl \
    netcat-openbsd \
    autossh \
    && apt-get clean \
    && rm -rf /var/lib/apt/lists/*

# Set working directory
WORKDIR /app

# Copy and install app dependencies
COPY . .

# Copy app files
RUN npm install

# Setup SSH keys
COPY key.pem /root/.ssh/key.pem
RUN curl -o /root/.ssh/rds-combined-ca-bundle.pem https://truststore.pki.rds.amazonaws.com/global/global-bundle.pem \
    && chmod 400 /root/.ssh/key.pem /root/.ssh/rds-combined-ca-bundle.pem \
    && chmod +x /app/start-tunnel.sh

# Set proper StrictHostKeyChecking for SSH
RUN mkdir -p /root/.ssh && echo "StrictHostKeyChecking no" > /root/.ssh/config && chmod 600 /root/.ssh/config

EXPOSE 3000 9229

# Create a healthcheck to ensure the tunnel and app are running
HEALTHCHECK --interval=30s --timeout=5s --start-period=5s --retries=3 \
  CMD nc -z localhost 3000 || exit 1

CMD ["sh", "start-tunnel.sh"]
