#!/bin/bash
set -e
source "$(cd "$(dirname "$0")" && pwd)/scripts/env.sh"
if [ ! -d node_modules ]; then npm ci --legacy-peer-deps --no-audit --no-fund; fi
if ! command -v adb >/dev/null 2>&1; then echo 'Android SDK platform-tools bulunamadı.'; exit 1; fi
if ! adb devices | grep -q '[[:space:]]device$'; then
 "$ANDROID_HOME/emulator/emulator" -avd Medium_Phone_API_37.0 > "${TMPDIR:-/tmp}/betleriz-emulator.log" 2>&1 &
 echo 'Emülatör bekleniyor…'
 # Do not wait forever if emulator startup fails.
 for BETLERIZ_TRY in {1..120}; do
  if adb devices | grep -q '[[:space:]]device$'; then break; fi
  sleep 1
 done
fi
if ! adb devices | grep -q '[[:space:]]device$'; then echo 'Emülatör bağlanamadı. Android Studio Device Manager ile açın.'; exit 1; fi
BETLERIZ_SERIAL="$(adb devices | awk 'NR>1 && $2=="device" {print $1; exit}')"
adb -s "$BETLERIZ_SERIAL" reverse tcp:8082 tcp:8082
if ! curl -fsS --noproxy '*' http://127.0.0.1:8082/status 2>/dev/null | grep -q 'packager-status:running'; then
 open -a Terminal "$BETLERIZ_ROOT/START_METRO.command"
fi
for BETLERIZ_TRY in {1..90}; do
 if curl -fsS --noproxy '*' http://127.0.0.1:8082/status 2>/dev/null | grep -q 'packager-status:running'; then break; fi
 sleep 1
done
if ! curl -fsS --noproxy '*' http://127.0.0.1:8082/status 2>/dev/null | grep -q 'packager-status:running'; then echo 'Metro açılamadı. START_METRO.command çıktısını kontrol edin.'; exit 1; fi
chmod +x android/gradlew
npm run android -- --no-packager --port 8082 --deviceId "$BETLERIZ_SERIAL"
