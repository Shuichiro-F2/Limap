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
import MyPageScreen from '../screens/MyPageScreen';
import { colors } from '../lib/theme';
import type { MainTabParamList } from './types';

const Tab = createMaterialTopTabNavigator<MainTabParamList>();

const TAB_HEIGHT = 54;

// アイコンのみのタブ（ラベルなし）。マイページ内のスワイプ切り替えと同じ見た目・挙動にするため、
// タブバーは自前で描画し、スワイプ位置(position)に連動してハイライトと下線を滑らかに動かす。
const TAB_ICONS: Record<keyof MainTabParamList, keyof typeof Ionicons.glyphMap> = {
  MapTab: 'map-outline',
  FeedTab: 'people-outline',
  SearchTab: 'search-outline',
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
  return (
    <Tab.Navigator
      tabBarPosition="bottom"
      tabBar={(props) => <CustomTabBar {...props} />}
      screenOptions={{ swipeEnabled: true, animationEnabled: true }}
    >
      <Tab.Screen name="MapTab" component={MapScreen} options={{ title: '地図' }} />
      <Tab.Screen name="FeedTab" component={FeedScreen} options={{ title: 'フィード' }} />
      <Tab.Screen name="SearchTab" component={SearchScreen} options={{ title: '検索' }} />
      <Tab.Screen name="MyPageTab" component={MyPageScreen} options={{ title: 'マイページ' }} />
    </Tab.Navigator>
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
