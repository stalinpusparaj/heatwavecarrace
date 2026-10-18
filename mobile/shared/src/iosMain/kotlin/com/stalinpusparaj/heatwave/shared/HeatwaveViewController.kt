@file:OptIn(kotlinx.cinterop.ExperimentalForeignApi::class)
package com.stalinpusparaj.heatwave.shared

import platform.Foundation.NSBundle
import platform.Foundation.NSURL
import platform.UIKit.UIViewController
import platform.UIKit.UIViewAutoresizingFlexibleWidth
import platform.UIKit.UIViewAutoresizingFlexibleHeight
import platform.WebKit.WKWebView
import platform.WebKit.WKWebViewConfiguration

/** The iOS host supplies the bundled web/ directory copied from dist/. */
fun createHeatwaveViewController(): UIViewController = HeatwaveViewController()

private class HeatwaveViewController : UIViewController(nibName = null, bundle = null) {
    private var game: WKWebView? = null
    override fun viewDidLoad() {
        super.viewDidLoad()
        title = GameShell.title
        val web = WKWebView(frame = view.bounds, configuration = WKWebViewConfiguration())
        web.autoresizingMask = UIViewAutoresizingFlexibleWidth or UIViewAutoresizingFlexibleHeight
        web.scrollView.scrollEnabled = false
        web.opaque = true
        view.addSubview(web)
        game = web
        NSBundle.mainBundle.resourcePath?.let { root ->
            val directory = NSURL.fileURLWithPath("$root/web/", isDirectory = true)
            val entry = NSURL.fileURLWithPath("$root/web/index.html")
            web.loadFileURL(entry, allowingReadAccessToURL = directory)
        }
    }
    override fun viewWillDisappear(animated: Boolean) {
        game?.evaluateJavaScript(GameShell.pauseScript, completionHandler = null)
        super.viewWillDisappear(animated)
    }
    override fun prefersStatusBarHidden(): Boolean = true
}
