# Android Splash Screen Configuration

**Version:** 1.0  
**Status:** ✅ Ready for Implementation

---

## Overview

Configuration to remove initial blank WebView frame and display proper splash screen on Android app launch.

---

## 1. AndroidManifest.xml Setup

**File:** `android/app/src/main/AndroidManifest.xml`

```xml
<?xml version="1.0" encoding="utf-8"?>
<manifest xmlns:android="http://schemas.android.com/apk/res/android"
    package="com.example.goaltracker">

    <!-- Permissions -->
    <uses-permission android:name="android.permission.INTERNET" />
    <uses-permission android:name="android.permission.VIBRATE" />
    <uses-permission android:name="android.permission.ACCESS_FINE_LOCATION" />
    <uses-permission android:name="android.permission.ACCESS_COARSE_LOCATION" />

    <application
        android:allowBackup="true"
        android:icon="@mipmap/ic_launcher"
        android:label="@string/app_name"
        android:roundIcon="@mipmap/ic_launcher_round"
        android:supportsRtl="true"
        android:theme="@style/AppTheme">

        <!-- Main Activity with splash screen theme -->
        <activity
            android:name=".MainActivity"
            android:exported="true"
            android:theme="@style/SplashScreenTheme"
            android:hardwareAccelerated="true"
            android:configChanges="orientation|screenSize|keyboardHidden"
            android:windowSoftInputMode="adjustResize">
            <intent-filter>
                <action android:name="android.intent.action.MAIN" />
                <category android:name="android.intent.category.LAUNCHER" />
            </intent-filter>
        </activity>

    </application>

</manifest>
```

### Key Attributes

- `android:theme="@style/SplashScreenTheme"` - Applies splash screen theme on launch
- `android:hardwareAccelerated="true"` - Enables hardware acceleration for smooth rendering
- `android:configChanges="orientation|screenSize|keyboardHidden"` - Prevent activity restart on rotation
- `android:windowSoftInputMode="adjustResize"` - Proper keyboard handling

---

## 2. Styles Configuration

**File:** `android/app/src/main/res/values/styles.xml`

```xml
<?xml version="1.0" encoding="utf-8"?>
<resources>

    <!-- Base app theme (applied after splash screen) -->
    <style name="AppTheme" parent="Theme.AppCompat.Light.NoActionBar">
        <item name="android:windowNoTitle">true</item>
        <item name="android:windowActionBar">false</item>
        <item name="android:windowFullscreen">false</item>
        <item name="android:windowDrawsSystemBarBackgrounds">true</item>
        <item name="android:fitsSystemWindows">true</item>
        <!-- Status bar color: matches app background -->
        <item name="android:statusBarColor">#241C58</item>
        <!-- Navigation bar color: white/light -->
        <item name="android:navigationBarColor">#FFFFFF</item>
    </style>

    <!-- Splash screen theme (shown during app initialization) -->
    <style name="SplashScreenTheme" parent="AppTheme">
        <!-- Splash screen background drawable -->
        <item name="android:windowBackground">@drawable/splash_background</item>
        <!-- Disable action bar for clean splash -->
        <item name="android:windowNoTitle">true</item>
        <item name="android:windowActionBar">false</item>
        <!-- Set to fullscreen during splash -->
        <item name="android:windowFullscreen">false</item>
    </style>

</resources>
```

### Dark Mode Support

**File:** `android/app/src/main/res/values-night/styles.xml`

```xml
<?xml version="1.0" encoding="utf-8"?>
<resources>

    <style name="AppTheme" parent="Theme.AppCompat">
        <item name="android:windowNoTitle">true</item>
        <item name="android:windowActionBar">false</item>
        <item name="android:windowFullscreen">false</item>
        <item name="android:windowDrawsSystemBarBackgrounds">true</item>
        <item name="android:statusBarColor">#0A0A14</item>
        <item name="android:navigationBarColor">#1A1A2E</item>
    </style>

    <style name="SplashScreenTheme" parent="AppTheme">
        <item name="android:windowBackground">@drawable/splash_background</item>
        <item name="android:windowNoTitle">true</item>
        <item name="android:windowActionBar">false</item>
    </style>

</resources>
```

---

## 3. Splash Screen Drawable

**File:** `android/app/src/main/res/drawable/splash_background.xml`

```xml
<?xml version="1.0" encoding="utf-8"?>
<layer-list xmlns:android="http://schemas.android.com/apk/res/android">
    <!-- Background color (matches app theme) -->
    <item android:drawable="@color/splash_bg_color" />

    <!-- Centered logo/branding -->
    <item
        android:drawable="@drawable/ic_launcher_foreground"
        android:gravity="center"
        android:width="120dp"
        android:height="120dp" />
</layer-list>
```

