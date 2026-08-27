import React, { useState } from 'react';
import { Animated, View, Pressable, StyleSheet, useWindowDimensions } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import {
  createMaterialTopTabNavigator,
  type MaterialTopTabBarProps,
} from '@react-navigation/material-top-tabs';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import MapScreen from '../screens/MapScreen';
import FeedScreen from '../screens/FeedScreen';
import SearchScreen from '../screens/SearchScreen';
import ArticlesScreen from '../screens/ArticlesScreen';
import MyPageScreen from '../screens/MyPageScreen';
import AppHeader from '../components/AppHeader';
import ProfileMenu from '../components/ProfileMenu';
import AddToHomeScreenPopup from '../components/AddToHomeScreenPopup';
import { useAuth } from '../lib/AuthContext';
import { colors } from '../lib/theme';
import { WEB_SAFE_BOTTOM_OVERHANG } from '../lib/safeAreaWeb';
import type { MainTabParamList, RootStackParamList } from './types';

const Tab = createMaterialTopTabNavigator<MainTabParamList>();

const TAB_HEIGHT = 54;

// アイコンのみのタブ（ラベルなし）。マイページ内のスワイプ切り替えと同じ見た目・挙動にするため、
// タブバーは自前で描画し、スワイプ位置(position)に連動してハイライトと下線を滑らかに動かす。
const TAB_ICONS: Record<keyof MainTabParamList, keyof typeof Ionicons.glyphMap> = {
  MapTab: 'map-outline',
  FeedTab: 'people-outline',
  SearchTab: 'search-outline',
  ArticlesTab: 'newspaper-outline',
  MyPageTab: 'person-outline',
};

