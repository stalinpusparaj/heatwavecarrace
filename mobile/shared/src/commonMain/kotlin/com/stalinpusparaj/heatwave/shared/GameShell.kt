package com.stalinpusparaj.heatwave.shared

/** Offline solo shell with narrowly allowed optional online crew endpoints. */
object GameShell {
    const val title = "RUNROAD"
    const val matchOrigin = "https://runroad-convoy-alpha.onrender.com"
    fun isMatchHealthUrl(url: String): Boolean = url == "$matchOrigin/health"
    const val authOrigin = "https://rajkcmbdsnxdtajchuuy.supabase.co"
    fun isOnlineRequestAllowed(url: String, method: String): Boolean {
        if (method == "GET") return isMatchHealthUrl(url) || url == "$matchOrigin/crews" || url == "$authOrigin/auth/v1/user"
        if (method != "POST" && method != "OPTIONS") return false
        return listOf("/crews/create", "/crews/join", "/crews/invite", "/crews/leave")
            .any { url == "$matchOrigin$it" } || url == "$matchOrigin/crews" && method == "OPTIONS" ||
            listOf("/auth/v1/otp?redirect_to=https%3A%2F%2Fheatwave-desert-run.stalinpusparaj47.chatgpt.site%2F", "/auth/v1/verify", "/auth/v1/token?grant_type=refresh_token", "/auth/v1/logout?scope=local")
                .any { url == "$authOrigin$it" }
    }
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
