import { Platform } from 'react-native';

// iOS Safariでホーム画面に追加してスタンドアロン表示にした場合、position:fixed/absoluteで
// 画面全体を覆う要素(RNのModalやreact-navigationの画面コンテナ)は、bottom:0を指定しただけでは
// ホームインジケーター分の安全領域まで正しく伸びない(iOS Safari特有の挙動。コラム記事ページ
// のような、position指定のない通常のドキュメントフローの要素ではこの問題が起きない)。
//
// JS側で計測したuseSafeAreaInsets()のinsets.bottomを使う方法は、機種によって数px程度の
// 誤差が出て隙間が残ることがあったため、Web版ではブラウザが直接返すCSSの
// env(safe-area-inset-bottom)をそのまま使うことで、誤差なく実機の下端まで確実に届かせる。
// ネイティブ版(iOS/Androidアプリ)ではこの値は使わず、通常通りinsets.bottomを使う。

// position:fixed/absoluteな要素のbottomに使う、安全領域ぶんだけ余分に張り出させる値。
// Web版ではCSSのcalc()文字列(React Native Webはstring値をそのままstyle.bottomへ渡す)、
// ネイティブ版ではundefined(呼び出し側でinsets.bottomにフォールバックする)。
export const WEB_SAFE_BOTTOM_OVERHANG =
  Platform.OS === 'web' ? ('calc(-1 * env(safe-area-inset-bottom, 0px))' as unknown as number) : undefined;

// 上記と組み合わせて使う、高さをその分だけ底上げするための値。
export function webSafeHeight(basePx: number): number {
  if (Platform.OS !== 'web') return basePx;
  return `calc(${basePx}px + env(safe-area-inset-bottom, 0px))` as unknown as number;
}
