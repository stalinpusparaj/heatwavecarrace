# Input latency: native vs web controls

## Question

Would native KMP touch controls (steering/brake) make the Android game feel more responsive than the WebView's own pointer events?

## Method

19 October 2026, Android emulator `BuzzyPhone` (Android 15, sdk_gphone64_arm64), debug APK, Eco tier (15–20 FPS in the emulator). The test used a temporary debug-only probe, now removed from the app source. Each tap came from `adb shell input tap` during a tutorial mission. For every touch-down, `Activity.dispatchTouchEvent` recorded the hardware event time and sent it to the page in three native ways:

- `evaluateJavascript`
- a `WebMessageListener` reply-proxy push
- a `@JavascriptInterface` value that the page polled every animation frame

The WebView delivered the same touch as a normal `pointerdown`. For each path, latency is measured from the hardware event to the first animation frame after arrival. That frame is the earliest point the game's update loop can read the input. Two runs of 80 taps each:

| Path | Median | p90 |
|---|---|---|
| Web `pointerdown` (current) | 28 ms | 119–171 ms |
| Native `evaluateJavascript` | 29–32 ms | 218–254 ms |
| Native message push | 29 ms | 218–254 ms |
| Native per-frame poll | 22–25 ms | 119–171 ms |

The per-frame poll was about 4 ms faster at the median and no better at p90. The push transports were worse at p90. The clocks of the app and renderer processes agree within about 2 ms. Emulator timings are noisier than a physical phone.

## Finding

The input path is not the bottleneck. With the original physics, the car needed **850 ms** to travel within 10° of a 90° turn and **666 ms** to brake to 10% speed. Native controls would save under 1% of that and would duplicate input code across Android and iOS. **Decision: keep web input and tune the player's handling.**

## Handling change (solo modes only)

`dist/controls.js` provides player grip and steering. Rival Routes and Convoy keep the original values (grip 3.5, steering ×1), because recorded ghosts and the co-op server simulation must match.

| | Before | After |
|---|---|---|
| Grip (velocity follows heading) | 3.5 | 6 (9 while braking) |
| Steering rate | ×1 | ×1.25 (×1.6 while braking) |
| Drift nitro charge | ×1 | ×1.5 (offsets about 35% less drift slip) |
| Joystick dead zone | 9 px | 6 px |
| 90° turn, travel within 10° (stock Dust Devil, measured in game) | 850 ms | 567 ms |
| Brake to 10% speed (measured in game) | 666 ms | 267 ms |

Physical-device feel and campaign difficulty still need playtesting. The 500-level playthrough audit (`tests/campaign-playthrough.cjs`) passes.
