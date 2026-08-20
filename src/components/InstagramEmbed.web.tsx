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

// 一部のブラウザ(Brave標準のShields、各種プライバシー系拡張機能など)は、
// Instagram公式の埋め込みiframe自体の読み込みは許可しつつ、
// iframeが実際の高さを親ページへ伝えるpostMessage通信だけをブロックすることがある。
// この場合iframeの高さが0のまま止まってしまい、見た目には何も表示されていないのと同じになる。
// そこで一定時間待っても高さがつかない場合は、Instagramへの外部リンクにフォールバックする。
const RESIZE_TIMEOUT_MS = 2500;

type Props = { url: string };

export default function InstagramEmbed({ url }: Props) {
  const containerRef = useRef<View>(null);

  useEffect(() => {
    const node = containerRef.current as unknown as HTMLDivElement | null;
    if (!node) return;
    let cancelled = false;

    const safeUrl = escapeHtmlAttr(url);
    node.innerHTML = `
      <blockquote class="instagram-media" data-instgrm-permalink="${safeUrl}" data-instgrm-version="14" style="margin:0 auto; width:100%;"></blockquote>
    `;

    loadEmbedScript().then(() => {
      if (cancelled) return;
      window.instgrm?.Embeds.process();

      // 処理後もiframeの高さが0のまま(=何らかの理由で埋め込みが機能していない)場合は、
      // 空白のまま放置せず、投稿へのリンクとして最低限機能するようにする。
      setTimeout(() => {
        if (cancelled) return;
        const iframe = node.querySelector('iframe');
        const height = iframe ? iframe.getBoundingClientRect().height : 0;
        if (height < 40) {
          node.innerHTML = '';
          const link = document.createElement('a');
          link.href = safeUrl;
          link.target = '_blank';
          link.rel = 'noopener noreferrer';
          link.textContent = 'Instagramで投稿を見る ↗';
          // color:inherit だと親要素の文字色を継承してしまい、背景色によっては
          // 文字が背景と同化してほぼ見えなくなることがあったため、背景・文字色ともに固定する。
          link.style.cssText =
            'display:block; padding:16px; text-align:center; border-radius:8px; text-decoration:none; font-size:14px; font-weight:600; background-color:#262626; color:#ffffff; border:1px solid rgba(255,255,255,0.15);';
          node.appendChild(link);
        }
      }, RESIZE_TIMEOUT_MS);
    });

    return () => {
      cancelled = true;
    };
  }, [url]);

  return <View ref={containerRef} style={{ width: '100%', minHeight: 40 }} />;
}
