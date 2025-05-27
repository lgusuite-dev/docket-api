#!/bin/bash

echo "✅ Tunnel is ready. Starting Node.js app..."

# Start your app
# Debug mode check
if [ "$NODE_DEBUG_MODE" = "true" ]; then
  echo "🛠 Starting Node in debug mode"
  node --inspect=0.0.0.0:9229 src/server.js
else
  echo "🚀 Starting Node normally"
  node src/server.js
fi
