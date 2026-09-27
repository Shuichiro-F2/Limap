import { Platform } from 'react-native';

// Limap ブランドカラー
// ロゴのアクセント #dece32 を要所にだけ使い、面は近い階調の暗色を重ねて奥行きを出す
// （デザイン改善モックアップ「デザインの土台」と同じ値）。
// background はネイティブの起動画面(app.json の splash)・public/index.html と揃えてあるため、変えるときは両方も直す。
export const colors = {
  background: '#1a1a1a', // アプリ全体のベース背景
  surface: '#232323', // カード・入力欄など、背景より一段明るい面
  surfaceAlt: '#2c2c2c', // 面の上にさらに重ねる面・押したときの面
  border: '#383838',

  textPrimary: '#f2f2ee',
  textSecondary: '#b9b9b3',
  textMuted: '#85857f',
  placeholder: '#6c6c67', // 入力欄のプレースホルダー

  accent: '#dece32', // ロゴのテキストカラー。主要ボタン・選択状態などに使用
  accentText: '#1d1b0e', // 黄色背景の上に載せる文字色（墨色）
  accentTextMuted: 'rgba(29,27,14,0.62)', // 黄色背景の上に載せる、少し弱めた文字色
  accentLine: 'rgba(29,27,14,0.18)', // 黄色背景の上の区切り線
  accentOutline: 'rgba(29,27,14,0.4)', // 黄色背景の上の枠線（ボタンなど）

  danger: '#e0745c',
} as const;

// 書体。見出し・ラベル・ボタンはドットフォント、長い文章は読みやすいゴシック体。
// body はネイティブでは端末の標準書体（iOS: ヒラギノ角ゴ）、Web では Noto Sans JP（public/index.html で読み込む）。
export const fonts = {
  display: 'DotGothic16_400Regular',
  body: Platform.select<string | undefined>({ web: '"Noto Sans JP", system-ui, sans-serif', default: undefined }),
} as const;

// 文字の大きさ（6段階）。DotGothic16 は太字が無いため、強弱は大きさと色でつける
export const type = {
  displayL: 28, // 画面の大見出し
  display: 22, // スポット名など
  heading: 18, // セクション見出し
  body: 15, // 本文・ボタン
  small: 13, // 補足・タグ
  caption: 11, // ラベル・注記
} as const;

// 余白
export const space = {
  xs: 4,
  s: 8,
  m: 12,
  l: 16,
  xl: 24,
  xxl: 32,
} as const;

// 角の丸み
export const radius = {
  s: 8, // 小さな部品・サムネイル
  m: 14, // カード
  pill: 999, // ボタン・タグ
} as const;
