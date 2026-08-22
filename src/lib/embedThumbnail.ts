import type { SpotEmbedPlatform } from '../types/database';

// 埋め込み(Instagram/X)投稿のサムネイル画像URLを、投稿作成/編集のタイミングで
// あらかじめ取得しておくためのヘルパー。写真の投稿がない場合、一覧画面の
// グリッド/カード表示ではこのサムネイルを写真の代わりに使う。
//
// 取得できなかった場合(非公開投稿、テキストのみの投稿、API側の一時的な不具合、
// Instagram側で連携アプリの審査が未完了などの場合を含む)はnullを返し、
// 呼び出し側はテキストのみの表示にフォールバックする。
//
// 一覧の再読み込みのたびに毎回取得するのではなく、投稿の作成・編集時に一度だけ
// 取得してDB(spot_embeds.thumbnail_url)に保存しておく方式にしている
// (画像サムネイル生成の仕組みと同じ考え方)。
const API_BASE = 'https://limap.jp/api';

export async function fetchEmbedThumbnail(platform: SpotEmbedPlatform, url: string): Promise<string | null> {
  try {
    const endpoint = platform === 'instagram' ? 'instagram-oembed' : 'x-oembed';
    const res = await fetch(`${API_BASE}/${endpoint}?url=${encodeURIComponent(url)}`);
    if (!res.ok) return null;
    const data = await res.json();
    return data.thumbnailUrl ?? null;
  } catch {
    return null;
  }
}
