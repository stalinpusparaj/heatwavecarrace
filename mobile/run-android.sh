#!/bin/sh
set -eu
cd "$(dirname "$0")"
if [ -z "${JAVA_HOME:-}" ] && [ -d '/Applications/Android Studio.app/Contents/jbr/Contents/Home' ]; then
    JAVA_HOME='/Applications/Android Studio.app/Contents/jbr/Contents/Home'
    export JAVA_HOME
fi
./gradlew :androidApp:assembleDebug
adb -s "${ANDROID_SERIAL:-emulator-5554}" install -r androidApp/build/outputs/apk/debug/androidApp-debug.apk
adb -s "${ANDROID_SERIAL:-emulator-5554}" shell am start -n com.gemmyapps.RUNROAD/com.stalinpusparaj.heatwave.MainActivity
