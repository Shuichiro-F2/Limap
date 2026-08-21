import { useCallback, useEffect, useState } from 'react';
import { Platform } from 'react-native';

// Web版限定: 「ホーム画面に追加」まわりの判定・操作をまとめたヘルパー。
// ネイティブアプリ側では常にfalse/no-opを返し、何も起きないようにする。

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed'; platform: string }>;
};

// すでにホーム画面から起動されている(=スタンドアロン表示)かどうか。
// iOS Safariは navigator.standalone、それ以外のPWA対応ブラウザは
// matchMedia('(display-mode: standalone)') で判定する。
export function isStandaloneDisplay(): boolean {
  if (Platform.OS !== 'web' || typeof window === 'undefined') return false;
  const nav = window.navigator as Navigator & { standalone?: boolean };
  const mediaMatch =
    typeof window.matchMedia === 'function' && window.matchMedia('(display-mode: standalone)').matches;
  return mediaMatch || nav.standalone === true;
}

// iPhone/iPad(Safari)かどうか。iPadOS 13以降はUAがMacとして送られてくるため、
// タッチ対応のMacintoshもiPadとして扱う。
export function isIOSDevice(): boolean {
  if (Platform.OS !== 'web' || typeof navigator === 'undefined') return false;
  const ua = navigator.userAgent || '';
  if (/iPad|iPhone|iPod/.test(ua)) return true;
  return /Macintosh/.test(ua) && typeof document !== 'undefined' && 'ontouchend' in document;
}

// Android Chrome等、ブラウザ側がネイティブの「ホーム画面に追加」ダイアログを
// 提供できる場合にのみ発火する beforeinstallprompt イベントを捕捉するフック。
// iOSではそもそもこのイベントが存在しないため、canPromptがfalseのまま固定される。
export function usePwaInstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);

  useEffect(() => {
    if (Platform.OS !== 'web' || typeof window === 'undefined') return;
    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    };
    window.addEventListener('beforeinstallprompt', handler as EventListener);
    return () => window.removeEventListener('beforeinstallprompt', handler as EventListener);
  }, []);

  const promptInstall = useCallback(async (): Promise<'accepted' | 'dismissed' | 'unavailable'> => {
    if (!deferredPrompt) return 'unavailable';
    await deferredPrompt.prompt();
    const choice = await deferredPrompt.userChoice;
    setDeferredPrompt(null);
    return choice.outcome;
  }, [deferredPrompt]);

  return { canPromptInstall: deferredPrompt !== null, promptInstall };
}
