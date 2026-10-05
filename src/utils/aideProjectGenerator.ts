// Complete Android Project generator specifically engineered for AIDE (Android IDE for phones)

export interface AideProjectFile {
  path: string;
  name: string;
  description: string;
  language: 'xml' | 'java' | 'gradle' | 'json';
  content: string;
}

export function getAideProjectFiles(): AideProjectFile[] {
  return [
    {
      path: 'AndroidManifest.xml',
      name: 'AndroidManifest.xml',
      description: 'Configures permissions, hardware acceleration, and audio capabilities for AIDE',
      language: 'xml',
      content: `<?xml version="1.0" encoding="utf-8"?>
<manifest xmlns:android="http://schemas.android.com/apk/res/android"
    package="com.aurawave.musicstudio"
    android:versionCode="1"
    android:versionName="1.0.0">

    <!-- Permissions required for audio generation, storage, and networking -->
    <uses-permission android:name="android.permission.INTERNET" />
    <uses-permission android:name="android.permission.ACCESS_NETWORK_STATE" />
    <uses-permission android:name="android.permission.MODIFY_AUDIO_SETTINGS" />
    <uses-permission android:name="android.permission.RECORD_AUDIO" />
    <uses-permission android:name="android.permission.WAKE_LOCK" />
    <uses-permission android:name="android.permission.WRITE_EXTERNAL_STORAGE" android:maxSdkVersion="28" />
    <uses-permission android:name="android.permission.READ_EXTERNAL_STORAGE" />

    <application
        android:allowBackup="true"
        android:icon="@mipmap/ic_launcher"
        android:label="@string/app_name"
        android:theme="@style/AppTheme"
        android:hardwareAccelerated="true"
        android:largeHeap="true"
        android:usesCleartextTraffic="true">

        <activity
            android:name=".MainActivity"
            android:label="@string/app_name"
            android:configChanges="orientation|screenSize|screenLayout|keyboardHidden"
            android:screenOrientation="sensorLandscape"
            android:windowSoftInputMode="adjustResize"
            android:exported="true">
            <intent-filter>
                <action android:name="android.intent.action.MAIN" />
                <category android:name="android.intent.category.LAUNCHER" />
            </intent-filter>
        </activity>
    </application>
</manifest>`,
    },
    {
      path: 'app/build.gradle',
      name: 'build.gradle',
      description: 'Gradle configuration fully compatible with AIDE mobile compiler',
      language: 'gradle',
      content: `apply plugin: 'com.android.application'

android {
    compileSdkVersion 33
    buildToolsVersion "30.0.3"

    defaultConfig {
        applicationId "com.aurawave.musicstudio"
        minSdkVersion 21
        targetSdkVersion 33
        versionCode 1
        versionName "1.0.0"
        multiDexEnabled true
    }

    buildTypes {
        release {
            minifyEnabled false
            proguardFiles getDefaultProguardFile('proguard-android.txt'), 'proguard-rules.pro'
        }
        debug {
            debuggable true
        }
    }

    compileOptions {
        sourceCompatibility JavaVersion.VERSION_1_8
        targetCompatibility JavaVersion.VERSION_1_8
    }
}

dependencies {
    implementation 'androidx.appcompat:appcompat:1.6.1'
    implementation 'com.google.android.material:material:1.9.0'
    implementation 'androidx.webkit:webkit:1.7.0'
}`,
    },
    {
      path: 'app/src/main/java/com/aurawave/musicstudio/MainActivity.java',
      name: 'MainActivity.java',
      description: 'Native Android Activity with low-latency Web Audio, immersive UI and AIDE bridge',
      language: 'java',
      content: `package com.aurawave.musicstudio;

import android.app.Activity;
import android.os.Build;
import android.os.Bundle;
import android.view.View;
import android.view.Window;
import android.view.WindowManager;
import android.webkit.PermissionRequest;
import android.webkit.WebChromeClient;
import android.webkit.WebSettings;
import android.webkit.WebView;
import android.webkit.WebViewClient;
import android.webkit.JavascriptInterface;
import android.widget.Toast;
import android.media.AudioFormat;
import android.media.AudioManager;
import android.media.AudioTrack;

public class MainActivity extends Activity {

    private WebView mWebView;
    private AudioTrack mAudioTrack;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);

        // Keep screen on for continuous music production
        getWindow().addFlags(WindowManager.LayoutParams.FLAG_KEEP_SCREEN_ON);

        // Enable immersive full-screen mode on phones
        hideSystemUI();

        setContentView(R.layout.activity_main);

        mWebView = findViewById(R.id.webview);
        setupWebView();
    }

    private void setupWebView() {
        WebSettings settings = mWebView.getSettings();
        settings.setJavaScriptEnabled(true);
        settings.setDomStorageEnabled(true);
        settings.setDatabaseEnabled(true);
        settings.setAllowFileAccess(true);
        settings.setAllowContentAccess(true);
        settings.setMediaPlaybackRequiresUserGesture(false);
        settings.setLoadWithOverviewMode(true);
        settings.setUseWideViewPort(true);
        settings.setSupportZoom(false);

        // Hardware acceleration for 60fps audio visualizer
        mWebView.setLayerType(View.LAYER_TYPE_HARDWARE, null);

        // Enable WebAudio permissions and debugging in AIDE
        mWebView.setWebChromeClient(new WebChromeClient() {
            @Override
            public void onPermissionRequest(final PermissionRequest request) {
                if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.LOLLIPOP) {
                    request.grant(request.getResources());
                }
            }
        });

        mWebView.setWebViewClient(new WebViewClient());

        // Native Android Bridge for AIDE
        mWebView.addJavascriptInterface(new Object() {
            @JavascriptInterface
            public void showToast(String message) {
                Toast.makeText(MainActivity.this, message, Toast.LENGTH_SHORT).show();
            }

            @JavascriptInterface
            public void playHapticFeedback() {
                mWebView.performHapticFeedback(android.view.HapticFeedbackConstants.VIRTUAL_KEY);
            }
        }, "AndroidAideBridge");

        // Load local studio or URL
        mWebView.loadUrl("file:///android_asset/index.html");
    }

    private void hideSystemUI() {
        View decorView = getWindow().getDecorView();
        decorView.setSystemUiVisibility(
            View.SYSTEM_UI_FLAG_IMMERSIVE_STICKY
            | View.SYSTEM_UI_FLAG_LAYOUT_STABLE
            | View.SYSTEM_UI_FLAG_LAYOUT_HIDE_NAVIGATION
            | View.SYSTEM_UI_FLAG_LAYOUT_FULLSCREEN
            | View.SYSTEM_UI_FLAG_HIDE_NAVIGATION
            | View.SYSTEM_UI_FLAG_FULLSCREEN
        );
    }

    @Override
    public void onWindowFocusChanged(boolean hasFocus) {
        super.onWindowFocusChanged(hasFocus);
        if (hasFocus) {
            hideSystemUI();
        }
    }

    @Override
    public void onBackPressed() {
        if (mWebView != null && mWebView.canGoBack()) {
            mWebView.goBack();
        } else {
            super.onBackPressed();
        }
    }
}`,
    },
    {
      path: 'app/src/main/res/layout/activity_main.xml',
      name: 'activity_main.xml',
      description: 'Fullscreen responsive Android view layout',
      language: 'xml',
      content: `<?xml version="1.0" encoding="utf-8"?>
<RelativeLayout xmlns:android="http://schemas.android.com/apk/res/android"
    android:layout_width="match_parent"
    android:layout_height="match_parent"
    android:background="#09090b">

    <WebView
        android:id="@+id/webview"
        android:layout_width="match_parent"
        android:layout_height="match_parent" />

</RelativeLayout>`,
    },
    {
      path: 'app/src/main/res/values/strings.xml',
      name: 'strings.xml',
      description: 'App name and Android UI strings',
      language: 'xml',
      content: `<?xml version="1.0" encoding="utf-8"?>
<resources>
    <string name="app_name">AuraWave Studio</string>
</resources>`,
    },
    {
      path: 'app/src/main/res/values/styles.xml',
      name: 'styles.xml',
      description: 'Immersive Dark Theme for mobile AIDE app',
      language: 'xml',
      content: `<?xml version="1.0" encoding="utf-8"?>
<resources>
    <style name="AppTheme" parent="android:Theme.Black.NoTitleBar.Fullscreen">
        <item name="android:windowNoTitle">true</item>
        <item name="android:windowFullscreen">true</item>
        <item name="android:windowContentOverlay">@null</item>
    </style>
</resources>`,
    },
  ];
}
