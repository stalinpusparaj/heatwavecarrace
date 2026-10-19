package com.stalinpusparaj.heatwave

import android.app.Activity
import android.content.Intent
import android.net.Uri
import com.revenuecat.purchases.CustomerInfo
import com.revenuecat.purchases.LogLevel
import com.revenuecat.purchases.Package
import com.revenuecat.purchases.PackageType
import com.revenuecat.purchases.PurchaseParams
import com.revenuecat.purchases.Purchases
import com.revenuecat.purchases.PurchasesConfiguration
import com.revenuecat.purchases.PurchasesErrorCode
import com.revenuecat.purchases.getCustomerInfoWith
import com.revenuecat.purchases.getOfferingsWith
import com.revenuecat.purchases.purchaseWith
import com.revenuecat.purchases.restorePurchasesWith
import org.json.JSONArray
import org.json.JSONObject

/**
 * RUNROAD Pass through RevenueCat: monthly and yearly subscriptions plus a lifetime one-time purchase,
 * all unlocking the `supporter` entitlement. RevenueCat validates receipts server-side and owns the
 * entitlement; the page only learns which tier is active. Message format:
 * {type:"store", products:[{id,price,period}], owned, pending, active:{plan,willRenew,expires}, restored, message}.
 */
class RevenueCatStore(private val activity: Activity, private val apiKey: String, private val push: (String) -> Unit) {
    companion object {
        const val PASS = "runroad_supporter_pack" // Kept as the entitlement marker the page already understands.
        const val ENTITLEMENT = "supporter"
        private val tiers = linkedMapOf(PackageType.MONTHLY to "monthly", PackageType.ANNUAL to "yearly", PackageType.LIFETIME to "lifetime")
    }
    private var packages = mapOf<String, Package>()
    private var owned = false
    private var plan = ""
    private var willRenew = false
    private var expires = 0L
    private var pending = false
    private var restored = false
    private var closed = false
    private var message = if (apiKey.isBlank()) "Purchases are not set up in this build yet." else "Connecting to Google Play…"
    private val ready get() = apiKey.isNotBlank() && Purchases.isConfigured

    fun start() {
        if (apiKey.isBlank()) return
        if (BuildConfig.DEBUG) Purchases.logLevel = LogLevel.DEBUG
        if (!Purchases.isConfigured) Purchases.configure(PurchasesConfiguration.Builder(activity.applicationContext, apiKey).build())
        Purchases.sharedInstance.updatedCustomerInfoListener = com.revenuecat.purchases.interfaces.UpdatedCustomerInfoListener { apply(it) }
        loadOffering()
        refresh()
    }

    /** Messages from the page: {type:"state"|"restore"|"manage"} | {type:"buy", id:"monthly"|"yearly"|"lifetime"}. */
    fun handle(raw: String) {
        val request = runCatching { JSONObject(raw) }.getOrNull() ?: return
        when (request.optString("type")) {
            "state", "catalog" -> publish()
            "restore" -> restore()
            "buy" -> buy(request.optString("id"))
            "manage" -> manage()
        }
    }

    /** Re-reads the entitlement (launch and resume): restores, renewals, completed pending payments, refunds and expiry. */
    fun refresh() {
        if (!ready || closed) return
        Purchases.sharedInstance.getCustomerInfoWith({ publish() }) { apply(it) }
    }

    private fun loadOffering() {
        Purchases.sharedInstance.getOfferingsWith({ error ->
            message = if (error.code == PurchasesErrorCode.PurchaseNotAllowedError || error.code == PurchasesErrorCode.StoreProblemError)
                "Google Play purchases aren't available on this device. Install RUNROAD from Google Play to buy." else "The RUNROAD Pass isn't available right now. Try again later."
            publish()
        }) { offerings ->
            val all = offerings.current?.availablePackages.orEmpty() + offerings.all.values.flatMap { it.availablePackages }
            packages = tiers.entries.mapNotNull { (type, id) -> all.firstOrNull { it.packageType == type }?.let { id to it } }.toMap()
            if (packages.isEmpty()) message = "The RUNROAD Pass isn't available in your region yet."
            publish()
        }
    }

    private fun buy(id: String) {
        val pkg = packages[id]
        // Subscribers may still upgrade to lifetime; nobody buys a tier they already hold.
        if (!ready || pkg == null || (owned && (plan == "lifetime" || id != "lifetime"))) { publish(); return }
        message = "Opening Google Play…"; publish()
        Purchases.sharedInstance.purchaseWith(PurchaseParams.Builder(activity, pkg).build(), { error, cancelled ->
            when {
                cancelled -> message = "Purchase cancelled. Nothing was charged."
                error.code == PurchasesErrorCode.PaymentPendingError -> { pending = true; message = "Payment pending. Your Pass unlocks as soon as Google Play confirms it." }
                error.code == PurchasesErrorCode.ProductAlreadyPurchasedError -> { message = "You already own this. Restoring it now."; restore(); return@purchaseWith }
                else -> message = "The purchase didn't complete. Nothing was charged."
            }
            publish()
        }) { _, info ->
            restored = true
            apply(info)
            if (owned) { message = "RUNROAD Pass unlocked. Thank you for supporting RUNROAD!"; publish() }
        }
    }

    private fun restore() {
        if (!ready) { publish(); return }
        message = "Restoring purchases…"; publish()
        Purchases.sharedInstance.restorePurchasesWith({ message = "Couldn't reach Google Play to restore. Try again later."; publish() }) { info ->
            apply(info)
            message = if (owned) "Purchases restored." else "No purchases found for this Google account."
            publish()
        }
    }

    /** Google Play's own subscription page, where players change or cancel plans (required for subscriptions). */
    private fun manage() = activity.runOnUiThread {
        val uri = Uri.parse("https://play.google.com/store/account/subscriptions?sku=runroad_pass&package=${activity.packageName}")
        runCatching { activity.startActivity(Intent(Intent.ACTION_VIEW, uri)) }
    }

    private fun apply(info: CustomerInfo) {
        val entitlement = info.entitlements[ENTITLEMENT]
        owned = entitlement?.isActive == true
        val product = entitlement?.productIdentifier.orEmpty()
        plan = when {
            !owned -> ""
            product.startsWith(PASS) -> "lifetime"
            product.endsWith(":yearly") || product.endsWith("yearly") -> "yearly"
            else -> "monthly"
        }
        willRenew = owned && entitlement?.willRenew == true
        expires = if (owned) entitlement?.expirationDate?.time ?: 0L else 0L
        if (owned) pending = false
        if (!restored && message.startsWith("Connecting")) message = "Ready."
        restored = true
        publish()
    }

    private fun state(): String {
        val products = JSONArray()
        packages.forEach { (id, pkg) ->
            products.put(JSONObject().put("id", id).put("title", pkg.product.title).put("price", pkg.product.price.formatted)
                .put("period", when (id) { "monthly" -> "month"; "yearly" -> "year"; else -> "" }))
        }
        val active = JSONObject().put("plan", plan).put("willRenew", willRenew).put("expires", expires)
        return JSONObject().put("type", "store").put("checkoutEnabled", ready && packages.isNotEmpty())
            .put("products", products).put("owned", JSONArray(if (owned) listOf(PASS) else emptyList()))
            .put("pending", JSONArray(if (pending && !owned) listOf(PASS) else emptyList()))
            .put("active", active).put("restored", restored).put("message", message).toString()
    }

    private fun publish() = activity.runOnUiThread { if (!closed) push(state()) }

    fun close() { closed = true; if (Purchases.isConfigured) Purchases.sharedInstance.updatedCustomerInfoListener = null }
}