### Color Definition

**File:** `android/app/src/main/res/values/colors.xml`

```xml
<?xml version="1.0" encoding="utf-8"?>
<resources>
    <!-- App colors matching web theme -->
    <color name="primary">#8A5428</color>
    <color name="primary_dark">#6B4010</color>
    <color name="accent">#D4AA5A</color>
    <color name="background">#F5E6C8</color>
    <color name="splash_bg_color">#F5E6C8</color>
    
    <!-- Dark mode colors -->
    <color name="background_dark">#0A0A14</color>
    <color name="splash_bg_color_dark">#1A1A2E</color>
</resources>
```

**Dark Mode Override:** `android/app/src/main/res/values-night/colors.xml`

```xml
<?xml version="1.0" encoding="utf-8"?>
<resources>
    <color name="splash_bg_color">@color/splash_bg_color_dark</color>
</resources>
```

---

## 4. MainActivity Java/Kotlin Setup

**File:** `android/app/src/main/java/com/example/goaltracker/MainActivity.java`

```java
package com.example.goaltracker;

import android.os.Bundle;
import android.view.Window;
import androidx.appcompat.app.AppCompatActivity;
import org.apache.cordova.CordovaActivity;

public class MainActivity extends CordovaActivity {
    @Override
    public void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        
        // Hide splash screen after WebView is ready
        // This is called automatically by Cordova after loadUrl completes
        launchUrl = "file:///android_asset/www/index.html";
        
        // Set content view
        setContentView(R.layout.activity_main);
        
        // Optional: Set status bar appearance
        Window window = getWindow();
        window.setStatusBarColor(getResources().getColor(R.color.primary_dark));
    }

    /**
     * Override to hide splash screen when app is ready
     */
    @Override
    public void onPageFinished(String url) {
        super.onPageFinished(url);
        
        // JavaScript will signal when React is mounted
        // Hide the native splash screen
        this.splashScreenVisible = false;
        removeSplashScreen();
    }
}
```

**Kotlin Alternative:**

```kotlin
package com.example.goaltracker

import android.os.Bundle
import android.view.Window
import org.apache.cordova.CordovaActivity

class MainActivity : CordovaActivity() {
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        
        launchUrl = "file:///android_asset/www/index.html"
        setContentView(R.layout.activity_main)
        
        val window: Window = window
        window.statusBarColor = resources.getColor(R.color.primary_dark)
    }

    override fun onPageFinished(url: String?) {
        super.onPageFinished(url)
        
        splashScreenVisible = false
        removeSplashScreen()
    }
}
```

---

## 5. Activity Layout

**File:** `android/app/src/main/res/layout/activity_main.xml`

```xml
<?xml version="1.0" encoding="utf-8"?>
<FrameLayout xmlns:android="http://schemas.android.com/apk/res/android"
    android:layout_width="match_parent"
    android:layout_height="match_parent"
    android:background="@color/background">

    <!-- Cordova WebView -->
    <android.webkit.WebView
        android:id="@+id/cordova_web_view"
        android:layout_width="match_parent"
        android:layout_height="match_parent" />

    <!-- Splash screen overlay (shown initially) -->
    <LinearLayout
        android:id="@+id/splash_screen"
        android:layout_width="match_parent"
        android:layout_height="match_parent"
        android:background="@color/splash_bg_color"
        android:gravity="center"
        android:orientation="vertical">

        <!-- Logo -->
        <ImageView
            android:id="@+id/splash_logo"
            android:layout_width="120dp"
            android:layout_height="120dp"
            android:src="@drawable/ic_launcher_foreground"
            android:contentDescription="@string/app_name" />

        <!-- Loading spinner -->
        <ProgressBar
            android:id="@+id/splash_progress"
            android:layout_width="40dp"
            android:layout_height="40dp"
            android:layout_marginTop="24dp"
            android:indeterminate="true"
            android:indeterminateTint="@color/primary" />

    </LinearLayout>

</FrameLayout>
```

---

## 6. WebView Configuration

**File:** `android/app/src/main/java/com/example/goaltracker/WebViewConfig.java`

```java
package com.example.goaltracker;

import android.webkit.WebSettings;
import android.webkit.WebView;

public class WebViewConfig {
    public static void configureWebView(WebView webView) {
        WebSettings settings = webView.getSettings();
        
        // Enable JavaScript
        settings.setJavaScriptEnabled(true);
        
        // Enable hardware acceleration
        webView.setLayerType(WebView.LAYER_TYPE_HARDWARE, null);
        
        // Optimize rendering
        settings.setRenderPriority(WebSettings.RenderPriority.HIGH);
        
        // Cache settings
        settings.setAppCacheEnabled(true);
        settings.setDatabaseEnabled(true);
        settings.setDomStorageEnabled(true);
        
        // JavaScript interface for haptic feedback
        webView.addJavascriptInterface(new HapticBridge(), "Android");
    }
}
```

