// Vercel Serverless Function
// スポット一覧のグリッドサムネイル用に、Instagram投稿のサムネイル画像を取得する。
//
// 以前はMeta Graph API(graph.facebook.com/instagram_oembed)を使っていたが、
// このAPIで自社アカウント以外(第三者)の投稿を扱うにはMeta側の「App Review」による
// 審査(ビジネス確認・審査期間を要する)が必要で手間が大きいため、Instagramの公開投稿
// ページ自体をサーバー側で取得し、ページに含まれるOGP画像(og:image)からサムネイルURLを
// 抽出する非公式な方式に切り替えた。og:imageはリンクプレビュー(Slackへの共有時の
// サムネイル表示など)のためにInstagram側が公開ページに埋め込んでいるもので、
// ログインなしでも取得できる。
//
// X側の実装(api/x-oembed.ts)と同様、公式にサポートされた手段ではないため、
// Instagram側の仕様変更やスクレイピング対策(データセンターIPからのアクセス制限、
// ログイン要求など)により、投稿によっては取得できない場合がある。取得できなかった
// 場合はエラーを返すだけで、呼び出し側はテキストのみの表示にフォールバックする
// (致命的な壊れ方はしない)。

const INSTAGRAM_URL_PATTERN = /^https:\/\/(www\.)?instagram\.com\/(?:[A-Za-z0-9_.]+\/)?(p|reel|tv)\/([A-Za-z0-9_-]+)\/?/i;

function isValidInstagramUrl(url: string): boolean {
  return INSTAGRAM_URL_PATTERN.test(url.trim());
}

function extractShortcode(url: string): string | null {
  const match = url.trim().match(INSTAGRAM_URL_PATTERN);
  return match ? match[3] : null;
}

// 一般的なブラウザからのアクセスに見せることで、簡易的なボット判定を避ける
const BROWSER_HEADERS = {
  'user-agent':
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
  accept: 'text/html,application/xhtml+xml',
  'accept-language': 'ja,en;q=0.8',
};

function extractMetaContent(html: string, property: string): string | null {
  const patterns = [
    new RegExp(`<meta\\s+property=["']${property}["']\\s+content=["']([^"']+)["']`, 'i'),
    new RegExp(`<meta\\s+content=["']([^"']+)["']\\s+property=["']${property}["']`, 'i'),
  ];
  for (const pattern of patterns) {
    const match = html.match(pattern);
    if (match) return match[1].replace(/&amp;/g, '&').replace(/&quot;/g, '"');
  }
  return null;
}

async function tryFetchThumbnail(url: string): Promise<{ thumbnailUrl: string | null; authorName: string | null }> {
  const res = await fetch(url, { headers: BROWSER_HEADERS });
  if (!res.ok) return { thumbnailUrl: null, authorName: null };
  const html = await res.text();
  return {
    thumbnailUrl: extractMetaContent(html, 'og:image'),
    authorName: extractMetaContent(html, 'og:title'),
  };
}

export default async function handler(req: any, res: any) {
  const urlParam = req.query?.url;
  const targetUrl = Array.isArray(urlParam) ? urlParam[0] : urlParam;

  if (!targetUrl || !isValidInstagramUrl(targetUrl)) {
    res.status(400).json({ error: 'invalid_url' });
    return;
  }

  const shortcode = extractShortcode(targetUrl);
  if (!shortcode) {
    res.status(400).json({ error: 'invalid_url' });
    return;
  }

  try {
    // 通常の投稿ページでog:imageが取れない場合、埋め込み専用ページも試す
    // (どちらもInstagram側で公開・ログイン不要のページ)
    let result = await tryFetchThumbnail(`https://www.instagram.com/p/${shortcode}/`);
    if (!result.thumbnailUrl) {
      result = await tryFetchThumbnail(`https://www.instagram.com/p/${shortcode}/embed/captioned/`);
    }

    if (!result.thumbnailUrl) {
      // ログイン画面にリダイレクトされた、アクセス制限を受けたなど
      res.status(404).json({ error: 'thumbnail_not_found' });
      return;
    }

    res.setHeader('Content-Type', 'application/json; charset=utf-8');
    // Instagram側のサムネイルURLは頻繁には変わらないため、1日キャッシュする
    res.setHeader('Cache-Control', 'public, max-age=0, s-maxage=86400, stale-while-revalidate=604800');
    res.status(200).json({
      thumbnailUrl: result.thumbnailUrl,
      authorName: result.authorName,
    });
  } catch (e) {
    res.status(502).json({ error: 'fetch_failed' });
  }
}
