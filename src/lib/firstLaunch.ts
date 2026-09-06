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
