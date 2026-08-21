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
//
// ただし単純な読み込み遅延(回線が遅い、Instagram側の処理が少し遅いなど)でも
// 同じように高さが0のままになるため、最初の待機だけで即フォールバックに切り替えると
// 実際は読み込めていたはずの投稿まで仮リンクに置き換わってしまっていた。
// そこで即座に諦めず、embed.jsへの再処理要求を挟みながら複数回チェックし、
// それでも規定回数だめだった場合にのみ最終的にフォールバックする。
const INITIAL_CHECK_DELAY_MS = 3000;
const RETRY_INTERVAL_MS = 3000;
const MAX_RETRIES = 3; // 初回チェック + 3回リトライ = 合計で約12秒待ってからフォールバック
const MIN_EMBED_HEIGHT = 40;

// 画像と同じメディアカルーセルに乗せる都合上、ウィジェット全体(キャプションや
// ヘッダーを含む)が見切れないよう、実際のDOM高さを親コンポーネントに伝える。
// Instagram側のiframeリサイズは画像読み込み等で後から変化することもあるため、
// 一度きりの計測ではなくResizeObserverで継続的に監視する。
type Props = { url: string; onHeightChange?: (height: number) => void };

export default function InstagramEmbed({ url, onHeightChange }: Props) {
  const containerRef = useRef<View>(null);

  useEffect(() => {
    const node = containerRef.current as unknown as HTMLDivElement | null;
    if (!node) return;
    let cancelled = false;

    const safeUrl = escapeHtmlAttr(url);
    node.innerHTML = `
      <blockquote class="instagram-media" data-instgrm-permalink="${safeUrl}" data-instgrm-version="14" style="margin:0 auto; width:100%;"></blockquote>
    `;

    let resizeObserver: ResizeObserver | null = null;
    if (typeof ResizeObserver !== 'undefined' && onHeightChange) {
      resizeObserver = new ResizeObserver((entries) => {
        const height = entries[0]?.contentRect.height;
        if (height && height > 0) onHeightChange(height);
      });
      resizeObserver.observe(node);
    }

    let retryTimer: ReturnType<typeof setTimeout> | null = null;

    const showFallbackLink = () => {
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
      onHeightChange?.(node.getBoundingClientRect().height);
    };

    // 埋め込みが完了しているか(iframeの高さがついているか)を確認し、
    // まだの場合はembed.jsに再処理を促してから少し待って再チェックする。
    // 規定回数リトライしても高さがつかなかった場合のみ、最終的にフォールバックリンクに置き換える。
    const checkEmbed = (retryCount: number) => {
      if (cancelled) return;
      const iframe = node.querySelector('iframe');
      const height = iframe ? iframe.getBoundingClientRect().height : 0;
      if (height >= MIN_EMBED_HEIGHT) return; // 読み込み成功。何もしない

      if (retryCount >= MAX_RETRIES) {
        showFallbackLink();
        return;
      }

      window.instgrm?.Embeds.process();
      retryTimer = setTimeout(() => checkEmbed(retryCount + 1), RETRY_INTERVAL_MS);
    };

    loadEmbedScript().then(() => {
      if (cancelled) return;
      window.instgrm?.Embeds.process();
      retryTimer = setTimeout(() => checkEmbed(0), INITIAL_CHECK_DELAY_MS);
    });

    return () => {
      cancelled = true;
      if (retryTimer) clearTimeout(retryTimer);
      resizeObserver?.disconnect();
    };
  }, [url]);

  return <View ref={containerRef} style={{ width: '100%', minHeight: 40 }} />;
}
