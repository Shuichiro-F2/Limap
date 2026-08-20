// X(旧Twitter)投稿URLの簡易バリデーション。
// x.com / twitter.com のどちらのドメインで共有されても受け付ける
// (アカウント設定やコピー元によってどちらの表記になるかが分かれるため)。
const X_URL_PATTERN = /^https?:\/\/(www\.)?(x|twitter)\.com\/([A-Za-z0-9_]+)\/status\/([0-9]+)/i;

export function isValidXUrl(url: string): boolean {
  return X_URL_PATTERN.test(url.trim());
}

// クエリパラメータ(トラッキング用の ?s= や ?t= など)を取り除き、
// 表記をx.comに統一して埋め込み用に正規化する
export function normalizeXUrl(url: string): string {
  const trimmed = url.trim();
  const match = trimmed.match(X_URL_PATTERN);
  if (!match) return trimmed;
  return `https://x.com/${match[3]}/status/${match[4]}`;
}

// 埋め込みウィジェット(twttr.widgets.createTweet)に渡す投稿ID部分だけを取り出す
export function extractTweetId(url: string): string | null {
  const match = url.trim().match(X_URL_PATTERN);
  return match ? match[4] : null;
}
