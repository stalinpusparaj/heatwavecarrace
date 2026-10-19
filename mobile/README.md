# Heatwave KMP mobile shell

A small native shell with bundled offline web assets. The Android debug APK is about 3.2 MB. It uses the platform WebView, AndroidX WebKit, and a Kotlin Multiplatform shared module; no Compose or embedded Chromium distribution is included.

## Android

Requirements: JDK 17+, Android SDK platform 37, current Android SDK tools. This checkout uses Kotlin 2.4.20, Android Gradle Plugin 9.4.1, and Gradle 9.8.0. `local.properties` is ignored; set `sdk.dir` to your SDK installation or use `ANDROID_HOME`.

```sh
cd mobile
./gradlew :androidApp:assembleDebug :shared:jvmTest
adb -s emulator-5554 install -r androidApp/build/outputs/apk/debug/androidApp-debug.apk
adb -s emulator-5554 shell am start -n com.gemmyapps.RUNROAD/com.stalinpusparaj.heatwave.MainActivity
```

On this Mac, prefix Gradle commands with:

```sh
JAVA_HOME='/Applications/Android Studio.app/Contents/jbr/Contents/Home' ./gradlew :androidApp:assembleDebug
```

The build copies the current repository `dist/` into the app automatically. Rebuild after web changes; no web assets are duplicated in source. It excludes artwork source files, docs, development tools, and test harnesses. The game runs at `https://appassets.androidplatform.net/assets/web/index.html`, which is served entirely by `WebViewAssetLoader`; no local server, hosted-site authentication, or INTERNET permission is needed.

Features: portrait/immersive layout; hardware-accelerated canvas; localStorage progress; native Back pauses a chase, then returns to the menu; app backgrounding pauses gameplay/audio; the renderer/timers stop while backgrounded; a reload screen handles WebView failures. Normal resumes keep the game's pause screen so the player can choose when to continue.

App ID: `com.gemmyapps.RUNROAD`. Android minimum SDK: 24. Debug WebView inspection is enabled only in debug builds. File/content URL access and mixed content are disabled. Bundled resource paths are restricted; external user-tapped HTTP(S) links open in the system browser. The Android app has no exposed JavaScript bridge.

Release builds enable shrinking/minification. Configure your own release signing before distributing a production APK/AAB; this task only creates a debug-signed installable build.

## Shared KMP and iOS

`shared/commonMain` contains the shared entry point, navigation policy, and pause/back scripts, consumed by Android. JVM tests verify bundled URL handling. Targets: Android, JVM tests, iOS arm64, iOS simulator arm64.

`shared/iosMain` supplies a WKWebView view-controller factory. `iosApp/Heatwave.xcodeproj` is a minimal UIKit host that builds the KMP framework and copies `dist/` into its app bundle. Open it in full Xcode, select a team for physical-device signing, set a JDK for Gradle, and run the Heatwave target. The iOS scaffold is not build-verified on this host: only Xcode Command Line Tools are installed, without the iOS SDK. iOS runtime/signing and pause/background behavior need validation on an iOS simulator/device.

Android native-app progress is separate from Chrome and hosted-site progress, because each has a separate storage origin. Upgrading the Android app using `adb install -r` preserves its stored progress; clearing app data or uninstalling removes it.

References: [Android local WebView content](https://developer.android.com/develop/ui/views/layout/webapps/load-local-content), [WebViewAssetLoader](https://developer.android.com/reference/androidx/webkit/WebViewAssetLoader).

Shortcut: with an emulator already running, execute `./mobile/run-android.sh` from the repository root. Set `ANDROID_SERIAL` to target a different device explicitly; the default is emulator-5554.

Validated here: Android debug build and JVM shared-policy tests pass; APK installed and playable in BuzzyPhone (Android 15) using the app's WebView, with no Chrome address bar. The emulator briefly displayed a System UI stall during startup; clearing that dialog restored normal gameplay. iOS project/plist syntax passes `plutil`, but iOS compilation and runtime remain unverified without full Xcode.

### Convoy Escape alpha

The web bundle now includes the live co-op connection UI. Android declares INTERNET for a user-selected WSS match endpoint; cleartext and mixed content remain disabled. The static hosted Site does not run the Node match server. See [Convoy Escape](../docs/CONVOY_ESCAPE.md) for local play, hosting and current testing limits. The offline campaign remains available without a server.
