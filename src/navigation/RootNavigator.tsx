import React, { useEffect, useState } from 'react';
import { Pressable } from 'react-native';
import {
  NavigationContainer,
  DarkTheme,
  useNavigationContainerRef,
  type LinkingOptions,
} from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../lib/AuthContext';
import AuthScreen from '../screens/AuthScreen';
import MainTabNavigator from './MainTabNavigator';
import SpotDetailScreen from '../screens/SpotDetailScreen';
import CreateSpotScreen from '../screens/CreateSpotScreen';
import AddReviewScreen from '../screens/AddReviewScreen';
import EditSpotScreen from '../screens/EditSpotScreen';
import LocationPickerScreen from '../screens/LocationPickerScreen';
import UserProfileScreen from '../screens/UserProfileScreen';
import AboutScreen from '../screens/AboutScreen';
import HelpScreen from '../screens/HelpScreen';
import PrivacyScreen from '../screens/PrivacyScreen';
import TermsScreen from '../screens/TermsScreen';
import AddToHomeScreenScreen from '../screens/AddToHomeScreenScreen';
import EditProfileScreen from '../screens/EditProfileScreen';
import FollowListScreen from '../screens/FollowListScreen';
import BlockedUsersScreen from '../screens/BlockedUsersScreen';
import ContactScreen from '../screens/ContactScreen';
import AdminInboxScreen from '../screens/AdminInboxScreen';
import AdminThreadScreen from '../screens/AdminThreadScreen';
import LoadingScreen from '../components/LoadingScreen';
import { colors } from '../lib/theme';
import { applyThemeColorForRoute } from '../lib/seo';
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
          FeedTab: 'feed',
          SearchTab: 'search',
          // 'articles' は静的な記事ページ本体(public/articles/)が既に使っているパスのため、
          // アプリ内の記事一覧タブは 'columns' という別のパスにする。
          ArticlesTab: 'columns',
          MyPageTab: 'mypage',
        },
      },
      SpotDetail: 'spot/:spotId',
      CreateSpot: 'create',
      AddReview: 'spot/:spotId/review',
      EditSpot: 'spot/:spotId/edit',
      LocationPicker: 'location-picker',
      UserProfile: 'user/:userId',
      Auth: 'login',
      About: 'about',
      Help: 'help',
      Privacy: 'privacy',
      Terms: 'terms',
      AddToHomeScreen: 'add-to-home-screen',
      EditProfile: 'edit-profile',
      FollowList: 'user/:userId/:mode',
      BlockedUsers: 'blocked-users',
      Contact: 'contact',
      AdminInbox: 'admin/inbox',
      AdminThread: 'admin/thread/:threadId',
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
  const navigationRef = useNavigationContainerRef<RootStackParamList>();

  useEffect(() => {
    const timer = setTimeout(() => setMinTimeElapsed(true), MIN_LOADING_SCREEN_MS);
    return () => clearTimeout(timer);
  }, []);

  // 画面(現在フォーカスされているルート)が変わるたびに、ブラウザのtheme-colorを
  // そのページの実際の背景色に合わせて切り替える(Web版のみ、ネイティブでは何もしない)
  const syncThemeColor = () => {
    applyThemeColorForRoute(navigationRef.getCurrentRoute()?.name);
  };

  if (loading || !minTimeElapsed) {
    return <LoadingScreen />;
  }

  // 地図・検索・スポット詳細の閲覧はログイン不要。投稿など会員限定の操作をしようとした
  // タイミングでのみ、モーダルとしてAuth画面へ遷移する（各画面側でガードする）。
  return (
    <NavigationContainer
      ref={navigationRef}
      theme={navTheme}
      linking={linking}
      onReady={syncThemeColor}
      onStateChange={syncThemeColor}
    >
      <Stack.Navigator
        screenOptions={{
          headerStyle: { backgroundColor: colors.background },
          headerTintColor: colors.textPrimary,
          // ヘッダータイトルはReact Navigation内部のTextで描画されるため、
          // アプリ全体のフォント差し替え（AppText）が効かない。ここで直接指定する。
          headerTitleStyle: { fontFamily: 'DotGothic16_400Regular' },
          // iOS標準では戻るボタンの矢印の横に遷移元画面のタイトル(例: "Main")が
          // 表示されるが、この文言はユーザーには不要な情報のため、矢印のみの表示にする。
          headerBackButtonDisplayMode: 'minimal',
        }}
      >
        <Stack.Screen name="Main" component={MainTabNavigator} options={{ headerShown: false }} />
        {/*
          投稿詳細画面は、他画面(地図・フィード等)と全く同じロゴ位置・レイアウトの
          ヘッダーにするため、native-stackの既定ヘッダーは使わずSpotDetailScreen側で
          共通のAppHeaderを重ねて描画する。
        */}
        <Stack.Screen name="SpotDetail" component={SpotDetailScreen} options={{ headerShown: false }} />
        <Stack.Screen name="CreateSpot" component={CreateSpotScreen} options={{ title: '投稿する' }} />
        <Stack.Screen name="AddReview" component={AddReviewScreen} options={{ title: 'レビューを投稿' }} />
        <Stack.Screen name="EditSpot" component={EditSpotScreen} options={{ title: '投稿を編集' }} />
        <Stack.Screen
          name="LocationPicker"
          component={LocationPickerScreen}
          options={{ title: '場所を選択' }}
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
          name="Privacy"
          component={PrivacyScreen}
          options={{ title: 'プライバシーポリシー' }}
        />
        <Stack.Screen name="Terms" component={TermsScreen} options={{ title: '利用規約' }} />
        <Stack.Screen
          name="AddToHomeScreen"
          component={AddToHomeScreenScreen}
          options={{ title: 'ホーム画面に追加' }}
        />
        <Stack.Screen
          name="EditProfile"
          component={EditProfileScreen}
          options={{
            title: 'プロフィールを編集',
            headerStyle: { backgroundColor: colors.background },
            headerTintColor: colors.textPrimary,
          }}
        />
        <Stack.Screen
          name="FollowList"
          component={FollowListScreen}
          options={{
            title: '',
            headerStyle: { backgroundColor: colors.background },
            headerTintColor: colors.textPrimary,
          }}
        />
        <Stack.Screen
          name="BlockedUsers"
          component={BlockedUsersScreen}
          options={{
            title: 'ブロック中のユーザー',
            headerStyle: { backgroundColor: colors.background },
            headerTintColor: colors.textPrimary,
          }}
        />
        <Stack.Screen
          name="Contact"
          component={ContactScreen}
          options={{
            title: 'お問い合わせ',
            headerStyle: { backgroundColor: colors.background },
            headerTintColor: colors.textPrimary,
          }}
        />
        <Stack.Screen
          name="AdminInbox"
          component={AdminInboxScreen}
          options={{
            title: '問い合わせ管理',
            headerStyle: { backgroundColor: colors.background },
            headerTintColor: colors.textPrimary,
          }}
        />
        <Stack.Screen
          name="AdminThread"
          component={AdminThreadScreen}
          options={{
            title: '',
            headerStyle: { backgroundColor: colors.background },
            headerTintColor: colors.textPrimary,
          }}
        />
        <Stack.Screen
          name="Auth"
          component={AuthScreen}
          options={({ navigation }) => ({
            title: 'ログイン',
            // 以前はpresentation: 'modal'(iOSのシート表示)にしていたが、下にスワイプすると
            // 意図せず前の画面に戻ってしまい、前の画面が下に少しはみ出して見える見た目にも
            // なることがあったため、他の画面と同じ通常のプッシュ遷移(既定値)に統一した。
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
