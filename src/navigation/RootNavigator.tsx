import React, { useEffect, useState } from 'react';
import { NavigationContainer, DarkTheme, type LinkingOptions } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useAuth } from '../lib/AuthContext';
import AuthScreen from '../screens/AuthScreen';
import MainTabNavigator from './MainTabNavigator';
import SpotDetailScreen from '../screens/SpotDetailScreen';
import CreateSpotScreen from '../screens/CreateSpotScreen';
import LocationPickerScreen from '../screens/LocationPickerScreen';
import UserProfileScreen from '../screens/UserProfileScreen';
import LoadingScreen from '../components/LoadingScreen';
import { colors } from '../lib/theme';
import type { RootStackParamList } from './types';

const Stack = createNativeStackNavigator<RootStackParamList>();

// ロード画面を演出として見せるため、実際のセッション確認がすぐ終わっても最低これだけは表示する
const MIN_LOADING_SCREEN_MS = 900;

// Web版のURLバーと連動させ、投稿詳細などを直接開ける/共有できるURLにする。
// （例: https://limap.jp/spot/xxxxx）ネイティブ版では limap:// のカスタムスキームとして機能する。
const linking: LinkingOptions<RootStackParamList> = {
  prefixes: ['https://limap.jp', 'https://www.limap.jp', 'limap://'],
  config: {
    screens: {
      Main: {
        screens: {
          MapTab: 'map',
          SearchTab: 'search',
          MyPageTab: 'mypage',
        },
      },
      SpotDetail: 'spot/:spotId',
      CreateSpot: 'create',
      LocationPicker: 'location-picker',
      UserProfile: 'user/:userId',
      Auth: 'login',
    },
  },
};

const navTheme = {
  ...DarkTheme,
  colors: {
    ...DarkTheme.colors,
    background: colors.background,
    card: colors.background,
    text: colors.textPrimary,
    border: colors.border,
    primary: colors.accent,
  },
};

export default function RootNavigator() {
  const { loading } = useAuth();
  const [minTimeElapsed, setMinTimeElapsed] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setMinTimeElapsed(true), MIN_LOADING_SCREEN_MS);
    return () => clearTimeout(timer);
  }, []);

  if (loading || !minTimeElapsed) {
    return <LoadingScreen />;
  }

  // 地図・検索・スポット詳細の閲覧はログイン不要。投稿など会員限定の操作をしようとした
  // タイミングでのみ、モーダルとしてAuth画面へ遷移する（各画面側でガードする）。
  return (
    <NavigationContainer theme={navTheme} linking={linking}>
      <Stack.Navigator
        screenOptions={{
          headerStyle: { backgroundColor: colors.background },
          headerTintColor: colors.textPrimary,
          // ヘッダータイトルはReact Navigation内部のTextで描画されるため、
          // アプリ全体のフォント差し替え（AppText）が効かない。ここで直接指定する。
          headerTitleStyle: { fontFamily: 'DotGothic16_400Regular' },
        }}
      >
        <Stack.Screen name="Main" component={MainTabNavigator} options={{ headerShown: false }} />
        <Stack.Screen
          name="SpotDetail"
          component={SpotDetailScreen}
          options={{
            title: '',
            headerStyle: { backgroundColor: colors.accent },
            headerTintColor: colors.accentText,
          }}
        />
        <Stack.Screen name="CreateSpot" component={CreateSpotScreen} options={{ title: '投稿する' }} />
        <Stack.Screen
          name="LocationPicker"
          component={LocationPickerScreen}
          options={{ title: '場所を選択', presentation: 'modal' }}
        />
        <Stack.Screen
          name="UserProfile"
          component={UserProfileScreen}
          options={{
            title: '',
            headerStyle: { backgroundColor: colors.background },
            headerTintColor: colors.textPrimary,
          }}
        />
        <Stack.Screen
          name="Auth"
          component={AuthScreen}
          options={{ title: 'ログイン', presentation: 'modal' }}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
