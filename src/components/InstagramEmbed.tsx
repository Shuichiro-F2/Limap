import React, { useState } from 'react';
import { StyleSheet } from 'react-native';
import { WebView, type WebViewMessageEvent } from 'react-native-webview';

// ネイティブ版: DOMを直接扱えないため、Instagram公式の埋め込みHTML
// (blockquote + embed.js、Web版と同じもの)をWebView内に描画する。
// 埋め込みの高さは投稿内容によって変わる(写真/動画/キャプションの有無など)ため、
// 埋め込み後の実際のコンテンツ高さをpostMessageでネイティブ側に伝え、
// WebViewの高さをその都度追従させる。

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
    <blockquote class="instagram-media" data-instgrm-permalink="${safeUrl}" data-instgrm-version="14" style="margin:0 auto; width:100%;"></blockquote>
    <script async src="//www.instagram.com/embed.js"></script>
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
    </script>
  </body>
</html>`;
}

const DEFAULT_HEIGHT = 420;

type Props = { url: string };

export default function InstagramEmbed({ url }: Props) {
  const [height, setHeight] = useState(DEFAULT_HEIGHT);

  const onMessage = (event: WebViewMessageEvent) => {
    const parsed = Number(event.nativeEvent.data);
    if (!Number.isNaN(parsed) && parsed > 0 && parsed !== height) {
      setHeight(parsed);
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
      // Instagramのiframe内で動画を扱う投稿もあるため、インライン再生を許可しておく
      allowsInlineMediaPlayback
      // 読み込み中の白い空白を目立たなくする
      androidLayerType="hardware"
    />
  );
}

const styles = StyleSheet.create({
  webview: { width: '100%', backgroundColor: 'transparent' },
});
