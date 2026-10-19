# RUNROAD — progression and monetization implementation

19 October 2026. This release adds playable engagement features and a read-only native Google Play catalog connection. **It does not charge money, deliver advertisements or grant paid entitlements.** Play Console/AdMob configuration has not been supplied.

## Playable features

- Driver Passport: local driver levels, XP, style tokens and seven lifetime badges. XP comes from completed campaign runs and meaningful failed attempts of at least ten seconds. The level formula is `floor(sqrt(XP / 120)) + 1`. Completing a badge gives 50 XP and 15 style tokens once.
- Three daily contracts selected deterministically from seven objectives per UTC date. They track successful escapes, close calls, drift time, wrecks, driving time, peak chain or Perfect Nitro. Claims grant 140–200 campaign credits, 20–30 earned style tokens and 60 XP. A completed contract is paid once on this local save. Contract buttons lead into campaign routes.
- Solo Perfect Nitro: tap boost at 85–95% charge for a 1.9-second boost instead of 1.5 seconds. Cost, cooldown and speed multiplier stay the same. The charge percentage and window are visible on the boost button. Rivals and live Convoy keep their existing rules.
- Clean escapes (at least 75% hull) grant extra Passport XP. Result summaries show earned XP, style tokens and new badges.
- Style Studio: six free finishes. Factory is available immediately; Sunset Rally, Signal Blue and Midnight Violet unlock at driver levels 2, 4 and 7. Coastline and Homebound Rally cost 160 and 300 earned style tokens. Previewing is free and reuses the selected car sprite; re-equipping an owned finish is free.
- Equipped finishes draw colored stripe geometry on the existing solo car sprite. They do not change car handling, collision shapes, speed, HP, nitro or progression rewards. Competitive modes retain their standard appearance and stats.

There are no energy gates, punished missed days, paid performance, loot boxes, loss-triggered ads or forced invitations. Rewards are concrete and visible. Existing campaign credits, unlocked cars, upgrades, levels and crew storage retain their original keys and behavior.

## Local storage and fairness

Passport data is stored separately in `runroad-passport-v1`; it is not an authoritative competitive score or proof of payment. Daily records use UTC and advance monotonically on this save so a simple clock rollback does not reset claims. A modified clock/save can still cheat local earned rewards. No paid or shared crew entitlements trust this state. It is not cloud-synced; clearing app storage removes this local progression.

A run is settled once. Rival Routes and live co-op do not contribute to this local system. The new layers do not change multiplayer seed generation or simulation rules. Existing local campaign rewards remain separate from account-backed Crews.

## Commercial model and current availability

Use freemium: keep campaign, car performance and multiplayer accessible; sell permanent cosmetic packs after the purchase service is configured. Start with a single clear supporter collection rather than a subscription. Optional rewarded credit doubling can be added later after native ad integration and audience/consent decisions. Do not show an ad button before a real ad is available.

The Style Studio labels the supporter collection as planned and not on sale. Proposed contents are three exclusive stripe designs and a supporter badge. No remove-ads claim is made, because there are no forced ads.

`StoreCatalog.kt` uses official Play Billing 9.1.0 to query the proposed non-consumable ID `runroad_supporter_pack`. Its WebView message interface accepts only a bounded `catalog` request from the main frame at the exact bundled Android origin. It returns product metadata and localized price when Play supplies it. The SDK connects only when the player requests availability. It is closed with the activity. A 15-second deadline returns a no-payment timeout if Play does not answer. The browser has no external payment flow.

This adapter is deliberately **read-only**: it has no checkout launch, purchase acknowledgment, restore grant or entitlement delivery. It always returns `checkoutEnabled: false`. A Play catalog response or JavaScript message can never unlock a paid item. A debug/sideloaded app or unconfigured product normally returns unavailable. Catalog discovery is not tested payment processing.

## Required to take real payments

1. Supply a Play Console application for `com.gemmyapps.RUNROAD`, a signing/upload setup and an internal testing track. Create the actual cosmetic product and agree on its product ID and localized price.
2. Connect authenticated server receipt verification to Google Play Developer API using protected server credentials. Validate package, product, purchase state and account binding. Persist entitlements separately from local Passport data, deduplicate tokens, and handle acknowledgment, refunds/revocation and restore.
3. Implement and test the native checkout and restoration flows against this verifier, including cancellation, pending transactions, offline recovery and account changes. Then enable sale in the UI using only real store prices.
4. For ads, provide an AdMob app/ad-unit setup and audience decisions. Integrate native rewarded ads and required consent; grant a reward only from the actual earned-reward event with once-per-run settlement. Test units produce no revenue and must never be described as live monetization.

Do not route Google Play digital-goods purchases to an ordinary website checkout inside the WebView. [Google Play payments policy](https://support.google.com/googleplay/android-developer/answer/9858738) describes the applicable billing requirements and exceptions. See [one-time products](https://developer.android.com/google/play/billing/one-time-products), [Billing integration](https://developer.android.com/google/play/billing/integrate), and [purchase processing](https://developer.android.com/google/play/billing/lifecycle/one-time).

## Mobile budget and verification

No new video, remote font, texture, analytics SDK or ad SDK was added. UI art is CSS and the livery adds a few rectangles to one solo car per frame. Passport settlement/storage happens at run completion, menu interactions and date rollover, not per simulation tick. Existing Eco/Balanced/High rendering budgets remain in effect.

Checks cover duplicate run/contract claims, XP/badge accounting, earned cosmetics, short-attempt farming, mode isolation, UTC rollover/rollback, persistence, Perfect Nitro timing, stock/Rival boost behavior and campaign compatibility. Small-screen browser and Android checks are recorded in the task result. Native purchase and rewarded-ad verification remain unavailable until the external setup above exists.


### Verified in this build

A natural browser campaign escape displayed Passport XP and the first badge, unlocked Sunset Rally at driver level 2 and allowed it to be equipped. Mobile-width screens and contract-to-route navigation were inspected. The JavaScript regression checks and all 34 crew/multiplayer tests passed. The Android APK and shared JVM checks built successfully; the emulator opened Style Studio and invoked the read-only catalog bridge. This does not verify a real product, purchase or ad.

The new progression JavaScript and CSS are roughly 8 KB combined when gzipped. The debug APK including the official Billing library is approximately 6.7 MB (not a minified release measurement). No physical low-end device benchmark was performed.
