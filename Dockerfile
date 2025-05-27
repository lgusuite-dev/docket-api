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

EXPOSE 3000 9229

# Create a healthcheck to ensure the tunnel and app are running
HEALTHCHECK --interval=30s --timeout=5s --start-period=5s --retries=3 \
  CMD nc -z localhost 3000 || exit 1

CMD ["sh", "start-tunnel.sh"]
