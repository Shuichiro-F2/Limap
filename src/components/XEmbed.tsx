import React, { useState } from 'react';
import { StyleSheet } from 'react-native';
import { WebView, type WebViewMessageEvent } from 'react-native-webview';

// ネイティブ版: DOMを直接扱えないため、X公式の埋め込みHTML
// (blockquote + widgets.js、Web版と同じもの)をWebView内に描画する。
// InstagramEmbed.tsxと同じ考え方で、埋め込み後の実際のコンテンツ高さを
// postMessageでネイティブ側に伝え、WebViewの高さをその都度追従させる。

function escapeHtmlAttr(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

function buildHtml(url: string): string {
  const safeUrl = escapeHtmlAttr(url);
  return `
<!DOCTYPE html>
<html>
  <head>
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <style>
      html, body { margin: 0; padding: 0; background: transparent; }
    </style>
  </head>
  <body>
    <blockquote class="twitter-tweet" data-dnt="true"><a href="${safeUrl}"></a></blockquote>
    <script async src="https://platform.twitter.com/widgets.js"></script>
    <script>
      function sendHeight() {
        var height = document.body ? document.body.scrollHeight : 0;
        if (window.ReactNativeWebView) {
          window.ReactNativeWebView.postMessage(String(height));
        }
      }
      var observer = new MutationObserver(sendHeight);
      observer.observe(document.documentElement, { childList: true, subtree: true, attributes: true });
      window.addEventListener('load', sendHeight);
      setTimeout(sendHeight, 1000);
      setTimeout(sendHeight, 2000);
      setTimeout(sendHeight, 3500);

      // 埋め込みが機能しない場合(非公開/削除済みの投稿など)は、空白のまま
      // 放置せず、投稿への外部リンクに置き換える。
      setTimeout(function () {
        var iframe = document.querySelector('iframe');
        var h = iframe ? iframe.getBoundingClientRect().height : 0;
        if (h < 40) {
          document.body.innerHTML =
            '<a href="${safeUrl}" style="display:block;padding:16px;text-align:center;border-radius:8px;text-decoration:none;font-size:14px;font-weight:600;background-color:#000000;color:#ffffff;border:1px solid rgba(255,255,255,0.15);">Xで投稿を見る ↗</a>';
          if (window.ReactNativeWebView) {
            window.ReactNativeWebView.postMessage('60');
          }
        }
      }, 2500);
    </script>
  </body>
</html>`;
}

const DEFAULT_HEIGHT = 420;
// Xからの高さ通知が届かなかった場合でも、埋め込みが完全に潰れて
// 見えなくなることがないよう、これより小さい値には縮めない。
const MIN_HEIGHT = 60;

type Props = { url: string; onHeightChange?: (height: number) => void };

export default function XEmbed({ url, onHeightChange }: Props) {
  const [height, setHeight] = useState(DEFAULT_HEIGHT);

  const onMessage = (event: WebViewMessageEvent) => {
    const parsed = Number(event.nativeEvent.data);
    if (!Number.isNaN(parsed) && parsed >= MIN_HEIGHT && parsed !== height) {
      setHeight(parsed);
      onHeightChange?.(parsed);
    }
  };

  return (
    <WebView
      source={{ html: buildHtml(url) }}
      style={[styles.webview, { height }]}
      originWhitelist={['*']}
      javaScriptEnabled
      domStorageEnabled
      scrollEnabled={false}
      onMessage={onMessage}
      allowsInlineMediaPlayback
      androidLayerType="hardware"
    />
  );
}

const styles = StyleSheet.create({
  webview: { width: '100%', backgroundColor: 'transparent' },
});
