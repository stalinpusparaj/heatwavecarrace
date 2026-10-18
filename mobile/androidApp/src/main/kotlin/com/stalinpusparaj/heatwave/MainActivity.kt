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
import androidx.webkit.WebViewCompat
import androidx.webkit.WebViewFeature
import android.util.Base64
import org.json.JSONObject
import com.stalinpusparaj.heatwave.shared.GameShell
import java.io.ByteArrayInputStream

class MainActivity : Activity() {
    private lateinit var game: WebView
    private lateinit var root: FrameLayout
    private var rendererGone = false
    private var fileCallback: ValueCallback<Array<Uri>>? = null
    private var pendingExport: ByteArray? = null

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
        game.webChromeClient = object : WebChromeClient() {
            override fun onShowFileChooser(view: WebView, callback: ValueCallback<Array<Uri>>, params: FileChooserParams): Boolean {
                fileCallback?.onReceiveValue(null)
                fileCallback = callback
                return runCatching {
                    startActivityForResult(Intent(Intent.ACTION_OPEN_DOCUMENT).apply {
                        addCategory(Intent.CATEGORY_OPENABLE); type = "application/json"
                    }, 41)
                    true
                }.getOrElse { fileCallback?.onReceiveValue(null); fileCallback = null; false }
            }
        }
        if (WebViewFeature.isFeatureSupported(WebViewFeature.WEB_MESSAGE_LISTENER)) {
            WebViewCompat.addWebMessageListener(game, "RunroadFiles", setOf(GameShell.androidOrigin)) { _, message, origin, mainFrame, _ ->
                if (mainFrame && origin.toString() == GameShell.androidOrigin && pendingExport == null) {
                    runCatching {
                        val request = JSONObject(message.data ?: "")
                        val mime = request.getString("mime")
                        val name = request.getString("name")
                        val encoded = request.getString("data")
                        require(mime in listOf("image/png", "application/json"))
                        require(name.matches(Regex("[a-zA-Z0-9._-]{1,80}")))
                        require(encoded.length <= 2_000_000)
                        pendingExport = Base64.decode(encoded, Base64.DEFAULT)
                        startActivityForResult(Intent(Intent.ACTION_CREATE_DOCUMENT).apply {
                            addCategory(Intent.CATEGORY_OPENABLE); type = mime
                            putExtra(Intent.EXTRA_TITLE, name)
                        }, 42)
                    }.onFailure { pendingExport = null }
                }
            }
        }
        game.webViewClient = object : WebViewClient() {
            override fun shouldInterceptRequest(view: WebView, request: WebResourceRequest): WebResourceResponse? =
                if (GameShell.isBundledUrl(request.url.toString())) {
                    loader.shouldInterceptRequest(request.url) ?: blockedResponse()
                } else if (request.method == "GET" && GameShell.isMatchHealthUrl(request.url.toString())) null
                else blockedResponse()

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

    @Deprecated("Legacy document picker callback")
    override fun onActivityResult(requestCode: Int, resultCode: Int, data: Intent?) {
        super.onActivityResult(requestCode, resultCode, data)
        if (requestCode == 41) {
            fileCallback?.onReceiveValue(if (resultCode == RESULT_OK) data?.data?.let { arrayOf(it) } else null)
            fileCallback = null
        }
        if (requestCode == 42) {
            val bytes = pendingExport
            pendingExport = null
            if (resultCode == RESULT_OK && bytes != null) data?.data?.let { uri ->
                runCatching { contentResolver.openOutputStream(uri)?.use { it.write(bytes) } }
                    .onFailure { android.widget.Toast.makeText(this, "Could not save file. Try again.", android.widget.Toast.LENGTH_LONG).show() }
            }
        }
    }

    private fun blockedResponse() = WebResourceResponse("text/plain", "UTF-8", 404,
        "Not found", emptyMap(), ByteArrayInputStream(ByteArray(0)))

    private fun showError(message: String) {
        root.removeAllViews()
        val panel = LinearLayout(this).apply {
            orientation = LinearLayout.VERTICAL; gravity = android.view.Gravity.CENTER; setPadding(40, 40, 40, 40)
            addView(TextView(this@MainActivity).apply { text = message; setTextColor(Color.WHITE); textSize = 18f })
            addView(Button(this@MainActivity).apply { text = "RELOAD RUNROAD"; setOnClickListener {
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
        fileCallback?.onReceiveValue(null)
        fileCallback = null
        pendingExport = null
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
