# Releasing RUNROAD on Google Play

Model: free game, one optional cosmetic pack (`runroad_supporter_pack`), opt-in rewarded ads that double a level's credits. Audience 13+. Listing text and form answers: [store/LISTING.md](store/LISTING.md).

## What the build already does

- **Purchases:** `StoreBilling.kt` uses Google Play Billing 9.1.0 for checkout, pending payments, cancellation, verification of Google's signed receipt on the device, acknowledgement (Play refunds unacknowledged purchases after 3 days), and restore on every launch and resume. Refunds remove the items. The game never stores paid items as owned in its save; ownership always comes from Play (`tests/store.cjs`).
- **Ads:** `RewardedAds.kt` uses Google Mobile Ads 25.4.0 and Google's consent SDK (UMP) 3.2.0. The consent message appears where required before any ad request; "Ad privacy choices" appears in Style Studio when required. Ads are teen-rated and appear only after a successful level, and only when the player taps. Credits are granted once, only on the SDK's earned-reward callback.
- **Debug builds** always use Google's test ad IDs.
- **Release builds** refuse to compile until real AdMob IDs and the Play licensing key are set, so test ads and unconfigured purchases cannot ship.
- **Privacy policy:** `dist/privacy.html`, served with the web build.

## One-time setup (you)

1. **Privacy policy.** It lists gemmyapps@gmail.com as the support contact. Redeploy the Site so the policy is public. Expected URL: `https://heatwave-desert-run.stalinpusparaj47.chatgpt.site/privacy.html`.
2. **Google Play Console.** Create a developer account ($25 one-time; identity verification can take a few days). Create the app with package name `com.gemmyapps.RUNROAD`. The package name can never change after the first upload.
3. **Upload key.** Run `./scripts/create-upload-key.sh` and choose strong passwords. Back up `mobile/keys/runroad-upload.jks` privately. Keep **Play App Signing** on (the default).
4. **AdMob.** Add an Android app named RUNROAD. Create a **Rewarded** ad unit. In Privacy & messaging, create a **GDPR** consent message (and a US states message if you like) and publish it. Later, link the AdMob app to the Play listing.
5. **`mobile/release.properties`.** The script creates it from `release.properties.example`. Fill in:
   - the keystore passwords
   - the AdMob App ID and rewarded unit ID
   - the Play licensing key (Play Console → Monetize with Play → Monetization setup)
6. **Product.** Create `runroad_supporter_pack` as described in [LISTING.md](store/LISTING.md#in-app-product). Products can only be created after you upload a build that contains Play Billing, so do step 7 first if Console asks for it.

## Build and upload

```sh
cd mobile
JAVA_HOME='/Applications/Android Studio.app/Contents/jbr/Contents/Home' ./gradlew :androidApp:bundleRelease
```

Upload `mobile/androidApp/build/outputs/bundle/release/androidApp-release.aab` to **Testing → Internal testing**, then add yourself as a tester. Raise `runroad.versionCode` for every new upload.

## Test before production

On a real phone installed from the internal testing link (purchases don't work from a sideloaded APK):

- [ ] Add your Google account under Settings → License testing, then buy the pack. It should unlock, equip Golden Homecoming and show string lights on the home. You won't be charged as a license tester.
- [ ] Test-card "slow" payment: shows pending, then unlocks when it completes.
- [ ] Uninstall and reinstall: the pack restores automatically. Refund it in Play Console → Order management, reopen the app, and the pack is removed.
- [ ] Finish a level and tap "Watch an ad · 2× credits". After the ad, credits increase exactly once. Close an ad early: no credits.
- [ ] With a VPN or device locale in the EU, the consent form appears on first launch, and "Ad privacy choices" appears in Style Studio.

## Play's new-account rule

Personal developer accounts created recently must run a **closed test with at least 12 testers for 14 days** before production access. Plan for this: recruit friends, a Discord or a subreddit early. Their feedback is also your first market test.

## Production checklist

- [ ] Store listing, graphics, privacy policy URL, ads declaration, target audience (13+), content rating, data safety: all from [LISTING.md](store/LISTING.md)
- [ ] Pricing & distribution countries selected
- [ ] Closed-test requirement met (if applicable)
- [ ] Staged rollout: start at 20%, watch Android vitals (crashes and ANRs) for 48 hours, then go to 100%

## Not included yet (sensible next steps)

- Server-side purchase verification. Not required for cosmetic-only items; add it before selling anything that affects gameplay or syncs across devices.
- Cloud save. Progress is on-device only; clearing app data loses it.
- iOS / App Store version. The KMP iOS shell exists but isn't build-verified.
- Your own analytics to tune difficulty across 500 levels. None is included, by design; add it only with an updated privacy policy and data safety form.
