import { Linking, Platform } from 'react-native';

// ネイティブアプリストアへの導線をまとめたヘルパー。
// URLをここ1箇所に集約しておき、将来Android版(Google Play)を出す際も
// このファイルに追記するだけで済むようにしている。

export const IOS_APP_STORE_ID = '6805902713';
export const IOS_APP_STORE_URL = `https://apps.apple.com/jp/app/id${IOS_APP_STORE_ID}`;

// App Storeのページを開く。
// Web版ではブラウザの別タブで開く(iOS Safariでは自動的にApp Storeアプリへ切り替わる)。
export function openAppStore() {
  if (Platform.OS === 'web') {
    if (typeof window === 'undefined') return;
    window.open(IOS_APP_STORE_URL, '_blank', 'noopener,noreferrer');
    return;
  }
  Linking.openURL(IOS_APP_STORE_URL).catch(() => {});
}
