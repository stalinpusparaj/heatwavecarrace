package com.stalinpusparaj.heatwave

import android.app.Activity
import android.util.Base64
import com.android.billingclient.api.*
import org.json.JSONArray
import org.json.JSONObject
import java.security.KeyFactory
import java.security.Signature
import java.security.spec.X509EncodedKeySpec

/**
 * Google Play one-time cosmetic purchases. Purchases are verified on-device against the app's
 * Play licensing key, acknowledged, and restored on every launch; Play stays the source of truth.
 * Items are cosmetic only, so a server verifier is optional (see docs/STORE_RELEASE.md).
 */
class StoreBilling(
    private val activity: Activity,
    private val publicKey: String,
    private val push: (String) -> Unit,
) : PurchasesUpdatedListener {
    companion object { val products = listOf("runroad_supporter_pack") }

    private val client = BillingClient.newBuilder(activity).setListener(this)
        .enablePendingPurchases(PendingPurchasesParams.newBuilder().enableOneTimeProducts().build())
        .enableAutoServiceReconnection().build()
    private var details = mapOf<String, ProductDetails>()
    private val owned = linkedSetOf<String>()
    private val pending = linkedSetOf<String>()
    private var restored = false
    private var closed = false
    private var message = if (publicKey.isBlank()) "Purchases are not set up in this build yet." else "Connecting to Google Play…"

    fun start() {
        if (publicKey.isBlank()) return
        client.startConnection(object : BillingClientStateListener {
            override fun onBillingSetupFinished(result: BillingResult) {
                if (closed) return
                if (result.responseCode == BillingClient.BillingResponseCode.OK) { loadProducts(); refresh() }
                else { message = "Google Play Store is unavailable on this device."; publish() }
            }
            override fun onBillingServiceDisconnected() {}
        })
    }

    /** Messages from the page: {type:"state"|"restore"|"buy", id?}. */
    fun handle(raw: String) {
        val request = runCatching { JSONObject(raw) }.getOrNull() ?: return
        when (request.optString("type")) {
            "state", "catalog" -> publish()
            "restore" -> { message = "Restoring purchases…"; publish(); refresh() }
            "buy" -> buy(request.optString("id"))
        }
    }

    /** Re-reads owned items from Play: restores purchases, picks up pending payments and refunds. */
    fun refresh() {
        if (closed || !client.isReady) return
        client.queryPurchasesAsync(QueryPurchasesParams.newBuilder().setProductType(BillingClient.ProductType.INAPP).build()) { result, purchases ->
            if (result.responseCode != BillingClient.BillingResponseCode.OK) return@queryPurchasesAsync
            owned.clear(); pending.clear()
            purchases.forEach(::process)
            restored = true
            if (message.startsWith("Restoring") || message.startsWith("Connecting"))
                message = if (owned.isNotEmpty()) "Purchases restored." else "Ready."
            publish()
        }
    }

    private fun loadProducts() {
        val params = QueryProductDetailsParams.newBuilder().setProductList(products.map {
            QueryProductDetailsParams.Product.newBuilder().setProductId(it).setProductType(BillingClient.ProductType.INAPP).build()
        }).build()
        client.queryProductDetailsAsync(params) { result, list ->
            if (result.responseCode == BillingClient.BillingResponseCode.OK)
                details = list.productDetailsList.filter { it.productId in products }.associateBy { it.productId }
            if (details.isEmpty()) message = "The supporter pack isn't available in your region yet."
            publish()
        }
    }

    private fun buy(id: String) {
        val product = details[id]
        if (product == null || id in owned) { publish(); return }
        val params = BillingFlowParams.newBuilder().setProductDetailsParamsList(listOf(
            BillingFlowParams.ProductDetailsParams.newBuilder().setProductDetails(product).build())).build()
        activity.runOnUiThread {
            val result = client.launchBillingFlow(activity, params)
            if (result.responseCode != BillingClient.BillingResponseCode.OK) { message = "Google Play couldn't open checkout. Nothing was charged."; publish() }
        }
    }

    override fun onPurchasesUpdated(result: BillingResult, purchases: MutableList<Purchase>?) {
        when (result.responseCode) {
            BillingClient.BillingResponseCode.OK -> purchases?.forEach(::process)
            BillingClient.BillingResponseCode.USER_CANCELED -> message = "Purchase cancelled. Nothing was charged."
            BillingClient.BillingResponseCode.ITEM_ALREADY_OWNED -> { message = "You already own this. Restoring it now."; refresh() }
            else -> message = "The purchase didn't complete. Nothing was charged."
        }
        publish()
    }

    private fun process(purchase: Purchase) {
        val ids = purchase.products.filter { it in products }
        if (ids.isEmpty()) return
        if (!verified(purchase.originalJson, purchase.signature)) { message = "A purchase couldn't be verified, so it wasn't unlocked."; return }
        when (purchase.purchaseState) {
            Purchase.PurchaseState.PURCHASED -> {
                owned += ids; pending -= ids.toSet()
                if (restored) message = "Supporter collection unlocked. Thank you for supporting RUNROAD!"
                // Unacknowledged purchases are refunded by Play after three days; retried on every refresh.
                if (!purchase.isAcknowledged) client.acknowledgePurchase(
                    AcknowledgePurchaseParams.newBuilder().setPurchaseToken(purchase.purchaseToken).build()) {}
            }
            Purchase.PurchaseState.PENDING -> { pending += ids; message = "Payment pending. Your pack unlocks as soon as Google Play confirms it." }
        }
    }

    private fun verified(data: String, signature: String): Boolean = runCatching {
        val key = KeyFactory.getInstance("RSA").generatePublic(X509EncodedKeySpec(Base64.decode(publicKey, Base64.DEFAULT)))
        Signature.getInstance("SHA1withRSA").run { initVerify(key); update(data.toByteArray()); verify(Base64.decode(signature, Base64.DEFAULT)) }
    }.getOrDefault(false)

    private fun state(): String {
        val items = JSONArray()
        details.values.forEach { d ->
            d.oneTimePurchaseOfferDetailsList?.firstOrNull()?.let { items.put(JSONObject().put("id", d.productId).put("title", d.name).put("price", it.formattedPrice)) }
        }
        return JSONObject().put("type", "store").put("checkoutEnabled", client.isReady && items.length() > 0)
            .put("products", items).put("owned", JSONArray(owned.toList())).put("pending", JSONArray(pending.toList()))
            .put("restored", restored).put("message", message).toString()
    }

    private fun publish() = activity.runOnUiThread { if (!closed) push(state()) }

    fun close() { closed = true; client.endConnection() }
}
