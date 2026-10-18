package com.stalinpusparaj.heatwave.shared
import kotlin.test.*
class GameShellTest {
    @Test fun matchHealthAllowanceIsExact() {
        assertTrue(GameShell.isMatchHealthUrl("https://runroad-convoy-alpha.onrender.com/health"))
        listOf("http://runroad-convoy-alpha.onrender.com/health", "https://runroad-convoy-alpha.onrender.com.evil.test/health",
            "https://runroad-convoy-alpha.onrender.com/health?redirect=1", "https://runroad-convoy-alpha.onrender.com/index.html")
            .forEach { assertFalse(GameShell.isMatchHealthUrl(it), it) }
    }
    @Test fun localEntryIsAllowed() { assertTrue(GameShell.isBundledUrl(GameShell.androidEntry)) }
    @Test fun lookalikeOriginsAndPathsAreBlocked() {
        listOf("https://appassets.androidplatform.net.evil.test/assets/web/index.html",
            "http://appassets.androidplatform.net/assets/web/index.html",
            "https://example.com/", "https://appassets.androidplatform.net/assets/web/%2e%2e/secret", "https://appassets.androidplatform.net/assets/web/../secret")
            .forEach { assertFalse(GameShell.isBundledUrl(it), it) }
    }
}
