import { Platform } from 'react-native';

// Ko-fi(投げ銭)への支援導線をまとめたヘルパー。
//
// App Storeの審査ガイドライン上、iOSアプリ内でアプリ外の投げ銭ページへ誘導すると
// リジェクト対象になり得る(デジタルな支援はアプリ内課金が原則)ため、
// 支援導線はWeb版でのみ表示する。ネイティブアプリでは一切描画しないこと。
// ※Web版をiPhoneのSafariで開いている場合はアプリではないため、表示して問題ない。
//
// 記事ページ(scripts/generate-articles.js)はReactアプリとは別の静的HTMLのため、
// 同じURLを二重管理している。URLを変える場合は両方を更新すること。
export const KOFI_URL = 'https://ko-fi.com/limap';

export const isSupportAvailable = Platform.OS === 'web';

export function openSupportPage() {
  if (!isSupportAvailable || typeof window === 'undefined') return;
  window.open(KOFI_URL, '_blank', 'noopener,noreferrer');
}
