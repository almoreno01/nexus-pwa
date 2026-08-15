package com.yester.controlremesas;

import android.app.Activity;
import android.os.Bundle;
import android.webkit.JavascriptInterface;
import android.webkit.WebChromeClient;
import android.webkit.WebView;
import android.webkit.WebViewClient;
import android.content.SharedPreferences;

import org.json.JSONObject;

import java.io.BufferedReader;
import java.io.InputStreamReader;
import java.net.HttpURLConnection;
import java.net.URL;
import java.nio.charset.StandardCharsets;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;

public class MainActivity extends Activity {
    private WebView webView;
    private SharedPreferences prefs;
    private final ExecutorService executor = Executors.newCachedThreadPool();

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        prefs = getSharedPreferences("control_remesas", MODE_PRIVATE);

        webView = new WebView(this);
        setContentView(webView);

        webView.getSettings().setJavaScriptEnabled(true);
        webView.getSettings().setDomStorageEnabled(true);
        webView.getSettings().setAllowFileAccess(true);
        webView.setWebViewClient(new WebViewClient());
        webView.setWebChromeClient(new WebChromeClient());
        webView.addJavascriptInterface(new NativeBridge(), "NativeApp");
        webView.loadUrl("file:///android_asset/index.html");
    }

    @Override
    public void onBackPressed() {
        if (webView != null && webView.canGoBack()) webView.goBack();
        else super.onBackPressed();
    }

    public class NativeBridge {
        @JavascriptInterface
        public String getDocuments() {
            return prefs.getString("documents", "");
        }

        @JavascriptInterface
        public void setDocuments(String json) {
            prefs.edit().putString("documents", json).apply();
        }

        @JavascriptInterface
        public void fetchUrl(String url, String callbackId) {
            executor.execute(() -> {
                int status = 0;
                String body = "";
                String error = "";
                HttpURLConnection conn = null;
                try {
                    URL target = new URL(url);
                    conn = (HttpURLConnection) target.openConnection();
                    conn.setInstanceFollowRedirects(true);
                    conn.setConnectTimeout(15000);
                    conn.setReadTimeout(30000);
                    conn.setRequestProperty("User-Agent", "ControlRemesas/1.0 Android");
                    status = conn.getResponseCode();
                    BufferedReader reader = new BufferedReader(new InputStreamReader(
                        status >= 200 && status < 400 ? conn.getInputStream() : conn.getErrorStream(),
                        StandardCharsets.UTF_8
                    ));
                    StringBuilder sb = new StringBuilder();
                    String line;
                    while ((line = reader.readLine()) != null) sb.append(line).append('\n');
                    reader.close();
                    body = sb.toString();
                } catch (Exception e) {
                    error = e.getMessage() == null ? e.toString() : e.getMessage();
                } finally {
                    if (conn != null) conn.disconnect();
                }

                final int finalStatus = status;
                final String finalBody = body;
                final String finalError = error;
                runOnUiThread(() -> {
                    String js = "window.__nativeFetchResolve(" +
                        JSONObject.quote(callbackId) + "," +
                        finalStatus + "," +
                        JSONObject.quote(finalBody) + "," +
                        JSONObject.quote(finalError) + ");";
                    webView.evaluateJavascript(js, null);
                });
            });
        }
    }
}
