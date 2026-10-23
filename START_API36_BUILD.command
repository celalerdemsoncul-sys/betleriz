#!/bin/bash
set -euo pipefail
source "$(cd "$(dirname "$0")" && pwd)/scripts/env.sh"
BETLERIZ_RUNTIME="$(dirname "$BETLERIZ_ROOT")/runtime"
if [ -f "$BETLERIZ_RUNTIME/android-sdk/platforms/android-36/android.jar" ]; then
 export ANDROID_HOME="$BETLERIZ_RUNTIME/android-sdk"
fi
export PATH="${JAVA_HOME:+$JAVA_HOME/bin:}$ANDROID_HOME/platform-tools:$PATH"
if [ -x "$BETLERIZ_RUNTIME/gradle-8.11.1/bin/gradle" ]; then
 BETLERIZ_GRADLE="$BETLERIZ_RUNTIME/gradle-8.11.1/bin/gradle"
 export GRADLE_USER_HOME="$BETLERIZ_RUNTIME/gradle-api36"
else
 BETLERIZ_GRADLE="$BETLERIZ_ROOT/android/gradlew"
fi
mkdir -p "$BETLERIZ_ROOT/outputs"
if ! adb devices | grep -q '[[:space:]]device$'; then
 echo 'Emülatörü Android Studio Device Manager ile açın, sonra bu dosyayı yeniden çalıştırın.'
 exit 1
fi
"$BETLERIZ_GRADLE" -p "$BETLERIZ_ROOT/android" :app:installDebug -PreactNativeArchitectures=arm64-v8a -PreactNativeDevServerPort=8082 --console=plain 2>&1 | tee "$BETLERIZ_ROOT/outputs/api36-build.log"
BETLERIZ_SERIAL="$(adb devices | awk 'NR>1 && $2=="device" {print $1; exit}')"
adb -s "$BETLERIZ_SERIAL" reverse tcp:8082 tcp:8082
adb -s "$BETLERIZ_SERIAL" shell am force-stop com.betleriz.app
adb -s "$BETLERIZ_SERIAL" shell am start -n com.betleriz.app/.MainActivity
adb -s "$BETLERIZ_SERIAL" shell dumpsys package com.betleriz.app | grep -E 'versionName=|versionCode='
echo 'API 36 derlemesi ve kurulum tamamlandı. Açılış görünümünü kontrol edin.'
