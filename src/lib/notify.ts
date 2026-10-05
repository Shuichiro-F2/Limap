import { Alert, Platform } from 'react-native';

// react-native-webのAlert.alert()は何も表示しない no-op のため、
// Web環境ではブラウザのwindow.alert()にフォールバックする共通ヘルパー。
// ネイティブでは今まで通りAlert.alertの見た目のまま動く。
export function notify(title: string, message?: string, onDismiss?: () => void) {
  if (Platform.OS === 'web') {
    window.alert(message ? `${title}\n\n${message}` : title);
    onDismiss?.();
    return;
  }
  Alert.alert(title, message, onDismiss ? [{ text: 'OK', onPress: onDismiss }] : undefined);
}

// 「はい / いいえ」を選んでもらう確認。選んだ結果を返す（はい = true）。
// Web は window.confirm（ボタンの文言は変えられないため、OK/キャンセルになる）。
export function confirmAction(title: string, message: string, okLabel: string, cancelLabel: string): Promise<boolean> {
  if (Platform.OS === 'web') {
    return Promise.resolve(window.confirm(`${title}\n\n${message}`));
  }
  return new Promise((resolve) => {
    Alert.alert(title, message, [
      { text: cancelLabel, style: 'cancel', onPress: () => resolve(false) },
      { text: okLabel, onPress: () => resolve(true) },
    ]);
  });
}
