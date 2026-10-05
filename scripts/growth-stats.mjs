// 登録と投稿の数を週ごとに集計する（読むだけ。データは変更しない）。
// アカウントの作成や投稿が増えているかを、施策の前後で見比べるために使う。
//
//   node --env-file=.env scripts/growth-stats.mjs [週の数(既定 12)]
//
// - 登録：profiles の作成日（アカウントを作るとプロフィールが1件できる）
// - スポットの投稿：公式アカウント以外が作ったスポット（公開・非公開を問わず、anon で見える範囲）
// - 投稿の追加：spot_reviews（スポットに「行ってきた」写真などを足した投稿）
// - いいね・保存：likes / bookmarks（RLS で anon から読めない場合は「読めない」と出す）
// 画面の表示回数や、登録画面まで来て離れた人の数は、ここでは分からない（Vercel Web Analytics などが要る）。

const url = process.env.SUPABASE_URL;
const key = process.env.SUPABASE_ANON_KEY;
if (!url || !key) {
  console.error('SUPABASE_URL と SUPABASE_ANON_KEY が必要です（node --env-file=.env で実行）');
  process.exit(1);
}
const OFFICIAL_AUTHOR_ID = '09063d11-7b7d-4e5f-8c65-7b72f4b52134';
const weeks = Number(process.argv[2] || 12);
const headers = { apikey: key, Authorization: `Bearer ${key}` };

async function fetchAll(path) {
  const rows = [];
  for (let from = 0; ; from += 1000) {
    const res = await fetch(`${url}/rest/v1/${path}`, { headers: { ...headers, Range: `${from}-${from + 999}` } });
    if (!res.ok) return null;
    const page = await res.json();
    rows.push(...page);
    if (page.length < 1000) return rows;
  }
}

// 月曜はじまりの週（日本時間）の先頭日を YYYY-MM-DD で返す
function weekOf(iso) {
  const d = new Date(new Date(iso).getTime() + 9 * 3600 * 1000);
  const day = (d.getUTCDay() + 6) % 7;
  d.setUTCDate(d.getUTCDate() - day);
  return d.toISOString().slice(0, 10);
}

const series = {
  登録: await fetchAll('profiles?select=created_at'),
  スポットの投稿: (await fetchAll('spots?select=created_at,author_id'))?.filter((s) => s.author_id !== OFFICIAL_AUTHOR_ID) ?? null,
  投稿の追加: await fetchAll('spot_reviews?select=created_at'),
  いいね: await fetchAll('likes?select=created_at'),
  保存: await fetchAll('bookmarks?select=created_at'),
};

const now = new Date().toISOString();
const keys = [];
for (let i = weeks - 1; i >= 0; i--) keys.push(weekOf(new Date(Date.now() - i * 7 * 86400000).toISOString()));

const names = Object.keys(series);
console.log(`集計日時: ${now}`);
console.log(['週（月曜はじまり）', ...names].join('\t'));
for (const k of keys) {
  console.log(
    [k, ...names.map((n) => (series[n] ? series[n].filter((r) => weekOf(r.created_at) === k).length : '-'))].join('\t')
  );
}
console.log(['合計（全期間）', ...names.map((n) => (series[n] ? series[n].length : '読めない'))].join('\t'));
