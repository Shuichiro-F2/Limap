import { Platform, Share } from 'react-native';
import { notify } from './notify';

// 本番ドメイン。共有リンクの組み立てに使う（ネイティブには window がないため定数で持つ）
export const SITE_URL = 'https://limap.jp';

export function spotShareUrl(spotId: string): string {
  return `${SITE_URL}/spot/${spotId}`;
}

// スポットをOSの共有シート（LINE/X/メッセージなど）で共有する。
// Web: Web Share API が使えればそれを使い、使えないブラウザ（主にデスクトップ）ではURLをコピーする。
// ネイティブ: React Native標準のShare APIでOSの共有シートを開く（追加ライブラリ不要）。
export async function shareSpot(title: string, spotId: string) {
  const url = spotShareUrl(spotId);
  const text = `${title} - LIMap`;

  if (Platform.OS === 'web') {
    const nav = typeof navigator !== 'undefined' ? (navigator as Navigator & { share?: (data: ShareData) => Promise<void> }) : undefined;
    if (nav?.share) {
      try {
        await nav.share({ title: text, url });
      } catch {
        // ユーザーがキャンセルした場合などは何もしない
      }
      return;
    }
    await copyLink(spotId);
    return;
  }

  try {
    await Share.share(
      Platform.OS === 'ios' ? { message: text, url } : { message: `${text}\n${url}` }
    );
  } catch (e) {
    console.warn('共有エラー', e);
  }
}

// URLをクリップボードにコピーする（Web版のみ。ネイティブ版は共有シートから対応する）
export async function copyLink(spotId: string) {
  const url = spotShareUrl(spotId);
  if (Platform.OS === 'web' && typeof navigator !== 'undefined' && navigator.clipboard) {
    try {
      await navigator.clipboard.writeText(url);
      notify('リンクをコピーしました');
    } catch {
      notify('コピーに失敗しました', url);
    }
    return;
  }
  notify('URL', url);
}
