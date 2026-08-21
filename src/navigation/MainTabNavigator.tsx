import React, { useEffect, useRef, useState } from 'react';
import { Animated, View, Pressable, StyleSheet, useWindowDimensions } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  createMaterialTopTabNavigator,
  type MaterialTopTabBarProps,
} from '@react-navigation/material-top-tabs';
import { Ionicons } from '@expo/vector-icons';
import MapScreen from '../screens/MapScreen';
import FeedScreen from '../screens/FeedScreen';
import SearchScreen from '../screens/SearchScreen';
import ArticlesScreen from '../screens/ArticlesScreen';
import MyPageScreen from '../screens/MyPageScreen';
import AppHeader from '../components/AppHeader';
import { colors } from '../lib/theme';
import { WEB_SAFE_BOTTOM_OVERHANG } from '../lib/safeAreaWeb';
import type { MainTabParamList } from './types';

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

  const [activeIndex, setActiveIndex] = useState(state.index);

  useEffect(() => {
    const id = position.addListener(({ value }) => {
      const rounded = Math.round(value);
      setActiveIndex((prev) => (prev === rounded ? prev : rounded));
    });
    return () => position.removeListener(id);
  }, [position]);

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
          const focused = activeIndex === index;
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
  // ホーム画面に追加してスタンドアロン表示にした場合、react-navigation側の
  // スクリーンコンテナがホームインジケーター分の安全領域まで高さを伸ばしきれず、
  // 下タブバーの下にグレーの隙間ができてしまうことがあった。position:absoluteで
  // 自前の領域を明示し、bottomをinsets.bottom分だけ余分に張り出させることで
  // 実機の下端まで確実に届かせる(タブバー自体が内側でinsets.bottom分の
  // 余白を確保する処理とは独立して機能する)。
  const insets = useSafeAreaInsets();
  // Web版はCSSのenv(safe-area-inset-bottom)を直接使い、コラム記事ページと同じ仕組みで
  // 誤差なく実機の下端まで届かせる。ネイティブ版はinsets.bottomを使う。
  // 注意: ここでの張り出し量はTab.Navigator内のflex:1コンテンツ(地図など)がそのまま
  // 消費し、下タブバーの位置を押し下げてしまうため、正確な値を使う必要がある
  // (SpotDetailScreen等の単色背景の張り出しと違い、多めのバッファは使えない)。
  const bottomOverhang = WEB_SAFE_BOTTOM_OVERHANG ?? -insets.bottom;
  return (
    <View style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: bottomOverhang }}>
      <Tab.Navigator
        tabBarPosition="bottom"
        tabBar={(props) => <CustomTabBar {...props} />}
        screenOptions={{ swipeEnabled: true, animationEnabled: true }}
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
        ロゴと言語切り替えトグルは、タブのページャー(Tab.Navigator)の外側・最前面に重ねて描画する。
        こうすることで、各タブ画面の中身がスワイプで横にスライドしても、
        ヘッダー自体は再マウントされず常に画面の同じ位置に固定されたまま表示される。
      */}
      <AppHeader />
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
