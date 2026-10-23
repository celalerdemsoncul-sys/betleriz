#!/bin/bash
set -e
source "$(cd "$(dirname "$0")" && pwd)/scripts/env.sh"
if [ ! -d node_modules ]; then npm ci --legacy-peer-deps --no-audit --no-fund; fi
node scripts/serve-preview.cjs
