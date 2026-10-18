package com.stalinpusparaj.heatwave.shared
import kotlin.test.*
class GameShellTest {
    @Test fun matchHealthAllowanceIsExact() {
        assertTrue(GameShell.isMatchHealthUrl("https://runroad-convoy-alpha.onrender.com/health"))
        listOf("http://runroad-convoy-alpha.onrender.com/health", "https://runroad-convoy-alpha.onrender.com.evil.test/health",
            "https://runroad-convoy-alpha.onrender.com/health?redirect=1", "https://runroad-convoy-alpha.onrender.com/index.html")
            .forEach { assertFalse(GameShell.isMatchHealthUrl(it), it) }
    }
    @Test fun crewNetworkAllowanceIsNarrow() {
        assertTrue(GameShell.isOnlineRequestAllowed("${GameShell.matchOrigin}/crews", "GET"))
        assertTrue(GameShell.isOnlineRequestAllowed("${GameShell.matchOrigin}/crews/join", "POST"))
        assertTrue(GameShell.isOnlineRequestAllowed("${GameShell.authOrigin}/auth/v1/verify", "POST"))
        assertTrue(GameShell.isOnlineRequestAllowed("${GameShell.authOrigin}/auth/v1/token?grant_type=refresh_token", "POST"))
        listOf("${GameShell.matchOrigin}/crews?account_id=other", "${GameShell.matchOrigin}/crews/join?redirect=1",
            "${GameShell.authOrigin}.evil.test/auth/v1/verify", "${GameShell.authOrigin}/rest/v1/runroad_crews",
            "${GameShell.authOrigin}/auth/v1/admin/users", "http://rajkcmbdsnxdtajchuuy.supabase.co/auth/v1/verify")
            .forEach { assertFalse(GameShell.isOnlineRequestAllowed(it, "POST"), it) }
        assertFalse(GameShell.isOnlineRequestAllowed("${GameShell.matchOrigin}/crews/join", "DELETE"))
    }
    @Test fun localEntryIsAllowed() { assertTrue(GameShell.isBundledUrl(GameShell.androidEntry)) }
    @Test fun lookalikeOriginsAndPathsAreBlocked() {
        listOf("https://appassets.androidplatform.net.evil.test/assets/web/index.html",
            "http://appassets.androidplatform.net/assets/web/index.html",
            "https://example.com/", "https://appassets.androidplatform.net/assets/web/%2e%2e/secret", "https://appassets.androidplatform.net/assets/web/../secret")
            .forEach { assertFalse(GameShell.isBundledUrl(it), it) }
    }
}
