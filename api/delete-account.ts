// Vercel Serverless Function
// ユーザー自身によるアカウント削除(退会)。Apple App Storeガイドライン5.1.1(v)により、
// アプリ内でアカウント作成ができる場合は、アプリ内での削除手段も必須のため実装している。
//
// supabase-js クライアントSDKには、ユーザーが自分自身のauth.usersレコードを削除する
// 手段が存在しない(auth.admin.deleteUserは管理者権限のservice roleキーが必要)。
// そのためservice roleキーはクライアント(アプリ本体のバンドル)には絶対に含めず、
// このサーバー側関数の中でのみ、Vercelの環境変数(SUPABASE_SERVICE_ROLE_KEY)から読み込む。
//
// 呼び出し元(アプリ)は、ログイン中のユーザー自身のaccess_tokenを
// Authorization: Bearer <access_token> ヘッダーで渡す。このトークンから
// supabase.auth.getUser(token)で本人確認を行うことで、他人のアカウントを
// 勝手に削除できないようにしている。
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.SUPABASE_URL || '';
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

export default async function handler(req: any, res: any) {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'method_not_allowed' });
    return;
  }

  const authHeader = req.headers?.authorization || req.headers?.Authorization;
  const token = typeof authHeader === 'string' ? authHeader.replace(/^Bearer\s+/i, '').trim() : '';
  if (!token) {
    res.status(401).json({ error: 'missing_token' });
    return;
  }

  if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
    // Vercel側にSUPABASE_SERVICE_ROLE_KEYが未設定の場合の運用上のミスを区別する
    console.error('SUPABASE_SERVICE_ROLE_KEY が設定されていません');
    res.status(500).json({ error: 'server_misconfigured' });
    return;
  }

  const admin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  try {
    // トークンからユーザー本人を特定する
    const { data: userData, error: userError } = await admin.auth.getUser(token);
    if (userError || !userData?.user) {
      res.status(401).json({ error: 'invalid_token' });
      return;
    }
    const userId = userData.user.id;

    // 投稿(spots)に紐づく画像ファイルを削除する
    const { data: spots } = await admin.from('spots').select('id').eq('author_id', userId);
    const spotIds = (spots ?? []).map((s: { id: string }) => s.id);
    if (spotIds.length > 0) {
      const { data: images } = await admin
        .from('spot_images')
        .select('storage_path, thumbnail_path')
        .in('spot_id', spotIds);
      const paths = (images ?? [])
        .flatMap((i: { storage_path: string | null; thumbnail_path: string | null }) => [i.storage_path, i.thumbnail_path])
        .filter((p): p is string => !!p);
      if (paths.length > 0) {
        const { error: storageError } = await admin.storage.from('spot-images').remove(paths);
        // Storage側の削除に失敗しても、アカウント削除自体は続行する(孤立ファイルは残るが致命的ではない)
        if (storageError) console.warn('投稿画像削除エラー', storageError);
      }
    }

    // レビュー(spot_reviews)に紐づく画像ファイルを削除する
    const { data: reviews } = await admin.from('spot_reviews').select('id').eq('author_id', userId);
    const reviewIds = (reviews ?? []).map((r: { id: string }) => r.id);
    if (reviewIds.length > 0) {
      const { data: reviewImages } = await admin
        .from('spot_review_images')
        .select('storage_path, thumbnail_path')
        .in('review_id', reviewIds);
      const paths = (reviewImages ?? [])
        .flatMap((i: { storage_path: string | null; thumbnail_path: string | null }) => [i.storage_path, i.thumbnail_path])
        .filter((p): p is string => !!p);
      if (paths.length > 0) {
        const { error: storageError } = await admin.storage.from('spot-images').remove(paths);
        if (storageError) console.warn('レビュー画像削除エラー', storageError);
      }
    }

    // アバター画像を削除する。拡張子がユーザーごとに異なりうるため、
    // 保存先フォルダ(userIdをフォルダ名にしている)の中身を列挙してからまとめて削除する
    const { data: avatarFiles } = await admin.storage.from('avatars').list(userId);
    if (avatarFiles && avatarFiles.length > 0) {
      const avatarPaths = avatarFiles.map((f: { name: string }) => `${userId}/${f.name}`);
      const { error: avatarError } = await admin.storage.from('avatars').remove(avatarPaths);
      if (avatarError) console.warn('アバター画像削除エラー', avatarError);
    }

    // 最後にauth.usersのレコードを削除する。DBの外部キーはprofiles以下すべて
    // on delete cascadeで定義されているため、profiles/spots/spot_images/likes/
    // bookmarks/follows/spot_reviews/reports/blocks/contact_threads等の
    // 関連レコードはすべてデータベース側で自動的にカスケード削除される。
    const { error: deleteError } = await admin.auth.admin.deleteUser(userId);
    if (deleteError) throw deleteError;

    res.status(200).json({ success: true });
  } catch (e: any) {
    console.error('アカウント削除エラー', e);
    res.status(500).json({ error: 'delete_failed', message: e?.message ?? null });
  }
}
