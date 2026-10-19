package com.stalinpusparaj.heatwave

import android.app.Activity
import android.os.Handler
import android.os.Looper
import com.google.android.gms.ads.*
import com.google.android.gms.ads.rewarded.RewardedAd
import com.google.android.gms.ads.rewarded.RewardedAdLoadCallback
import com.google.android.ump.ConsentInformation
import com.google.android.ump.ConsentRequestParameters
import com.google.android.ump.UserMessagingPlatform
import org.json.JSONObject

/**
 * Opt-in rewarded ads (13+ audience). Consent is gathered with Google's UMP first; ads load only when
 * consent allows. The page grants a reward only after the SDK's earned-reward callback for its token.
 */
class RewardedAds(private val activity: Activity, private val unitId: String, private val push: (String) -> Unit) {
    private val consent: ConsentInformation = UserMessagingPlatform.getConsentInformation(activity)
    private val main = Handler(Looper.getMainLooper())
    private var ad: RewardedAd? = null
    private var loading = false
    private var initialized = false
    private var showing = false
    private var closed = false

    fun start() {
        val params = ConsentRequestParameters.Builder().setTagForUnderAgeOfConsent(false).build()
        consent.requestConsentInfoUpdate(activity, params, {
            UserMessagingPlatform.loadAndShowConsentFormIfRequired(activity) { initIfAllowed() }
        }, { initIfAllowed() })
        initIfAllowed()
    }

    /** Messages from the page: {type:"state"} | {type:"show", token} | {type:"privacy"}. */
    fun handle(raw: String) {
        val request = runCatching { JSONObject(raw) }.getOrNull() ?: return
        when (request.optString("type")) {
            "state" -> publish()
            "show" -> show(request.optString("token").take(40))
            "privacy" -> activity.runOnUiThread {
                UserMessagingPlatform.showPrivacyOptionsForm(activity) { initIfAllowed(); publish() }
            }
        }
    }

    private fun initIfAllowed() {
        if (closed) return
        publish()
        if (initialized || !consent.canRequestAds()) return
        initialized = true
        MobileAds.setRequestConfiguration(RequestConfiguration.Builder()
            .setMaxAdContentRating(RequestConfiguration.MAX_AD_CONTENT_RATING_T)
            .setTagForUnderAgeOfConsent(RequestConfiguration.TAG_FOR_UNDER_AGE_OF_CONSENT_FALSE).build())
        Thread { MobileAds.initialize(activity) { main.post { load() } } }.start()
    }

    private fun load() {
        if (closed || loading || ad != null || !consent.canRequestAds()) return
        loading = true
        RewardedAd.load(activity, unitId, AdRequest.Builder().build(), object : RewardedAdLoadCallback() {
            override fun onAdLoaded(loaded: RewardedAd) { loading = false; ad = loaded; publish() }
            override fun onAdFailedToLoad(error: LoadAdError) { loading = false; ad = null; publish(); main.postDelayed({ load() }, 45_000) }
        })
    }

    private fun show(token: String) = activity.runOnUiThread {
        val current = ad
        if (current == null || showing || token.isBlank()) { push(event("unavailable", token)); load(); return@runOnUiThread }
        ad = null; showing = true
        current.fullScreenContentCallback = object : FullScreenContentCallback() {
            override fun onAdDismissedFullScreenContent() { showing = false; push(event("closed", token)); load() }
            override fun onAdFailedToShowFullScreenContent(error: AdError) { showing = false; push(event("closed", token)); load() }
        }
        current.show(activity) { push(event("reward", token)) }
    }

    private fun event(name: String, token: String) = JSONObject().put("type", "ad").put("event", name).put("token", token).toString()

    private fun publish() = activity.runOnUiThread {
        if (!closed) push(JSONObject().put("type", "ads").put("ready", ad != null)
            .put("privacy", consent.privacyOptionsRequirementStatus == ConsentInformation.PrivacyOptionsRequirementStatus.REQUIRED).toString())
    }

    fun close() { closed = true; main.removeCallbacksAndMessages(null); ad = null }
}
