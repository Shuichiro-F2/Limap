import React from 'react';
import { View, Pressable, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { createBottomTabNavigator, type BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import MapScreen from '../screens/MapScreen';
import SearchScreen from '../screens/SearchScreen';
import MyPageScreen from '../screens/MyPageScreen';
import { colors } from '../lib/theme';
import type { MainTabParamList } from './types';

const Tab = createBottomTabNavigator<MainTabParamList>();

const TAB_HEIGHT = 54;

// アイコンのみのタブ（ラベルなし）。デフォルトのタブバーはラベル用の余白が残って
// アイコンが上寄りになってしまうため、確実に中央揃えできる自前のタブバーを描画する。
const TAB_ICONS: Record<keyof MainTabParamList, keyof typeof Ionicons.glyphMap> = {
  MapTab: 'map-outline',
  SearchTab: 'search-outline',
  MyPageTab: 'person-outline',
};

function CustomTabBar({ state, navigation }: BottomTabBarProps) {
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.tabBar, { height: TAB_HEIGHT + insets.bottom, paddingBottom: insets.bottom }]}>
      {state.routes.map((route, index) => {
        const focused = state.index === index;
        const iconName = TAB_ICONS[route.name as keyof MainTabParamList] ?? 'ellipse-outline';

        const onPress = () => {
          const event = navigation.emit({ type: 'tabPress', target: route.key, canPreventDefault: true });
          if (!focused && !event.defaultPrevented) {
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
  );
}

export default function MainTabNavigator() {
  return (
    <Tab.Navigator
      screenOptions={{ headerShown: false }}
      tabBar={(props) => <CustomTabBar {...props} />}
    >
      <Tab.Screen name="MapTab" component={MapScreen} options={{ title: '地図' }} />
      <Tab.Screen name="SearchTab" component={SearchScreen} options={{ title: '検索' }} />
      <Tab.Screen name="MyPageTab" component={MyPageScreen} options={{ title: 'マイページ' }} />
    </Tab.Navigator>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    flexDirection: 'row',
    backgroundColor: colors.background,
  },
  tabItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
