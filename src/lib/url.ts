// 汎用的なURL形式の簡易チェック(http/https始まりの正しい形式かどうかのみ確認する)
export function isValidHttpUrl(value: string): boolean {
  try {
    const url = new URL(value.trim());
    return url.protocol === 'http:' || url.protocol === 'https:';
  } catch {
    return false;
  }
}
