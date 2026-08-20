// Vercel Serverless Function
// スポット詳細画面のInstagram引用カード用に、Meta Graph oEmbed APIを
// サーバー側で呼び出し、サムネイル画像・投稿者名だけを返す薄いプロキシ。
//
// なぜプロキシが必要か:
// 1. Meta Graph API (graph.facebook.com) はブラウザから直接呼ぶとCORSで弾かれるため、
//    サーバー経由にする必要がある。
// 2. アクセストークン(META_APP_ID/META_APP_SECRET)はクライアント側のJSバンドルに
//    絶対に含めてはいけない秘密情報のため、サーバー環境変数としてのみ扱う。
//
// なぜ動画をそのまま埋め込まず、サムネイル+リンクのカードにしているか:
// blockquote+embed.js方式のライブ埋め込みは、投稿者がアカウント側で埋め込みを
// 許可していない場合や、リール(動画)特有の相性問題で、ブラウザによらず
// 高さが0のまま描画に失敗することがあり信頼性が低かった。
// サムネイル画像を使う場合はMeta公式ドキュメントで「投稿者名+Instagramへの
// リンクを明記すること」が要件として定められているため、このAPIは
// thumbnail_url / author_name のみを返し、クレジット表記は呼び出し側(アプリ)で行う。

const GRAPH_API_VERSION = 'v21.0';

function isValidInstagramUrl(url: string): boolean {
  return /^https:\/\/(www\.)?instagram\.com\/(?:[A-Za-z0-9_.]+\/)?(p|reel|tv)\/[A-Za-z0-9_-]+\/?/i.test(url);
}

export default async function handler(req: any, res: any) {
  const urlParam = req.query?.url;
  const targetUrl = Array.isArray(urlParam) ? urlParam[0] : urlParam;

  if (!targetUrl || !isValidInstagramUrl(targetUrl)) {
    res.status(400).json({ error: 'invalid_url' });
    return;
  }

  const appId = process.env.META_APP_ID;
  const appSecret = process.env.META_APP_SECRET;
  if (!appId || !appSecret) {
    // 環境変数が未設定の場合(Meta Developerアプリの準備が済んでいない場合)は、
    // 500ではなく「サムネイルなし」として扱えるよう404で返す。
    // アプリ側はこれを「フォールバックリンク表示」の合図として扱う。
    res.status(404).json({ error: 'not_configured' });
    return;
  }

  try {
    const accessToken = `${appId}|${appSecret}`;
    const oembedUrl =
      `https://graph.facebook.com/${GRAPH_API_VERSION}/instagram_oembed` +
      `?url=${encodeURIComponent(targetUrl)}` +
      `&fields=thumbnail_url,author_name,provider_name,provider_url,thumbnail_width,thumbnail_height` +
      `&access_token=${encodeURIComponent(accessToken)}`;

    const metaRes = await fetch(oembedUrl);
    if (!metaRes.ok) {
      // 対象アカウントが埋め込みを許可していない/非公開/年齢制限ありなどの場合もここに来る
      res.status(404).json({ error: 'oembed_unavailable' });
      return;
    }
    const data = await metaRes.json();

    res.setHeader('Content-Type', 'application/json; charset=utf-8');
    // Instagram側のサムネイルURLは頻繁には変わらないため、1日キャッシュする
    res.setHeader('Cache-Control', 'public, max-age=0, s-maxage=86400, stale-while-revalidate=604800');
    res.status(200).json({
      thumbnailUrl: data.thumbnail_url ?? null,
      authorName: data.author_name ?? null,
      thumbnailWidth: data.thumbnail_width ?? null,
      thumbnailHeight: data.thumbnail_height ?? null,
    });
  } catch (e) {
    res.status(502).json({ error: 'fetch_failed' });
  }
}
