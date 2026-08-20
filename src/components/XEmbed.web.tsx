import React, { useEffect, useRef } from 'react';
import { View } from 'react-native';
import { extractTweetId } from '../lib/x';

// Web版: X公式の埋め込みウィジェット(platform.twitter.com/widgets.js)を利用する。
// blockquote+スクリプト方式のInstagram版と違い、Xのwidgets.jsは
// `twttr.widgets.createTweet(tweetId, container)` というPromiseベースのAPIを
// 提供しており、埋め込みに失敗した場合(非公開/削除済みの投稿など)は
// Promiseがundefinedで解決される。そのため「一定時間待って高さを確認する」
// タイムアウト方式のフォールバック判定が不要で、より確実に成否を判定できる。

declare global {
  interface Window {
    twttr?: {
      widgets: {
        createTweet: (
          tweetId: string,
          container: HTMLElement,
          options?: Record<string, unknown>
        ) => Promise<HTMLElement | undefined>;
      };
    };
  }
}

let widgetsScriptPromise: Promise<void> | null = null;

function loadWidgetsScript(): Promise<void> {
  if (typeof window === 'undefined' || typeof document === 'undefined') return Promise.resolve();
  if (window.twttr?.widgets) return Promise.resolve();
  if (widgetsScriptPromise) return widgetsScriptPromise;

  widgetsScriptPromise = new Promise((resolve) => {
    const script = document.createElement('script');
    script.src = 'https://platform.twitter.com/widgets.js';
    script.async = true;
    script.onload = () => resolve();
    script.onerror = () => resolve();
    document.body.appendChild(script);
  });
  return widgetsScriptPromise;
}

function showFallbackLink(node: HTMLDivElement, url: string) {
  node.innerHTML = '';
  const link = document.createElement('a');
  link.href = url;
  link.target = '_blank';
  link.rel = 'noopener noreferrer';
  link.textContent = 'Xで投稿を見る ↗';
  link.style.cssText =
    'display:block; padding:16px; text-align:center; border-radius:8px; text-decoration:none; font-size:14px; font-weight:600; background-color:#000000; color:#ffffff; border:1px solid rgba(255,255,255,0.15);';
  node.appendChild(link);
}

type Props = { url: string; onHeightChange?: (height: number) => void };

export default function XEmbed({ url, onHeightChange }: Props) {
  const containerRef = useRef<View>(null);

  useEffect(() => {
    const node = containerRef.current as unknown as HTMLDivElement | null;
    if (!node) return;
    let cancelled = false;
    let resizeObserver: ResizeObserver | null = null;
    node.innerHTML = '';

    const tweetId = extractTweetId(url);
    if (!tweetId) {
      showFallbackLink(node, url);
      return;
    }

    loadWidgetsScript().then(() => {
      if (cancelled) return;
      if (!window.twttr?.widgets) {
        showFallbackLink(node, url);
        return;
      }
      window.twttr.widgets
        .createTweet(tweetId, node, { dnt: true })
        .then((el) => {
          if (cancelled) return;
          if (!el) {
            // 埋め込み失敗(非公開・削除済みの投稿など) → リンクにフォールバック
            showFallbackLink(node, url);
            return;
          }
          if (typeof ResizeObserver !== 'undefined' && onHeightChange) {
            resizeObserver = new ResizeObserver((entries) => {
              const height = entries[0]?.contentRect.height;
              if (height && height > 0) onHeightChange(height);
            });
            resizeObserver.observe(node);
          }
        })
        .catch(() => {
          if (!cancelled) showFallbackLink(node, url);
        });
    });

    return () => {
      cancelled = true;
      resizeObserver?.disconnect();
    };
  }, [url]);

  return <View ref={containerRef} style={{ width: '100%', minHeight: 40 }} />;
}
