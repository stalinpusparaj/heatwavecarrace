import java.util.Properties
plugins { id("com.android.application") }

abstract class SyncGameAssets : DefaultTask() {
    @get:InputDirectory @get:PathSensitive(PathSensitivity.RELATIVE)
    abstract val gameDirectory: DirectoryProperty
    @get:OutputDirectory abstract val outputDirectory: DirectoryProperty
    @get:InputFiles @get:PathSensitive(PathSensitivity.RELATIVE) abstract val licenses: ConfigurableFileCollection
    @get:Inject abstract val fs: FileSystemOperations
    @TaskAction fun copyGame() { fs.sync { from(gameDirectory) { into("web"); exclude("**/.DS_Store") }; from(licenses) { into("licenses") }; into(outputDirectory) } }
}
val gameAssets = tasks.register<SyncGameAssets>("syncGameAssets") {
    gameDirectory.set(rootProject.layout.projectDirectory.dir("../dist"))
    outputDirectory.set(layout.buildDirectory.dir("generated/gameAssets"))
    licenses.from(rootProject.fileTree("../docs") { include("*-OFL.txt") })
}
// Store configuration lives in mobile/release.properties (git-ignored); see docs/STORE_RELEASE.md.
val storeProps = Properties().also { props -> rootProject.file("release.properties").takeIf { it.exists() }?.inputStream()?.use { props.load(it) } }
fun setting(key: String): String = storeProps.getProperty(key) ?: providers.gradleProperty(key).orNull ?: ""
// Optional: reuse an existing Android keystore.properties (storePassword/keyAlias/keyPassword) so passwords stay in one place.
val signingProps = Properties().also { props -> setting("runroad.keystoreProperties").takeIf { it.isNotBlank() }?.let { file(it) }?.takeIf { it.exists() }?.inputStream()?.use { props.load(it) } }
fun signing(key: String, standard: String): String = setting("runroad.$key").ifBlank { signingProps.getProperty(standard) ?: "" }
// Google's published test IDs: debug builds always use them so development never serves live ads.
val testAdmobApp = "ca-app-pub-3940256099942544~3347511713"
val testRewarded = "ca-app-pub-3940256099942544/5224354917"
android {
    namespace = "com.stalinpusparaj.heatwave"
    compileSdk = 37
    defaultConfig {
        applicationId = "com.gemmyapps.RUNROAD"
        minSdk = 24; targetSdk = 36
        versionCode = setting("runroad.versionCode").ifBlank { "1" }.toInt()
        versionName = setting("runroad.versionName").ifBlank { "1.0.0" }
        buildConfigField("String", "REVENUECAT_KEY", "\"${setting("runroad.revenuecatKey")}\"")
    }
    signingConfigs { if (setting("runroad.storeFile").isNotBlank()) create("release") {
        storeFile = rootProject.file(setting("runroad.storeFile"))
        storePassword = signing("storePassword", "storePassword"); keyAlias = signing("keyAlias", "keyAlias"); keyPassword = signing("keyPassword", "keyPassword")
    } }
    buildFeatures { buildConfig = true }
    buildTypes {
        debug {
            manifestPlaceholders["admobAppId"] = testAdmobApp
            buildConfigField("String", "ADMOB_REWARDED_ID", "\"$testRewarded\"")
        }
        release {
            isMinifyEnabled = true; isShrinkResources = true
            proguardFiles(getDefaultProguardFile("proguard-android-optimize.txt"), "proguard-rules.pro")
            signingConfigs.findByName("release")?.let { signingConfig = it }
            manifestPlaceholders["admobAppId"] = setting("runroad.admobAppId").ifBlank { testAdmobApp }
            buildConfigField("String", "ADMOB_REWARDED_ID", "\"${setting("runroad.admobRewardedId").ifBlank { testRewarded }}\"")
        }
    }
    compileOptions { sourceCompatibility = JavaVersion.VERSION_17; targetCompatibility = JavaVersion.VERSION_17 }
}
androidComponents { onVariants { it.sources.assets?.addGeneratedSourceDirectory(gameAssets, SyncGameAssets::outputDirectory) } }
dependencies { implementation(project(":shared")); implementation("com.revenuecat.purchases:purchases:10.24.2"); implementation("com.google.android.gms:play-services-ads:25.4.0"); implementation("com.google.android.ump:user-messaging-platform:3.2.0"); implementation("androidx.webkit:webkit:1.17.1"); implementation("androidx.core:core:1.19.1") }

// A store build must carry real AdMob IDs and the RevenueCat Google API key. Set runroad.allowTestIds=true only for local release checks.
tasks.matching { it.name == "preReleaseBuild" }.configureEach { doFirst {
    if (setting("runroad.allowTestIds") != "true") {
        val missing = listOf("runroad.admobAppId", "runroad.admobRewardedId", "runroad.revenuecatKey").filter { setting(it).isBlank() || setting(it).startsWith("ca-app-pub-3940256099942544") }
        if (missing.isNotEmpty()) throw GradleException("Release build is missing store settings: ${missing.joinToString()}. See docs/STORE_RELEASE.md.")
    }
} }
