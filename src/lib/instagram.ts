// Instagram投稿URLの簡易バリデーション。
// 投稿(p)・リール(reel)・IGTV(tv)の公開URL形式のみを許可する。
// 画像ファイルを直接抜き出すのではなく、あくまで公式の埋め込み(embed.js)で
// 表示するための「投稿ページのURL」を対象にしている。
// プロフィール経由でコピーした場合など、ユーザー名がパスに含まれる形式
// (instagram.com/{username}/p/{code}/) もあるため、その部分は任意にしている。
const INSTAGRAM_URL_PATTERN = /^https?:\/\/(www\.)?instagram\.com\/(?:[A-Za-z0-9_.]+\/)?(p|reel|tv)\/[A-Za-z0-9_-]+\/?/i;

export function isValidInstagramUrl(url: string): boolean {
  return INSTAGRAM_URL_PATTERN.test(url.trim());
}

// クエリパラメータ(トラッキング用の ?igsh= など)を取り除き、埋め込み用に正規化する
export function normalizeInstagramUrl(url: string): string {
  const trimmed = url.trim();
  const match = trimmed.match(INSTAGRAM_URL_PATTERN);
  if (!match) return trimmed;
  return match[0].endsWith('/') ? match[0] : `${match[0]}/`;
}

export const MAX_INSTAGRAM_EMBEDS = 5;
