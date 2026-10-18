plugins {
    id("org.jetbrains.kotlin.multiplatform")
    id("com.android.kotlin.multiplatform.library")
}
kotlin {
    android { namespace = "com.stalinpusparaj.heatwave.shared"; compileSdk = 37; minSdk = 24 }
    jvm()
    listOf(iosArm64(), iosSimulatorArm64()).forEach {
        it.binaries.framework { baseName = "HeatwaveShared"; isStatic = true }
    }
    sourceSets { commonTest.dependencies { implementation(kotlin("test")) } }
}
