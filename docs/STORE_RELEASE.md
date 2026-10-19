# Releasing RUNROAD on Google Play

Model: free game; optional **RUNROAD Pass** sold monthly, yearly or lifetime (2× credits after every win, a monthly exclusive livery, Pass cosmetics); opt-in rewarded ads for non-Pass players. Audience 13+. Listing text and form answers: [store/LISTING.md](store/LISTING.md).

## What the build already does

- **Purchases:** `RevenueCatStore.kt` (RevenueCat 10.24.2, Play Billing underneath) sells the three Pass tiers from the `default` offering. RevenueCat validates receipts server-side and owns the `supporter` entitlement; the app reports the active tier, renewal date and auto-renew state, opens Google Play's subscription page for **Manage subscription**, lets subscribers upgrade to Lifetime, and restores on launch/resume. Expiry and refunds deactivate the Pass; monthly liveries already collected are kept. The shop shows the auto-renew and cancellation terms before purchase (Play subscriptions policy). Tests: `tests/store.cjs`.
- **Ads:** `RewardedAds.kt` uses Google Mobile Ads 25.4.0 and Google's consent SDK (UMP) 3.2.0. The consent message appears where required before any ad request; "Ad privacy choices" appears in Style Studio when required. Ads are teen-rated and appear only after a successful level, and only when the player taps. Credits are granted once, only on the SDK's earned-reward callback.
- **Debug builds** always use Google's test ad IDs.
- **Release builds** refuse to compile until real AdMob IDs and the RevenueCat Google API key are set, so test ads and unconfigured purchases cannot ship.
- **Privacy policy:** `dist/privacy.html`, served with the web build.

## One-time setup (you)

1. **Privacy policy.** It lists gemmyapps@gmail.com as the support contact. Redeploy the Site so the policy is public. Expected URL: `https://heatwave-desert-run.stalinpusparaj47.chatgpt.site/privacy.html`.
2. **Google Play Console.** Create a developer account ($25 one-time; identity verification can take a few days). Create the app with package name `com.gemmyapps.RUNROAD`. The package name can never change after the first upload.
3. **Upload key.** Reuses your existing `upload` key (`upload-keystore[2].jks`, SHA-256 starting `D7:1A:52:57`). Keep **Play App Signing** on (the default); Play registers this as RUNROAD's upload key on the first upload.
4. **AdMob.** Add an Android app named RUNROAD. Create a **Rewarded** ad unit. In Privacy & messaging, create a **GDPR** consent message (and a US states message if you like) and publish it. Later, link the AdMob app to the Play listing.
5. **`mobile/release.properties`.** Already created on this Mac. Signing reads the passwords from your existing `keystore[2].properties`. Fill in the AdMob App ID, the rewarded unit ID and `runroad.revenuecatKey`.
6. **Products.** Done on 19 October 2026: subscription `runroad_pass` (base plans `monthly`, `yearly`) and one-time `runroad_supporter_pack`, all active. See [LISTING.md](store/LISTING.md#in-app-products-runroad-pass).
7. **RevenueCat** (dashboard, by you):
   - Add a **Play Store** app with package `com.gemmyapps.RUNROAD` to your RevenueCat project.
   - Upload a Google Play **service account** JSON credential that has access to this app. Grant it Financial data and Manage orders in Play Console → Users and permissions.
   - Create the entitlement **`supporter`** and attach the product `runroad_supporter_pack` to it.
   - Create an offering (for example `default`, marked Current) with a package containing `runroad_supporter_pack`.
   - Copy the app's **public API key** (`goog_…`) into `runroad.revenuecatKey`.

## Build and upload

```sh
cd mobile
JAVA_HOME='/Applications/Android Studio.app/Contents/jbr/Contents/Home' ./gradlew :androidApp:bundleRelease
```

Upload `mobile/androidApp/build/outputs/bundle/release/androidApp-release.aab` to **Testing → Internal testing**, then add yourself as a tester. Raise `runroad.versionCode` for every new upload.

## Test before production

On a real phone installed from the internal testing link (purchases don't work from a sideloaded APK):

- [ ] Add your Google account under Settings → License testing. Buy Monthly: the Pass unlocks, equips Golden Homecoming, shows string lights and this month's livery, and wins add 2× credits with no ad. License-test subscriptions renew every few minutes and cancel after 6 renewals. Then upgrade to Lifetime and check that Manage subscription opens Google Play.
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

- Free trials or intro offers on the Pass (Play Console → runroad_pass → base plan → Add offer); the app needs no change.
- Cloud save. Progress is on-device only; clearing app data loses it.
- iOS / App Store version. The KMP iOS shell exists but isn't build-verified.
- Your own analytics to tune difficulty across 500 levels. None is included, by design; add it only with an updated privacy policy and data safety form.
