#!/bin/sh
# Creates the Play upload key in mobile/keys/ (git-ignored). keytool asks for the passwords;
# store them in a password manager and in mobile/release.properties. Losing this key blocks updates
# until Google resets it, so back the .jks file up somewhere safe and private.
set -eu
cd "$(dirname "$0")/../mobile"
if [ -z "${JAVA_HOME:-}" ] && [ -d '/Applications/Android Studio.app/Contents/jbr/Contents/Home' ]; then
    JAVA_HOME='/Applications/Android Studio.app/Contents/jbr/Contents/Home'
fi
KEYTOOL="${JAVA_HOME:+$JAVA_HOME/bin/}keytool"
mkdir -p keys
if [ -e keys/runroad-upload.jks ]; then echo "keys/runroad-upload.jks already exists; not overwriting." >&2; exit 1; fi
"$KEYTOOL" -genkeypair -v -keystore keys/runroad-upload.jks -alias runroad-upload \
    -keyalg RSA -keysize 4096 -validity 10000
[ -f release.properties ] || cp release.properties.example release.properties
echo "Created mobile/keys/runroad-upload.jks. Now fill in mobile/release.properties."