function CustomTabBar({ state, navigation, position }: MaterialTopTabBarProps) {
  const insets = useSafeAreaInsets();
  const { width: screenWidth } = useWindowDimensions();
  const routeCount = state.routes.length;
  const tabWidth = screenWidth / routeCount;

  // アイコンの色分け(どのタブが選択中か)は、react-navigationが渡してくる
  // state.index(通常のReact props、常に正確)を直接使う。
  // 以前はAnimatedのposition.addListener()で見た目のスワイプ位置から
  // activeIndexを算出していたが、position.addListener()はネイティブ駆動の
  // アニメーションに対しては呼び出されないことがあり、それが原因でアイコンの
  // 色が切り替わらない不具合になっていた(下線インジケーターの方はAnimated.Viewの
  // styleに直接positionをbindしているだけなので、この問題の影響を受けず正しく動く)。
  const focusedIndex = state.index;

  const indicatorTranslateX = position.interpolate({
    inputRange: state.routes.map((_, i) => i),
    outputRange: state.routes.map((_, i) => i * tabWidth),
  });

  return (
    <View style={[styles.tabBar, { height: TAB_HEIGHT + insets.bottom, paddingBottom: insets.bottom }]}>
      <View style={styles.indicatorTrack}>
        <Animated.View
          style={[styles.indicator, { width: tabWidth, transform: [{ translateX: indicatorTranslateX }] }]}
        />
      </View>
      <View style={styles.tabRow}>
        {state.routes.map((route, index) => {
          const focused = focusedIndex === index;
          const iconName = TAB_ICONS[route.name as keyof MainTabParamList] ?? 'ellipse-outline';

          const onPress = () => {
            const event = navigation.emit({ type: 'tabPress', target: route.key, canPreventDefault: true });
            if (state.index !== index && !event.defaultPrevented) {
              navigation.navigate(route.name);
            }
          };

          return (
            <Pressable key={route.key} style={styles.tabItem} onPress={onPress} hitSlop={8}>
              <Ionicons name={iconName} size={24} color={focused ? colors.accent : colors.textMuted} />
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

export default function MainTabNavigator() {
  // Web版でホーム画面に追加してスタンドアロン表示にした場合、react-navigation側の
  // スクリーンコンテナがホームインジケーター分の安全領域まで高さを伸ばしきれず、
  // 下タブバーの下にグレーの隙間ができてしまうことがあった。position:absoluteで
  // 自前の領域を明示し、bottomを安全領域分だけ余分に張り出させることで
  // 実機の下端まで確実に届かせる(タブバー自体が内側でinsets.bottom分の
  // 余白を確保する処理とは独立して機能する)。
  // Web版はCSSのenv(safe-area-inset-bottom)を直接使い、コラム記事ページと同じ仕組みで
  // 誤差なく実機の下端まで届かせる。
  // 注意: ここでの張り出し量はTab.Navigator内のflex:1コンテンツ(地図など)がそのまま
  // 消費し、下タブバーの位置を押し下げてしまうため、正確な値を使う必要がある
  // (SpotDetailScreen等の単色背景の張り出しと違い、多めのバッファは使えない)。
  // ネイティブ版はCustomTabBar自体がすでにinsets.bottom分の高さ・paddingBottomを
  // 確保しているため、ここでもオーバーハングさせると二重に相殺され、タブアイコンが
  // 画面の物理下端(ホームインジケーターの真上)まで来てしまっていた。ネイティブは0にする。
  const bottomOverhang = WEB_SAFE_BOTTOM_OVERHANG ?? 0;

  // ハンバーガーメニューはマイページタブのときだけ表示する。以前の言語切り替え
  // トグルは全タブ共通で常時表示していたが、これとは異なり他のタブでは
  // ボタンごと出さない(要件どおり)。どのタブがフォーカスされているかは、
  // Tab.NavigatorのscreenListeners(state)で直接ナビゲーション状態の変化を
  // 購読して取得する(CustomTabBar内のAnimated positionリスナー経由で
  // コールバックを伝播させる方式は、外側の再レンダーとの絡みで更新が
  // 反映されないことがあったため、より素直なこちらの方式に変更した)。
  const [activeTabName, setActiveTabName] = useState<keyof MainTabParamList>('MapTab');
  const [menuVisible, setMenuVisible] = useState(false);
  const { isAdmin } = useAuth();
  // Main画面(Stack.Screen)として登録されているため、useNavigation()で
  // 親のRootStack側のnavigationを取得できる(About/Contact等はRootStack側のルート)。
  const rootNavigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();

  return (
    // 外側はオーバーハングさせない通常のflex:1コンテナにし、ポップアップ等
    // 「実機の下端付近に、多少の誤差があっても見た目上問題ない」要素はここに置く。
    // タブバーの張り出し処理(bottomOverhang)は内側のViewだけに閉じ込める。
    <View style={{ flex: 1 }}>
      <View style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: bottomOverhang }}>
        <Tab.Navigator
          tabBarPosition="bottom"
          tabBar={(props) => <CustomTabBar {...props} />}
          screenOptions={{ swipeEnabled: true, animationEnabled: true }}
          screenListeners={{
            // タブの状態(どのタブがアクティブか)が変わるたびに発火する。
            // タップでの切り替え・スワイプでの切り替えのどちらでも、切り替えが
            // 確定したタイミングで呼ばれる(react-navigation標準のイベント)。
            state: (e) => {
              const navState = e.data.state as { index: number; routes: { name: string }[] } | undefined;
              const name = navState?.routes[navState.index]?.name as keyof MainTabParamList | undefined;
              if (name) setActiveTabName(name);
            },
          }}
        >
          {/*
            地図画面だけはタブ全体のスワイプ切り替え(swipeEnabled)を無効にする。
            地図はネイティブのパン/ピンチジェスチャーで自前にドラッグを処理するため、
            同じ画面内にタブ切り替え用のスワイプも有効にしていると、
            地図をドラッグしようとした操作がタブ切り替えのジェスチャーと競合し、
            意図せずタブが切り替わってしまうことがあった。
            （タブ内の検索バー部分だけをスワイプ対象にする、という部分的な制御は
            ページャーが画面単位でしかジェスチャーを持てないため実現できないが、
            タブ自体はアイコンタップでいつでも切り替えられる）
          */}
          <Tab.Screen name="MapTab" component={MapScreen} options={{ title: '地図', swipeEnabled: false }} />
          <Tab.Screen name="FeedTab" component={FeedScreen} options={{ title: 'フィード' }} />
          <Tab.Screen name="SearchTab" component={SearchScreen} options={{ title: '検索' }} />
          <Tab.Screen name="ArticlesTab" component={ArticlesScreen} options={{ title: 'コラム' }} />
          <Tab.Screen name="MyPageTab" component={MyPageScreen} options={{ title: 'マイページ' }} />
        </Tab.Navigator>

        {/*
          ロゴ(と、マイページタブの時だけのハンバーガーボタン)は、タブのページャー
          (Tab.Navigator)の外側・最前面に重ねて描画する。こうすることで、各タブ画面の
          中身がスワイプで横にスライドしても、ヘッダー自体は再マウントされず
          常に画面の同じ位置に固定されたまま表示される。
        */}
        <AppHeader
          rightAction={activeTabName === 'MyPageTab' ? 'menu' : 'none'}
          onMenuPress={() => setMenuVisible(true)}
        />
      </View>

      {/* Web版限定: ブラウザで開いた際、トップ画面(このMainTabNavigatorが
          マウントされたタイミング=起動直後)にホーム画面追加を促すポップアップを表示する。
          既にホーム画面から起動している場合や、一度閉じた場合はこの端末では表示しない。
          外側のオーバーハングしない箱に置くことで、下端付近の位置ズレを避ける。 */}
      <AddToHomeScreenPopup />

      {/* マイページタブ専用のハンバーガーメニュー。ハンバーガーボタン自体が
          マイページタブの時にしか表示されないため、他タブ表示中に開くことはない。 */}
      <ProfileMenu
        visible={menuVisible}
        onClose={() => setMenuVisible(false)}
        navigation={rootNavigation}
        isAdmin={isAdmin}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    backgroundColor: colors.background,
  },
  indicatorTrack: { height: 2, backgroundColor: colors.border },
  indicator: { height: 2, backgroundColor: colors.accent },
  tabRow: { flex: 1, flexDirection: 'row' },
  tabItem: { flex: 1, alignItems: 'center', justifyContent: 'center' },
});
