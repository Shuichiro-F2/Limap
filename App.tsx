import React from 'react';
import { StatusBar } from 'expo-status-bar';
import { useFonts, DotGothic16_400Regular } from '@expo-google-fonts/dotgothic16';
import { AuthProvider } from './src/lib/AuthContext';
import RootNavigator from './src/navigation/RootNavigator';
import LoadingScreen from './src/components/LoadingScreen';

export default function App() {
  const [fontsLoaded] = useFonts({ DotGothic16_400Regular });

  // フォント読み込み中は起動時ロード画面を流用して表示する
  if (!fontsLoaded) {
    return <LoadingScreen />;
  }

  return (
    <AuthProvider>
      <StatusBar style="light" />
      <RootNavigator />
    </AuthProvider>
  );
}
