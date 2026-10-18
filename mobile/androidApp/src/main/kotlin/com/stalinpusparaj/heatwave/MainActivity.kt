package com.stalinpusparaj.heatwave

import android.annotation.SuppressLint
import android.app.Activity
import android.content.Intent
import android.graphics.Color
import android.net.Uri
import android.os.Build
import android.os.Bundle
import android.view.View
import android.view.WindowInsets
import android.view.WindowInsetsController
import android.view.WindowManager
import android.webkit.*
import android.widget.Button
import android.widget.FrameLayout
import android.widget.LinearLayout
import android.widget.TextView
import androidx.webkit.WebViewAssetLoader
import com.stalinpusparaj.heatwave.shared.GameShell
import java.io.ByteArrayInputStream

class MainActivity : Activity() {
    private lateinit var game: WebView
    private lateinit var root: FrameLayout
    private var rendererGone = false

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        root = FrameLayout(this).apply { setBackgroundColor(Color.rgb(8, 15, 29)) }
        setContentView(root)
        immersive()
        if (Build.VERSION.SDK_INT >= 33) {
            onBackInvokedDispatcher.registerOnBackInvokedCallback(0) { handleBack() }
        }
        openGame()
    }

    @SuppressLint("SetJavaScriptEnabled")
    private fun openGame() {
        root.removeAllViews()
        rendererGone = false
        game = WebView(this)
        val loader = WebViewAssetLoader.Builder()
            .addPathHandler("/assets/", WebViewAssetLoader.AssetsPathHandler(this)).build()
        game.setBackgroundColor(Color.rgb(8, 15, 29))
        game.isLongClickable = false
        game.setOnLongClickListener { true }
        game.overScrollMode = View.OVER_SCROLL_NEVER
        game.settings.apply {
            javaScriptEnabled = true
            domStorageEnabled = true
            allowFileAccess = false
            allowContentAccess = false
            mixedContentMode = WebSettings.MIXED_CONTENT_NEVER_ALLOW
            mediaPlaybackRequiresUserGesture = true
            setSupportZoom(false)
            builtInZoomControls = false
            displayZoomControls = false
        }
        WebView.setWebContentsDebuggingEnabled(BuildConfig.DEBUG)
        game.webChromeClient = WebChromeClient()
        game.webViewClient = object : WebViewClient() {
            override fun shouldInterceptRequest(view: WebView, request: WebResourceRequest): WebResourceResponse =
                if (GameShell.isBundledUrl(request.url.toString())) {
                    loader.shouldInterceptRequest(request.url) ?: blockedResponse()
                } else blockedResponse()

            override fun shouldOverrideUrlLoading(view: WebView, request: WebResourceRequest): Boolean {
                if (GameShell.isBundledUrl(request.url.toString())) return false
                if (request.hasGesture() && request.url.scheme in listOf("https", "http")) {
                    runCatching { startActivity(Intent(Intent.ACTION_VIEW, request.url)) }
                }
                return true
            }
            override fun onReceivedError(view: WebView, request: WebResourceRequest, error: WebResourceError) {
                if (request.isForMainFrame) showError("The game could not load. Tap below to retry.")
            }
            override fun onRenderProcessGone(view: WebView, detail: RenderProcessGoneDetail): Boolean {
                rendererGone = true
                root.removeView(view)
                view.destroy()
                showError("The game renderer stopped. Your saved progress is kept.")
                return true
            }
        }
        root.addView(game, FrameLayout.LayoutParams(-1, -1))
        game.loadUrl(GameShell.androidEntry)
    }

    private fun blockedResponse() = WebResourceResponse("text/plain", "UTF-8", 404,
        "Not found", emptyMap(), ByteArrayInputStream(ByteArray(0)))

    private fun showError(message: String) {
        root.removeAllViews()
        val panel = LinearLayout(this).apply {
            orientation = LinearLayout.VERTICAL; gravity = android.view.Gravity.CENTER; setPadding(40, 40, 40, 40)
            addView(TextView(this@MainActivity).apply { text = message; setTextColor(Color.WHITE); textSize = 18f })
            addView(Button(this@MainActivity).apply { text = "RELOAD HEATWAVE"; setOnClickListener {
                if (!rendererGone) game.destroy()
                openGame()
            } })
        }
        root.addView(panel, FrameLayout.LayoutParams(-1, -1))
    }

    private fun handleBack() {
        if (rendererGone) { finish(); return }
        game.evaluateJavascript(GameShell.backScript) { if (it != "true") finish() }
    }
    @Deprecated("Legacy Android back callback")
    override fun onBackPressed() { handleBack() }

    override fun onPause() {
        if (::game.isInitialized && !rendererGone) {
            game.evaluateJavascript(GameShell.pauseScript, null)
            game.onPause(); game.pauseTimers()
        }
        super.onPause()
    }
    override fun onResume() {
        super.onResume()
        if (::game.isInitialized && !rendererGone) { game.resumeTimers(); game.onResume() }
        immersive()
    }
    override fun onDestroy() {
        if (::game.isInitialized && !rendererGone) { root.removeView(game); game.stopLoading(); game.destroy() }
        super.onDestroy()
    }
    @Suppress("DEPRECATION")
    private fun immersive() {
        if (Build.VERSION.SDK_INT >= 28) window.attributes = window.attributes.apply {
            layoutInDisplayCutoutMode = WindowManager.LayoutParams.LAYOUT_IN_DISPLAY_CUTOUT_MODE_SHORT_EDGES
        }
        if (Build.VERSION.SDK_INT >= 30) {
            window.setDecorFitsSystemWindows(false)
            window.insetsController?.apply {
                hide(WindowInsets.Type.systemBars())
                systemBarsBehavior = WindowInsetsController.BEHAVIOR_SHOW_TRANSIENT_BARS_BY_SWIPE
            }
        } else window.decorView.systemUiVisibility = View.SYSTEM_UI_FLAG_IMMERSIVE_STICKY or
            View.SYSTEM_UI_FLAG_FULLSCREEN or View.SYSTEM_UI_FLAG_HIDE_NAVIGATION or
            View.SYSTEM_UI_FLAG_LAYOUT_FULLSCREEN or View.SYSTEM_UI_FLAG_LAYOUT_HIDE_NAVIGATION or View.SYSTEM_UI_FLAG_LAYOUT_STABLE
    }
}
