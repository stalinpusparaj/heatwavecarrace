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
android {
    namespace = "com.stalinpusparaj.heatwave"
    compileSdk = 37
    defaultConfig {
        applicationId = "com.gemmyapps.RUNROAD"
        minSdk = 24; targetSdk = 36
        versionCode = 1; versionName = "1.0.0"
    }
    buildFeatures { buildConfig = true }
    buildTypes { release {
        isMinifyEnabled = true; isShrinkResources = true
        proguardFiles(getDefaultProguardFile("proguard-android-optimize.txt"))
    } }
    compileOptions { sourceCompatibility = JavaVersion.VERSION_17; targetCompatibility = JavaVersion.VERSION_17 }
}
androidComponents { onVariants { it.sources.assets?.addGeneratedSourceDirectory(gameAssets, SyncGameAssets::outputDirectory) } }
dependencies { implementation(project(":shared")); implementation("com.android.billingclient:billing:9.1.0"); implementation("androidx.webkit:webkit:1.17.1"); implementation("androidx.core:core:1.19.1") }
