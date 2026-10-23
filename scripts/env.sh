#!/bin/bash
BETLERIZ_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
# Use an installed Node, or the runtime prepared in the original conversation.
if ! command -v node >/dev/null 2>&1; then
 BETLERIZ_NODE="/Users/ces/Documents/Codex/2026-10-14/new-chat-5/runtime/node-v22.23.3-darwin-arm64/bin"
 export PATH="$BETLERIZ_NODE:$PATH"
fi
if ! command -v node >/dev/null 2>&1; then
 echo 'Node.js 18+ gerekiyor. Resmi nodejs.org kurulumunu tamamlayın.'; exit 1
fi
if [ -x '/Users/ces/Documents/Codex/2026-10-14/new-chat-5/runtime/java17/Contents/Home/bin/java' ]; then
 export JAVA_HOME='/Users/ces/Documents/Codex/2026-10-14/new-chat-5/runtime/java17/Contents/Home'
else
 BETLERIZ_JAVA="$(/usr/libexec/java_home -v 17 2>/dev/null || true)"
 if [ -n "$BETLERIZ_JAVA" ]; then export JAVA_HOME="$BETLERIZ_JAVA"; fi
fi
export ANDROID_HOME="${ANDROID_HOME:-$HOME/Library/Android/sdk}"
export PATH="${JAVA_HOME:+$JAVA_HOME/bin:}$ANDROID_HOME/platform-tools:$PATH"
cd "$BETLERIZ_ROOT"
