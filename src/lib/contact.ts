import { supabase } from './supabase';
import type { ContactCategory, ContactThread, ContactThreadStatus, ContactMessage } from '../types/database';

// 管理画面のスレッド一覧で送信者の情報を表示するためのjoin
const THREAD_USER_SELECT = `
  *,
  user:profiles!contact_threads_user_id_fkey(id, username, display_name, avatar_url, badge:badge_types(key, label_ja, label_en, icon_name, bg_color, text_color))
`;

// 管理画面のスレッド詳細で、ユーザー本人の発言に表示名を出すためのjoin
const MESSAGE_SENDER_SELECT = `
  *,
  sender:profiles!contact_messages_sender_id_fkey(id, username, display_name, avatar_url, badge:badge_types(key, label_ja, label_en, icon_name, bg_color, text_color))
`;

// ユーザー本人の、直近の問い合わせスレッドを1件取得する(なければnull)。
// このアプリでは1ユーザーにつき進行中のスレッドは基本的に1つの想定。
export async function fetchMyThread(userId: string): Promise<ContactThread | null> {
  const { data, error } = await supabase
    .from('contact_threads')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();
  if (error) throw error;
  return data;
}

// 新しい問い合わせスレッドを作成する。
export async function createThread(userId: string, category: ContactCategory): Promise<ContactThread> {
  const { data, error } = await supabase
    .from('contact_threads')
    .insert({ user_id: userId, category })
    .select()
    .single();
  if (error) throw error;
  return data;
}

// スレッド内のメッセージを時系列順に取得する。
export async function fetchThreadMessages(threadId: string): Promise<ContactMessage[]> {
  const { data, error } = await supabase
    .from('contact_messages')
    .select(MESSAGE_SENDER_SELECT)
    .eq('thread_id', threadId)
    .order('created_at', { ascending: true });
  if (error) throw error;
  return data ?? [];
}

// メッセージを送信する。isAdmin=trueで送るにはDB側(RLS)で実際に管理者フラグを
// 持っているアカウントである必要がある(なりすまし防止)。
export async function sendContactMessage(
  threadId: string,
  senderId: string,
  isAdmin: boolean,
  body: string
): Promise<ContactMessage> {
  const { data, error } = await supabase
    .from('contact_messages')
    .insert({ thread_id: threadId, sender_id: senderId, is_admin: isAdmin, body })
    .select()
    .single();
  if (error) throw error;
  return data;
}

// 管理画面用: スレッド詳細画面のヘッダーに送信者情報を出すために1件取得する。
export async function fetchThreadById(threadId: string): Promise<ContactThread> {
  const { data, error } = await supabase.from('contact_threads').select(THREAD_USER_SELECT).eq('id', threadId).single();
  if (error) throw error;
  return data;
}

// 管理画面用: すべてのスレッドを、動きがあった順(updated_at降順)で取得する。
export async function fetchAllThreads(): Promise<ContactThread[]> {
  const { data, error } = await supabase
    .from('contact_threads')
    .select(THREAD_USER_SELECT)
    .order('updated_at', { ascending: false });
  if (error) throw error;
  return data ?? [];
}

// 管理画面用: スレッドの対応状況(対応中/対応完了)を切り替える。
export async function setThreadStatus(threadId: string, status: ContactThreadStatus): Promise<void> {
  const { error } = await supabase.from('contact_threads').update({ status }).eq('id', threadId);
  if (error) throw error;
}
