// Limap ブランドカラー
// 背景 #404040 / アクセント #dece32 のロゴカラーをアプリ全体の基準にしている
export const colors = {
  background: '#2b2b2b', // アプリ全体のベース背景（旧: #404040）
  surface: '#4d4d4d', // カード・入力欄など、背景より少し明るい面
  surfaceAlt: '#3a3a3a', // 地図の上に重ねるパネルなど、少し沈んだ面
  border: '#5c5c5c',

  textPrimary: '#ffffff',
  textSecondary: '#c9c9c9',
  textMuted: '#9a9a9a',

  accent: '#dece32', // ロゴのテキストカラー。主要ボタン・選択状態などに使用
  accentText: '#2a2a2a', // 黄色背景の上に載せる文字色（コントラスト確保のため濃色）
  accentTextMuted: 'rgba(42,42,42,0.7)', // 黄色背景の上に載せる、少し弱めた文字色

  danger: '#e0745c',
} as const;
