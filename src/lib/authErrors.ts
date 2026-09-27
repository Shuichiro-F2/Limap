// Supabase Authが返すエラーメッセージ(英語の固定文言)を、ユーザーに表示するための
// 分かりやすいメッセージ(日本語/英語)に変換する。ログイン・新規登録画面(AuthScreen)から使う。
// 該当するパターンが見つからない場合は、元のメッセージをそのまま返す
// (想定外のエラーでも、原因究明の手がかりが画面上から失われないようにするため)。
const MESSAGES = {
  ja: {
    empty: '処理に失敗しました。時間をおいて再度お試しください。',
    invalidCredentials: 'メールアドレスまたはパスワードが正しくありません。',
    notConfirmed: 'メールアドレスの確認が完了していません。届いた確認メール内のリンクからご確認ください。',
    alreadyRegistered: 'このメールアドレスはすでに登録されています。ログインをお試しください。',
    weakPassword: 'パスワードは6文字以上で入力してください。',
    invalidEmail: 'メールアドレスの形式が正しくありません。',
    rateLimit: 'リクエストが多すぎます。しばらく時間をおいてから再度お試しください。',
    network: 'ネットワークに接続できませんでした。通信環境をご確認のうえ再度お試しください。',
  },
  en: {
    empty: 'Something went wrong. Please try again later.',
    invalidCredentials: 'Incorrect email address or password.',
    notConfirmed: 'Your email address has not been confirmed yet. Please use the link in the confirmation email.',
    alreadyRegistered: 'This email address is already registered. Please try logging in.',
    weakPassword: 'Your password must be at least 6 characters.',
    invalidEmail: 'Please enter a valid email address.',
    rateLimit: 'Too many requests. Please wait a moment and try again.',
    network: 'Could not connect to the network. Please check your connection and try again.',
  },
} as const;

export function translateAuthError(message: string | undefined | null, language: 'ja' | 'en' = 'ja'): string {
  const text = MESSAGES[language];
  if (!message) return text.empty;
  const m = message.toLowerCase();

  if (m.includes('invalid login credentials')) return text.invalidCredentials;
  if (m.includes('email not confirmed')) return text.notConfirmed;
  if (m.includes('user already registered') || m.includes('already registered')) return text.alreadyRegistered;
  if (m.includes('password should be at least')) return text.weakPassword;
  if (m.includes('unable to validate email address') || m.includes('invalid email') || m.includes('is invalid')) {
    return text.invalidEmail;
  }
  if (m.includes('for security purposes') || m.includes('rate limit') || m.includes('too many requests')) {
    return text.rateLimit;
  }
  if (m.includes('network') || m.includes('fetch')) return text.network;

  return message;
}
