import React, { useEffect, useState } from 'react';
import { Image, Pressable, StyleSheet } from 'react-native';
import { NavigationContainer, DarkTheme, type LinkingOptions } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../lib/AuthContext';
import AuthScreen from '../screens/AuthScreen';
import MainTabNavigator from './MainTabNavigator';
import SpotDetailScreen from '../screens/SpotDetailScreen';
import CreateSpotScreen from '../screens/CreateSpotScreen';
import LocationPickerScreen from '../screens/LocationPickerScreen';
import UserProfileScreen from '../screens/UserProfileScreen';
import AboutScreen from '../screens/AboutScreen';
import HelpScreen from '../screens/HelpScreen';
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
      About: 'about',
      Help: 'help',
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
          options={({ navigation }) => ({
            title: '',
            headerStyle: { backgroundColor: colors.background },
            headerTintColor: colors.textPrimary,
            // 他の画面と同じくロゴを左上に表示し、タップでトップページ（地図画面）へ戻れるようにする
            headerLeft: () => (
              <Pressable
                onPress={() => navigation.navigate('Main', { screen: 'MapTab' })}
                hitSlop={10}
              >
                <Image
                  source={require('../../assets/logo-header.png')}
                  style={headerStyles.logo}
                  resizeMode="contain"
                />
              </Pressable>
            ),
          })}
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
          name="About"
          component={AboutScreen}
          options={{ title: 'リミナルスペースとは' }}
        />
        <Stack.Screen name="Help" component={HelpScreen} options={{ title: '使い方' }} />
        <Stack.Screen
          name="Auth"
          component={AuthScreen}
          options={({ navigation }) => ({
            title: 'ログイン',
            presentation: 'modal',
            // 遷移元によっては戻る先の履歴がなく、標準の戻るボタンが無反応になることがあるため、
            // 常にトップページ（地図画面）へ遷移するよう明示的に指定する
            headerLeft: () => (
              <Pressable onPress={() => navigation.navigate('Main', { screen: 'MapTab' })} hitSlop={10}>
                <Ionicons name="arrow-back" size={24} color={colors.textPrimary} />
              </Pressable>
            ),
          })}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
}

const headerStyles = StyleSheet.create({
  logo: { width: 64, height: 32 },
});
