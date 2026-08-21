import React from 'react';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { useFonts, DotGothic16_400Regular } from '@expo-google-fonts/dotgothic16';
import { AuthProvider } from './src/lib/AuthContext';
import { LanguageProvider } from './src/lib/i18n';
import RootNavigator from './src/navigation/RootNavigator';
import LoadingScreen from './src/components/LoadingScreen';

export default function App() {
  const [fontsLoaded] = useFonts({ DotGothic16_400Regular });

  // フォント読み込み中は起動時ロード画面を流用して表示する
  if (!fontsLoaded) {
    return <LoadingScreen />;
  }

  // SafeAreaProviderをここで明示的に用意しないと、react-navigation側が用意する
  // 暫定的なフォールバック(常にinsetsが0扱い)に頼ることになり、Web版でホーム画面に
  // 追加した際、ノッチ・ホームインジケーター分の余白(useSafeAreaInsets)が
  // 正しく計算されない(=下タブバーなどが実機の安全領域まで伸びない)原因になっていた。
  return (
    <SafeAreaProvider>
      <AuthProvider>
        <LanguageProvider>
          <StatusBar style="light" />
          <RootNavigator />
        </LanguageProvider>
      </AuthProvider>
    </SafeAreaProvider>
  );
}
