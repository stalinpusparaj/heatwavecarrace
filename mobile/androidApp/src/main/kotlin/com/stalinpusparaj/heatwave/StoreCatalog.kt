package com.stalinpusparaj.heatwave

import android.app.Activity
import android.os.Handler
import android.os.Looper
import com.android.billingclient.api.*
import org.json.JSONArray
import org.json.JSONObject

/** Read-only Google Play discovery. Checkout stays unavailable until receipt verification is configured. */
class StoreCatalog(private val activity: Activity) {
    private var client: BillingClient? = null
    private var connecting = false
    private var closed = false
    private val products = listOf("runroad_supporter_pack")

    fun query(reply: (String) -> Unit) {
        if (closed) return
        if (connecting) { reply(message("Google Play is connecting. Try again shortly.")); return }
        val handler = Handler(Looper.getMainLooper())
        var answered = false
        val timeout = Runnable {
            if (!answered && !closed) {
                answered = true; connecting = false; client?.endConnection(); client = null
                reply(message("Google Play did not respond. Try again later. No payment was started."))
            }
        }
        val respond: (String) -> Unit = { value -> activity.runOnUiThread {
            if (!answered && !closed) { answered = true; handler.removeCallbacks(timeout); reply(value) }
        } }
        handler.postDelayed(timeout, 15000)
        val billing = client ?: BillingClient.newBuilder(activity)
            .setListener { _, _ -> /* This read-only adapter never initiates purchases or grants items. */ }
            .enablePendingPurchases(PendingPurchasesParams.newBuilder().enableOneTimeProducts().build())
            .enableAutoServiceReconnection()
            .build().also { client = it }
        if (billing.isReady) { load(billing, respond); return }
        connecting = true
        billing.startConnection(object : BillingClientStateListener {
            override fun onBillingSetupFinished(result: BillingResult) {
                connecting = false
                if (closed) return
                if (result.responseCode == BillingClient.BillingResponseCode.OK) load(billing, respond)
                else respond(message("Google Play catalog is unavailable in this build or on this device. No payment was started."))
            }
            override fun onBillingServiceDisconnected() { connecting = false }
        })
    }
    private fun load(billing: BillingClient, reply: (String) -> Unit) {
        val params = QueryProductDetailsParams.newBuilder().setProductList(products.map { id ->
            QueryProductDetailsParams.Product.newBuilder().setProductId(id)
                .setProductType(BillingClient.ProductType.INAPP).build()
        }).build()
        billing.queryProductDetailsAsync(params) { result, details ->
            if (closed) return@queryProductDetailsAsync
            if (result.responseCode != BillingClient.BillingResponseCode.OK) {
                reply(message("Google Play could not load the catalog. No payment was started.")); return@queryProductDetailsAsync
            }
            val items = JSONArray()
            details.productDetailsList.filter { it.productId in products }.forEach { product ->
                val offer = product.oneTimePurchaseOfferDetailsList?.firstOrNull()
                if (offer != null) items.put(JSONObject().put("id", product.productId)
                    .put("title", product.name).put("price", offer.formattedPrice))
            }
            reply(JSONObject().put("checkoutEnabled", false).put("products", items)
                .put("message", if (items.length() > 0) "Google Play catalog found. Checkout is not enabled until purchase verification is connected."
                else "No configured RUNROAD products were returned by Google Play. No payment was started.").toString())
        }
    }
    private fun message(text: String) = JSONObject().put("checkoutEnabled", false)
        .put("products", JSONArray()).put("message", text).toString()
    fun close() { closed = true; client?.endConnection(); client = null }
}
