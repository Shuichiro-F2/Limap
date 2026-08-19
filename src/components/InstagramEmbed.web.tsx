import React, { useEffect, useRef } from 'react';
import { View } from 'react-native';

// Web版: Instagram公式の埋め込み方式(blockquote + embed.js)をそのまま利用する。
// 画像・動画ファイルを直接抜き出すのではなく、Instagram自身のスクリプトが
// 投稿ページから内容を取得してiframeとして描画する、公式に用意された埋め込み手段。

declare global {
  interface Window {
    instgrm?: { Embeds: { process: () => void } };
  }
}

let embedScriptPromise: Promise<void> | null = null;

function loadEmbedScript(): Promise<void> {
  if (typeof window === 'undefined' || typeof document === 'undefined') return Promise.resolve();
  if (window.instgrm) return Promise.resolve();
  if (embedScriptPromise) return embedScriptPromise;

  embedScriptPromise = new Promise((resolve) => {
    const script = document.createElement('script');
    script.src = '//www.instagram.com/embed.js';
    script.async = true;
    script.onload = () => resolve();
    script.onerror = () => resolve();
    document.body.appendChild(script);
  });
  return embedScriptPromise;
}

function escapeHtmlAttr(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

type Props = { url: string };

export default function InstagramEmbed({ url }: Props) {
  const containerRef = useRef<View>(null);

  useEffect(() => {
    const node = containerRef.current as unknown as HTMLDivElement | null;
    if (!node) return;

    const safeUrl = escapeHtmlAttr(url);
    node.innerHTML = `
      <blockquote class="instagram-media" data-instgrm-permalink="${safeUrl}" data-instgrm-version="14" style="margin:0 auto; width:100%;"></blockquote>
    `;

    loadEmbedScript().then(() => {
      window.instgrm?.Embeds.process();
    });
  }, [url]);

  return <View ref={containerRef} style={{ width: '100%' }} />;
}