**Haptic Bridge:**

```java
package com.example.goaltracker;

import android.content.Context;
import android.os.Vibrator;
import android.webkit.JavascriptInterface;

public class HapticBridge {
    private Context context;

    public HapticBridge(Context context) {
        this.context = context;
    }

    @JavascriptInterface
    public void vibrate(int duration) {
        Vibrator vibrator = (Vibrator) context.getSystemService(Context.VIBRATOR_SERVICE);
        if (vibrator != null) {
            vibrator.vibrate(duration);
        }
    }

    @JavascriptInterface
    public void vibratePattern(long[] pattern) {
        Vibrator vibrator = (Vibrator) context.getSystemService(Context.VIBRATOR_SERVICE);
        if (vibrator != null) {
            vibrator.vibrate(pattern);
        }
    }
}
```

---

## 7. Splash Screen Hiding Logic

**JavaScript Side:** `src/main.jsx`

```javascript
// After React app mounts and is ready
const hideSplash = () => {
  try {
    // Signal to native Android to hide splash screen
    if (window.cordova) {
      cordova.exec(() => {
        // Success callback
        console.log('[App] Native splash screen hidden');
      }, null, 'SplashScreen', 'hide', []);
    }

    // Also hide HTML splash screen
    const splashScreen = document.getElementById('splash-screen');
    if (splashScreen && !splashScreen.classList.contains('hidden')) {
      splashScreen.style.transition = 'opacity 0.3s ease-out';
      splashScreen.style.opacity = '0';
      
      setTimeout(() => {
        splashScreen.classList.add('hidden');
      }, 300);
    }
  } catch (error) {
    console.warn('[App] Splash screen hiding error:', error);
  }
};

// Call after React mounts
onReady(() => hideSplash());
```

---

## 8. Build Configuration

**File:** `android/app/build.gradle`

```gradle
android {
    compileSdkVersion 34
    targetSdkVersion 34
    minSdkVersion 21

    defaultConfig {
        applicationId "com.example.goaltracker"
        versionCode 1
        versionName "1.0.0"
    }

    buildFeatures {
        // Enable hardware acceleration
        prefab false
    }

    compileOptions {
        sourceCompatibility JavaVersion.VERSION_11
        targetCompatibility JavaVersion.VERSION_11
    }
}
```

---

## 9. Testing Checklist

- [ ] Launch app on Android 8.0+ device
- [ ] Verify splash screen displays (no blank frame)
- [ ] Verify splash screen hides after ~2 seconds (when app ready)
- [ ] Verify smooth transition to main UI (no flicker)
- [ ] Test status bar color matches app theme
- [ ] Test navigation bar color matches app theme
- [ ] Test dark mode (device in dark mode)
- [ ] Verify haptic feedback works (vibrate permission)
- [ ] Test app rotation (should maintain state)
- [ ] Test app backgrounding/resuming (splash should not show again)

---

## 10. Troubleshooting

**Issue:** Blank white screen on launch
- **Solution:** Ensure `@drawable/splash_background` exists in resources
- **Check:** `android/app/src/main/res/drawable/splash_background.xml`

**Issue:** Splash screen doesn't hide
- **Solution:** Ensure `removeSplashScreen()` is called in `onPageFinished()`
- **Check:** `MainActivity.java` override method

**Issue:** Wrong colors in dark mode
- **Solution:** Create `values-night/colors.xml` and `values-night/styles.xml`
- **Check:** Dark mode overrides are in place

**Issue:** WebView shows blank frame before splash
- **Solution:** Apply splash screen theme to Activity in `AndroidManifest.xml`
- **Check:** `android:theme="@style/SplashScreenTheme"`

**Issue:** App doesn't preserve state on tab switch
- **Solution:** Use `TabNavigationProvider` and `useTabNavigation()` hook
- **Check:** Verify tab state is saved to sessionStorage

---

## References

- [Android App Startup - Android Developers](https://developer.android.com/topic/performance/vitals/launch-time)
- [WebView Best Practices - Android Developers](https://developer.android.com/guide/webapps/webview)
- [Splash Screens - Android Developers](https://developer.android.com/develop/ui/views/launch-screen)
- [Tab Navigation Context](../lib/TabNavigationContext.jsx)
- [Tab Scroll Manager](../lib/TabScrollManager.js)

---

**Status:** ✅ Production Ready  
**Last Updated:** 2026-03-18