package com.stalinpusparaj.heatwave.shared

/** Shared shell contract used by Android and the iOS framework. No server is needed. */
object GameShell {
    const val title = "RUNROAD"
    const val androidOrigin = "https://appassets.androidplatform.net"
    const val androidEntry = "$androidOrigin/assets/web/index.html"
    const val pauseScript = "(function(){if(typeof state!=='undefined'&&state==='playing')pause();})()"
    const val backScript = """(function(){
        if(typeof state==='undefined')return false;
        if(state==='playing'){pause();return true;}
        if(state==='paused'||state==='over'){C.open('home');return true;}
        return false;
    })()"""

    fun isBundledUrl(url: String): Boolean =
        url.startsWith("$androidOrigin/assets/web/") && !url.contains('\\') &&
            !url.substringBefore('?').contains("..") && !url.substringBefore('?').contains('%')
}
