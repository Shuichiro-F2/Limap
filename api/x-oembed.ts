// Vercel Serverless Function
// スポット一覧のグリッドサムネイル用に、X(旧Twitter)投稿のメディア画像を取得する。
//
// X公式のoEmbed API(publish.twitter.com/oembed)は埋め込み用のHTML(blockquote)しか
// 返さず、投稿画像そのものを取得する手段を提供していない。画像を含む詳細情報を
// 取得できる公式API(GET /2/tweets)は現在有料プランでの認証が必須になっている。
//
// そこで、X自身が埋め込みウィジェット(widgets.js)の内部で使っている非公式の
// シンジケーションエンドポイント(cdn.syndication.twimg.com)を利用する。認証不要で
// 公開ツイートのメディア情報を返す仕組みで、react-tweet(Vercel製のOSSライブラリ)
// など複数の著名なOSSプロジェクトが同じ方式を採用している。
// ただし非公式のAPIのため、X側の仕様変更で予告なく動作しなくなる可能性がある。
// その場合はこのAPIが404/エラーを返すだけなので、呼び出し側はテキストのみの
// サムネイル表示にフォールバックする(致命的な壊れ方はしない)。

const X_URL_PATTERN = /^https?:\/\/(www\.)?(x|twitter)\.com\/([A-Za-z0-9_]+)\/status\/([0-9]+)/i;

function extractTweetId(url: string): string | null {
  const match = url.trim().match(X_URL_PATTERN);
  return match ? match[4] : null;
}

// シンジケーションAPIが要求する簡易トークン。X公式ウィジェットが使っている計算式を
// そのまま踏襲している(ツイートIDから決定的に導出されるだけで、秘密情報ではない)。
function getSyndicationToken(id: string): string {
  return ((Number(id) / 1e15) * Math.PI).toString(36).replace(/(0+|\.)/g, '');
}

export default async function handler(req: any, res: any) {
  const urlParam = req.query?.url;
  const targetUrl = Array.isArray(urlParam) ? urlParam[0] : urlParam;

  const tweetId = targetUrl ? extractTweetId(targetUrl) : null;
  if (!tweetId) {
    res.status(400).json({ error: 'invalid_url' });
    return;
  }

  try {
    const token = getSyndicationToken(tweetId);
    const apiUrl = `https://cdn.syndication.twimg.com/tweet-result?id=${tweetId}&lang=ja&token=${token}`;
    const twRes = await fetch(apiUrl, { headers: { accept: 'application/json' } });
    if (!twRes.ok) {
      // 非公開/削除済み/凍結アカウントの投稿などもここに来る
      res.status(404).json({ error: 'tweet_unavailable' });
      return;
    }
    const data = await twRes.json();

    // 画像投稿はphotos[0].url、動画投稿はサムネイル(video.poster)を使う。
    // どちらもない(テキストのみの投稿など)場合はサムネイルなしとして扱う。
    const thumbnailUrl: string | null =
      data?.photos?.[0]?.url ?? data?.video?.poster ?? null;

    res.setHeader('Content-Type', 'application/json; charset=utf-8');
    // X側のメディアURLは頻繁には変わらないため、Instagram側の実装とあわせて1日キャッシュする
    res.setHeader('Cache-Control', 'public, max-age=0, s-maxage=86400, stale-while-revalidate=604800');
    res.status(200).json({
      thumbnailUrl,
      authorName: data?.user?.name ?? null,
    });
  } catch (e) {
    res.status(502).json({ error: 'fetch_failed' });
  }
}
