// Supabase Authが返すエラーメッセージ(英語の固定文言)を、ユーザーに表示するための
// 日本語メッセージに変換する。ログイン・新規登録画面(AuthScreen)の両方から共通で使う。
// 該当するパターンが見つからない場合は、元のメッセージをそのまま返す
// (想定外のエラーでも、原因究明の手がかりが画面上から失われないようにするため)。
export function translateAuthError(message: string | undefined | null): string {
  if (!message) return '処理に失敗しました。時間をおいて再度お試しください。';
  const m = message.toLowerCase();

  if (m.includes('invalid login credentials')) {
    return 'メールアドレスまたはパスワードが正しくありません。';
  }
  if (m.includes('email not confirmed')) {
    return 'メールアドレスの確認が完了していません。届いた確認メール内のリンクからご確認ください。';
  }
  if (m.includes('user already registered') || m.includes('already registered')) {
    return 'このメールアドレスはすでに登録されています。ログインをお試しください。';
  }
  if (m.includes('password should be at least')) {
    return 'パスワードは6文字以上で入力してください。';
  }
  if (m.includes('unable to validate email address') || m.includes('invalid email') || m.includes('is invalid')) {
    return 'メールアドレスの形式が正しくありません。';
  }
  if (m.includes('for security purposes') || m.includes('rate limit') || m.includes('too many requests')) {
    return 'リクエストが多すぎます。しばらく時間をおいてから再度お試しください。';
  }
  if (m.includes('network') || m.includes('fetch')) {
    return 'ネットワークに接続できませんでした。通信環境をご確認のうえ再度お試しください。';
  }

  return message;
}
