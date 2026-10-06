// Vercel Serverless Function
// スポットを SNS で共有したときに出る画像（og:image）を作る。/api/og?id=<LIMap ID>
//
// スポットの多くは写真を LIMap に上げておらず SNS の埋め込みだけなので、これまでは共通の画像（og-image.png）しか出なかった。
// そこで、スポット名と地名、LIMap のロゴを入れた画像をその場で作る。埋め込み元の写真は他人の著作物なので使わない（文字だけで作る）。
// 文字の形は DotGothic16（Google Fonts、SIL Open Font License）。使う文字だけを Google Fonts から取り寄せる。
// 任意の文字列で画像を作れないよう、表示する内容は URL では受け取らず、ID からスポットを引いて決める。

import { ImageResponse } from '@vercel/og';

// @vercel/og は Edge で動かすのが公式の使い方（Node 用の配布物は、この構成ではそのまま読み込めないため）
export const config = { runtime: 'edge' };
import { createClient } from '@supabase/supabase-js';
import { spotPlace, spotRawTitle } from '../src/content/spotSeo';
import { placeLabelEn } from '../src/content/placeNamesEn';

const SUPABASE_URL = process.env.SUPABASE_URL || '';
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY || '';

const ACCENT = '#dece32';
const BACKGROUND = '#1a1a1a';

// Google Fonts は、古いブラウザの UA で頼むと woff2 ではなく TrueType を返す（画像を作る仕組みが woff2 を読めないため）
async function loadFont(text: string): Promise<ArrayBuffer | null> {
  try {
    const css = await (
      await fetch(`https://fonts.googleapis.com/css2?family=DotGothic16&text=${encodeURIComponent(text)}`, {
        headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 6.1) AppleWebKit/534.30 (KHTML, like Gecko) Safari/534.30' },
      })
    ).text();
    const url = css.match(/src: url\(([^)]+)\)/)?.[1];
    if (!url) return null;
    return await (await fetch(url)).arrayBuffer();
  } catch {
    return null;
  }
}

// JSX を使わずに要素を書くための小さな関数（api/ は JSX の設定が無いため）
const h = (type: string, style: Record<string, unknown>, children?: unknown) => ({
  type,
  props: { style, children },
});

export default async function handler(req: Request): Promise<Response> {
  const params = new URL(req.url).searchParams;
  const id = params.get('id');
  // 英語のスポットのページ（/en/spot/...）用。英語の名前と地名で作る
  const en = params.get('lang') === 'en';

  let title = 'LIMap';
  let place = '';
  if (id && SUPABASE_URL && SUPABASE_ANON_KEY && /^[A-Za-z0-9]{6,16}$/.test(id)) {
    const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
    const { data: spot } = await supabase
      .from('spots')
      // title_en は 0048 で足した列。列の有無に関わらず動くよう、* で読む
      .select('*, tags:spot_tags(tag:tags(name))')
      .eq('slug', id)
      .eq('status', 'published')
      .maybeSingle();
    if (spot) {
      const tagNames = ((spot.tags || []) as any[])
        .map((row) => (Array.isArray(row.tag) ? row.tag[0] : row.tag)?.name)
        .filter(Boolean);
      if (en && (spot as any).title_en) {
        title = (spot as any).title_en;
        place = placeLabelEn(tagNames);
      } else {
        title = spotRawTitle(spot as any);
        place = spotPlace(tagNames, (spot as any).city, (spot as any).country).label || '';
      }
    }
  }
  // 長すぎる名前は2行に収まるよう切る
  const maxLen = en ? 60 : 36;
  if (title.length > maxLen) title = `${title.slice(0, maxLen - 1)}…`;

  const caption = en ? 'Find liminal spaces on the map' : 'リミナルスペースを地図で探す';
  const font = await loadFont(`${title}${place}${caption}LIMaplimap.jp`);

  return new ImageResponse(
    h(
      'div',
      {
        width: '100%',
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        backgroundColor: BACKGROUND,
        padding: '64px 72px',
        fontFamily: font ? 'DotGothic16' : 'sans-serif',
        borderLeft: `16px solid ${ACCENT}`,
      },
      [
        h('div', { display: 'flex', color: ACCENT, fontSize: 40 }, 'LIMap'),
        h('div', { display: 'flex', flexDirection: 'column', gap: 20 }, [
          h('div', { display: 'flex', color: '#e8e8e8', fontSize: title.length > 20 ? 56 : 68, lineHeight: 1.3 }, title),
          place ? h('div', { display: 'flex', color: '#b9b9b3', fontSize: 34 }, place) : h('div', { display: 'flex' }, ''),
        ]),
        h('div', { display: 'flex', justifyContent: 'space-between', color: '#8a8a85', fontSize: 28 }, [
          h('div', { display: 'flex' }, caption),
          h('div', { display: 'flex' }, 'limap.jp'),
        ]),
      ]
    ) as any,
    {
      width: 1200,
      height: 630,
      fonts: font ? [{ name: 'DotGothic16', data: font, style: 'normal', weight: 400 }] : [],
      // スポット名が変わることは少ないので、1日は CDN にためておく
      headers: { 'Cache-Control': 'public, s-maxage=86400, stale-while-revalidate=604800' },
    }
  );
}
