import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from './supabase';

// 未ログインでも「行きたい（保存）」を使えるよう、この端末にだけ保存しておく。
// ログインしたら AuthContext からアカウントの bookmarks へ移し（migrateGuestBookmarks）、端末の分は消す。
// 中身はスポットの内部の主キー(spots.id)の配列。新しく保存したものを先頭に置く。

const KEY = 'limap.guestBookmarks.v1';

export async function getGuestBookmarkIds(): Promise<string[]> {
  try {
    const raw = await AsyncStorage.getItem(KEY);
    const ids = raw ? JSON.parse(raw) : [];
    return Array.isArray(ids) ? ids.filter((x) => typeof x === 'string') : [];
  } catch {
    return [];
  }
}

export async function isGuestBookmarked(spotId: string): Promise<boolean> {
  return (await getGuestBookmarkIds()).includes(spotId);
}

// 保存・解除を切り替え、切り替えたあとの状態と、端末に保存している件数を返す
export async function toggleGuestBookmark(spotId: string): Promise<{ bookmarked: boolean; count: number }> {
  const ids = await getGuestBookmarkIds();
  const bookmarked = !ids.includes(spotId);
  const next = bookmarked ? [spotId, ...ids] : ids.filter((id) => id !== spotId);
  await AsyncStorage.setItem(KEY, JSON.stringify(next));
  return { bookmarked, count: next.length };
}

// ログインしたユーザーのアカウントへ、端末に保存していた場所を移す。移した件数を返す。
// すでに保存済みのもの（主キーの重複）や、削除されたスポットは飛ばす。1件ずつ入れるのは、1件の失敗で全体を落とさないため。
export async function migrateGuestBookmarks(userId: string): Promise<number> {
  const ids = await getGuestBookmarkIds();
  if (!ids.length) return 0;
  let moved = 0;
  for (const spotId of [...ids].reverse()) {
    const { error } = await supabase
      .from('bookmarks')
      .upsert({ user_id: userId, spot_id: spotId }, { onConflict: 'user_id,spot_id', ignoreDuplicates: true });
    if (!error) moved++;
  }
  await AsyncStorage.removeItem(KEY).catch(() => {});
  return moved;
}
