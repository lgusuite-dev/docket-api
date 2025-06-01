#!/bin/bash

# Start the SSH tunnel in the background but keep it running
# autossh -i /root/.ssh/key.pem \
#   -L 27017:localhost:27017 \
#   ubuntu@47.128.230.76 \
#   -o StrictHostKeyChecking=no \
#   -o GSSAPIAuthentication=no \
#   -o ServerAliveInterval=30 \
#   -o ServerAliveCountMax=3 \
#   -N -f

# echo "🔌 SSH tunnel started in background"

# Wait until port is ready
# MAX_WAIT=30
# WAITED=0
# echo "⏳ Waiting for tunnel..."

# # Check port 27017
# while ! nc -zv localhost 27017 2>/dev/null; do
#   sleep 1
#   WAITED=$((WAITED + 1))
#   if [ "$WAITED" -ge "$MAX_WAIT" ]; then
#     echo "❌ Timeout: Tunnel not ready after $MAX_WAIT seconds"
#     exit 1
#   fi
# done

# echo "✅ Tunnel is ready. Starting Node.js app..."

# Start your app
# Debug mode check
if [ "$NODE_DEBUG_MODE" = "true" ]; then
  echo "🛠 Starting Node in debug mode"
  node --inspect=0.0.0.0:9229 server.js
else
  echo "🚀 Starting Node normally 1.0.2"
  node server.js
fi