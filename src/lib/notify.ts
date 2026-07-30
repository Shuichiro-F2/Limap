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
