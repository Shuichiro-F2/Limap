import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';

// ネイティブアプリ限定: インストール後の初回起動かどうかを覚えておくためのフラグ。
// 初回起動時だけ、アカウント作成/ログインを促すWelcome画面を全画面で表示する。
// スキップした場合も含め、一度表示したら二度と出さない。
//
// Web版では使わない。ブラウザには「インストール後の初回起動」という概念がなく、
// キャッシュを消したユーザーに毎回出てしまうため(Web版の導線はApp Storeバナーが担当)。
const WELCOME_SEEN_KEY = 'limap-welcome-seen';

export async function hasSeenWelcome(): Promise<boolean> {
  if (Platform.OS === 'web') return true;
  try {
    return (await AsyncStorage.getItem(WELCOME_SEEN_KEY)) === '1';
  } catch {
    // 読み取りに失敗した場合は「表示済み」として扱う。
    // 起動のたびに繰り返し出てしまうより、出ないほうが害が小さいため。
    return true;
  }
}

export async function markWelcomeSeen(): Promise<void> {
  if (Platform.OS === 'web') return;
  try {
    await AsyncStorage.setItem(WELCOME_SEEN_KEY, '1');
  } catch {
    // 書き込めなくても致命的ではない(次回また表示されるだけ)
  }
}

// ============================================================
// オープニング演出(IntroScreen)を再生するかどうか
// ============================================================
//
// ネイティブ: 毎回の起動で再生する。
// Web版: 「トップページ」または「共有リンクで開かれるスポット詳細」を
//        直接開いたときだけ、かつブラウザのセッション中1回だけ再生する。
//        マイページ・ログイン・利用規約など目的が明確な画面では挟まない。
//
// セッションの記録キーは public/index.html 側のロード画面スクリプトとも共有している
// (演出が続く場合はHTML側のロード画面の最低表示時間をなくすため)。変更する場合は両方直すこと。
const WEB_INTRO_SESSION_KEY = 'limap-intro-played';

// 演出を挟んでよいパスかどうか。トップと /spot/<id> のみ。
function isIntroPath(pathname: string): boolean {
  if (pathname === '' || pathname === '/') return true;
  return /^\/spot\/[^/]+\/?$/.test(pathname);
}

export function shouldPlayIntro(): boolean {
  if (Platform.OS !== 'web') return true;
  if (typeof window === 'undefined') return false;
  if (!isIntroPath(window.location.pathname)) return false;
  try {
    return window.sessionStorage.getItem(WEB_INTRO_SESSION_KEY) !== '1';
  } catch {
    // sessionStorageが使えない環境では、毎回流れてしまうより出さない方を選ぶ
    return false;
  }
}

// 「このセッションでは再生済み」と記録する(Web版のみ)。
// 演出の途中でリロードされても再生し直さないよう、再生を決めた時点で呼ぶ。
export function markIntroPlayed(): void {
  if (Platform.OS !== 'web' || typeof window === 'undefined') return;
  try {
    window.sessionStorage.setItem(WEB_INTRO_SESSION_KEY, '1');
  } catch {
    // 記録できなくても致命的ではない(同じセッションでまた出るだけ)
  }
}
