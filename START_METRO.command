#!/bin/bash
set -e
source "$(cd "$(dirname "$0")" && pwd)/scripts/env.sh"
if [ ! -d node_modules ]; then npm ci --legacy-peer-deps --no-audit --no-fund; fi
# A second Metro instance is not needed.
if curl -fsS --noproxy '*' http://127.0.0.1:8082/status 2>/dev/null | grep -q 'packager-status:running'; then
 echo 'Metro zaten 8082 portunda çalışıyor.'; exit 0
fi
ulimit -n 65536 2>/dev/null || true
npm start -- --port 8082 "$@"
