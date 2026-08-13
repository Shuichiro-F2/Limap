import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  Animated,
  View,
  Pressable,
  StyleSheet,
  FlatList,
  Image,
  ActivityIndicator,
  RefreshControl,
  useWindowDimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import Text from '../components/AppText';
import { fetchSpotsByAuthor, fetchLikedSpots, fetchBookmarkedSpots, spotImageUrl } from '../lib/spots';
import { fetchFollowCounts, type FollowCounts } from '../lib/profiles';
import { useAuth } from '../lib/AuthContext';
import { colors } from '../lib/theme';
import type { Spot } from '../types/database';
import type { MainTabScreenProps } from '../navigation/types';

type Props = MainTabScreenProps<'MyPageTab'>;

// Instagramのプロフィール切り替えのように、アイコンのみ＋下線インジケーターでタブを表現する
const TABS: { icon: keyof typeof Ionicons.glyphMap }[] = [
  { icon: 'grid-outline' }, // 自分の投稿
  { icon: 'heart-outline' }, // いいね
  { icon: 'bookmark-outline' }, // 行きたい場所
];

export default function MyPageScreen({ navigation }: Props) {
  const { profile, session, signOut } = useAuth();
  const { width: screenWidth } = useWindowDimensions();

  const [mineSpots, setMineSpots] = useState<Spot[]>([]);
  const [likedSpots, setLikedSpots] = useState<Spot[]>([]);
  const [bookmarkedSpots, setBookmarkedSpots] = useState<Spot[]>([]);
  const pages = [mineSpots, likedSpots, bookmarkedSpots];

  const [loadingInitial, setLoadingInitial] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [pageIndex, setPageIndex] = useState(0);
  const [followCounts, setFollowCounts] = useState<FollowCounts>({ followers: 0, following: 0 });

  const pagerRef = useRef<Animated.FlatList<any>>(null);
  const scrollX = useRef(new Animated.Value(0)).current;

  const loadAll = useCallback(async () => {
    if (!session?.user) return;
    const userId = session.user.id;
    const [mine, liked, bookmarked] = await Promise.all([
      fetchSpotsByAuthor(userId).catch(() => []),
      fetchLikedSpots(userId).catch(() => []),
      fetchBookmarkedSpots(userId).catch(() => []),
    ]);
    setMineSpots(mine);
    setLikedSpots(liked);
    setBookmarkedSpots(bookmarked);
  }, [session?.user?.id]);

  useEffect(() => {
    loadAll().finally(() => setLoadingInitial(false));
  }, [loadAll]);

  useFocusEffect(
    useCallback(() => {
      loadAll();
    }, [loadAll])
  );

  const onRefresh = async () => {
    setRefreshing(true);
    await loadAll();
    setRefreshing(false);
  };

  useEffect(() => {
    if (!session?.user) return;
    fetchFollowCounts(session.user.id)
      .then(setFollowCounts)
      .catch((e) => console.warn('フォロー数取得エラー', e));
  }, [session?.user?.id]);

  const goToPage = (index: number) => {
    setPageIndex(index);
    pagerRef.current?.scrollToOffset({ offset: index * screenWidth, animated: true });
  };

  const onPagerMomentumScrollEnd = (e: any) => {
    const index = Math.round(e.nativeEvent.contentOffset.x / screenWidth);
    setPageIndex(index);
  };

  // タブの下線インジケーター：横スワイプの位置(scrollX)に連動して自然に滑らせる
  const indicatorTranslateX = scrollX.interpolate({
    inputRange: [0, screenWidth, screenWidth * 2],
    outputRange: [0, screenWidth / TABS.length, (screenWidth / TABS.length) * 2],
    extrapolate: 'clamp',
  });

  // 未ログイン時はプロフィールの代わりにログイン導線を表示する（閲覧自体はログイン不要）
  if (!session?.user) {
    return (
      <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
        <View style={styles.logoRow}>
          <Image source={require('../../assets/logo-header.png')} style={styles.logo} resizeMode="contain" />
        </View>
        <View style={styles.loggedOutBox}>
          <Text style={styles.loggedOutTitle}>ログインするとマイページが使えます</Text>
          <Text style={styles.loggedOutText}>
            投稿・いいね・行きたい場所の保存・フォローには{'\n'}アカウントが必要です。
          </Text>
          <Pressable style={styles.loginButton} onPress={() => navigation.navigate('Auth')}>
            <Text style={styles.loginButtonText}>ログイン / 新規登録</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
      <View style={styles.logoRow}>
        <Image source={require('../../assets/logo-header.png')} style={styles.logo} resizeMode="contain" />
      </View>

      <View style={styles.header}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>{(profile?.username ?? '?').charAt(0).toUpperCase()}</Text>
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.username}>@{profile?.username ?? '...'}</Text>
          {profile?.display_name && <Text style={styles.displayName}>{profile.display_name}</Text>}
        </View>
        <Pressable onPress={signOut}>
          <Text style={styles.logoutText}>ログアウト</Text>
        </Pressable>
      </View>

      <View style={styles.countsRow}>
        <View style={styles.countItem}>
          <Text style={styles.countNumber}>{followCounts.followers}</Text>
          <Text style={styles.countLabel}>フォロワー</Text>
        </View>
        <View style={styles.countItem}>
          <Text style={styles.countNumber}>{followCounts.following}</Text>
          <Text style={styles.countLabel}>フォロー中</Text>
        </View>
      </View>

      <View style={styles.tabRow}>
        {TABS.map((tab, index) => (
          <Pressable key={tab.icon} style={styles.tabButton} onPress={() => goToPage(index)}>
            <Ionicons
              name={tab.icon}
              size={24}
              color={pageIndex === index ? colors.textPrimary : colors.textMuted}
            />
          </Pressable>
        ))}
      </View>
      <View style={styles.indicatorTrack}>
        <Animated.View
          style={[styles.indicator, { width: screenWidth / TABS.length, transform: [{ translateX: indicatorTranslateX }] }]}
        />
      </View>

      {loadingInitial ? (
        <ActivityIndicator color={colors.textPrimary} style={{ marginTop: 24 }} />
      ) : (
        <Animated.FlatList
          ref={pagerRef}
          data={pages}
          keyExtractor={(_, index) => `page-${index}`}
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          onScroll={Animated.event([{ nativeEvent: { contentOffset: { x: scrollX } } }], {
            useNativeDriver: true,
          })}
          scrollEventThrottle={16}
          onMomentumScrollEnd={onPagerMomentumScrollEnd}
          renderItem={({ item: pageSpots }) => (
            <FlatList
              data={pageSpots}
              keyExtractor={(item) => item.id}
              numColumns={3}
              style={{ width: screenWidth }}
              contentContainerStyle={{ padding: 4 }}
              refreshControl={
                <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.accent} />
              }
              ListEmptyComponent={<Text style={styles.emptyText}>まだ表示できるスポットがありません</Text>}
              renderItem={({ item }) => (
                <Pressable
                  style={styles.gridItem}
                  onPress={() => navigation.navigate('SpotDetail', { spotId: item.id })}
                >
                  {item.images && item.images.length > 0 ? (
                    <Image source={{ uri: spotImageUrl(item.images[0].storage_path) }} style={styles.gridImage} />
                  ) : (
                    <View style={[styles.gridImage, styles.noImage]}>
                      <Text style={styles.noImageText} numberOfLines={2}>
                        {item.title}
                      </Text>
                    </View>
                  )}
                </Pressable>
              )}
            />
          )}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  logoRow: { paddingLeft: 20, paddingTop: 12 },
  logo: { width: 84, height: 52 },
  loggedOutBox: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 32 },
  loggedOutTitle: { color: colors.textPrimary, fontSize: 16, fontWeight: '700', textAlign: 'center' },
  loggedOutText: {
    color: colors.textSecondary,
    fontSize: 13,
    textAlign: 'center',
    marginTop: 10,
    lineHeight: 20,
  },
  loginButton: {
    backgroundColor: colors.accent,
    borderRadius: 10,
    paddingVertical: 14,
    paddingHorizontal: 32,
    marginTop: 24,
  },
  loginButtonText: { color: colors.accentText, fontWeight: '600', fontSize: 15 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
    paddingTop: 12,
    gap: 12,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.accent,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: { color: colors.accentText, fontSize: 18, fontWeight: '700' },
  username: { color: colors.textPrimary, fontSize: 16, fontWeight: '600' },
  displayName: { color: colors.textSecondary, fontSize: 13, marginTop: 2 },
  logoutText: { color: colors.textSecondary, fontSize: 12 },
  countsRow: { flexDirection: 'row', paddingHorizontal: 20, gap: 28, marginBottom: 16 },
  countItem: { alignItems: 'center' },
  countNumber: { color: colors.textPrimary, fontSize: 16, fontWeight: '700' },
  countLabel: { color: colors.textMuted, fontSize: 11, marginTop: 2 },
  tabRow: { flexDirection: 'row' },
  tabButton: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingVertical: 10 },
  indicatorTrack: { height: 2, backgroundColor: colors.border },
  indicator: { height: 2, backgroundColor: colors.textPrimary },
  emptyText: { color: colors.textMuted, textAlign: 'center', marginTop: 40, fontSize: 13 },
  gridItem: { width: '33.33%', aspectRatio: 1, padding: 2 },
  gridImage: { flex: 1, borderRadius: 4 },
  noImage: { backgroundColor: colors.surface, alignItems: 'center', justifyContent: 'center', padding: 6 },
  noImageText: { color: colors.textMuted, fontSize: 11, textAlign: 'center' },
});
