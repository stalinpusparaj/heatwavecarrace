# Room finds generated *_Impl databases by reflection. WorkManager (pulled in by the ads SDK) crashes
# at startup in minified builds without this: "Failed to create an instance of androidx.work.impl.WorkDatabase".
-keep class * extends androidx.room.RoomDatabase { <init>(); }
