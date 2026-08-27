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
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import Text from '../components/AppText';
import { HEADER_CONTENT_HEIGHT } from '../components/AppHeader';
import { UsernameWithBadge } from '../components/UserBadge';
import { fetchSpotsByAuthor, fetchLikedSpots, fetchBookmarkedSpots, spotThumbnailUrl } from '../lib/spots';
import { fetchFollowCounts, type FollowCounts } from '../lib/profiles';
import { useAuth } from '../lib/AuthContext';
import { useTranslation } from '../lib/i18n';
import { colors } from '../lib/theme';
import { isStandaloneDisplay } from '../lib/pwaInstall';
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
  const { profile, session, signOut, isAdmin } = useAuth();
  const { width: screenWidth } = useWindowDimensions();
  const t = useTranslation();

  const [mineSpots, setMineSpots] = useState<Spot[]>([]);
  const [likedSpots, setLikedSpots] = useState<Spot[]>([]);
  const [bookmarkedSpots, setBookmarkedSpots] = useState<Spot[]>([]);
  const pages = [mineSpots, likedSpots, bookmarkedSpots];

  const [loadingInitial, setLoadingInitial] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [pageIndex, setPageIndex] = useState(0);
  const [followCounts, setFollowCounts] = useState<FollowCounts>({ followers: 0, following: 0 });

  const pagerRef = useRef<Animated.ScrollView>(null);
  const scrollX = useRef(new Animated.Value(0)).current;
  const hasLoadedOnceRef = useRef(false);

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

  // マウント時と画面に戻ってきたときの両方をこの1箇所でまとめて処理する
  // （以前はuseEffectとuseFocusEffectが両方走り、初回に二重で取得していたのが「タブ切り替えが重い」原因の一つだった）
  useFocusEffect(
    useCallback(() => {
      loadAll().finally(() => {
        if (!hasLoadedOnceRef.current) {
          hasLoadedOnceRef.current = true;
          setLoadingInitial(false);
        }
      });
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

  // 未ログインでこのタブが表示された瞬間（タップ・スワイプのどちらでも）、
  // 説明画面を挟まずログイン/新規登録画面へ遷移する
  useFocusEffect(
    useCallback(() => {
      if (!session?.user) {
        navigation.navigate('Auth');
      }
    }, [session?.user, navigation])
  );

  const goToPage = (index: number) => {
    setPageIndex(index);
    pagerRef.current?.scrollTo({ x: index * screenWidth, animated: true });
  };

  // スワイプ中の位置に応じて、アイコンのハイライトと描画するページ（隣接ページのみ）を更新する。
  // scrollイベントごとに毎回setStateするのではなく、切り替わる瞬間だけ更新することで負荷を抑える。
  const onPagerScroll = Animated.event(
    [{ nativeEvent: { contentOffset: { x: scrollX } } }],
    {
      useNativeDriver: true,
      listener: (e: any) => {
        const index = Math.round(e.nativeEvent.contentOffset.x / screenWidth);
        setPageIndex((prev) => (prev === index ? prev : index));
      },
    }
  );

  // タブの下線インジケーター：横スワイプの位置(scrollX)に連動して自然に滑らせる
  const indicatorTranslateX = scrollX.interpolate({
    inputRange: [0, screenWidth, screenWidth * 2],
    outputRange: [0, screenWidth / TABS.length, (screenWidth / TABS.length) * 2],
    extrapolate: 'clamp',
  });

  // 未ログイン時は説明画面を挟まず、即座にログイン/新規登録画面へ遷移する
  if (!session?.user) {
    return <View style={styles.container} />;
  }

  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
      {/* 共通ヘッダー(ロゴ+言語トグル)が最前面に重なっているため、その高さ分だけ空ける */}
      <View style={{ height: HEADER_CONTENT_HEIGHT }} />

      <View style={styles.header}>
        {profile?.avatar_url ? (
          <Image source={{ uri: profile.avatar_url }} style={styles.avatar} />
        ) : (
          <View style={[styles.avatar, styles.avatarPlaceholder]}>
            <Text style={styles.avatarText}>{(profile?.username ?? '?').charAt(0).toUpperCase()}</Text>
          </View>
        )}
        <View style={{ flex: 1 }}>
          <UsernameWithBadge username={profile?.username} badge={profile?.badge} textStyle={styles.username} />
          {profile?.display_name && <Text style={styles.displayName}>{profile.display_name}</Text>}
        </View>
        <Pressable onPress={() => navigation.navigate('EditProfile')} hitSlop={8} style={{ marginRight: 14 }}>
          <Ionicons name="create-outline" size={20} color={colors.textSecondary} />
        </Pressable>
        <Pressable onPress={signOut}>
          <Text style={styles.logoutText}>{t.myPage.logout}</Text>
        </Pressable>
      </View>

      {profile?.bio ? <Text style={styles.bio}>{profile.bio}</Text> : null}

      <View style={styles.countsRow}>
        <Pressable
          style={styles.countItem}
          onPress={() => session?.user && navigation.navigate('FollowList', { userId: session.user.id, mode: 'followers' })}
        >
          <Text style={styles.countNumber}>{followCounts.followers}</Text>
          <Text style={styles.countLabel}>{t.myPage.followers}</Text>
        </Pressable>
        <Pressable
          style={styles.countItem}
          onPress={() => session?.user && navigation.navigate('FollowList', { userId: session.user.id, mode: 'following' })}
        >
          <Text style={styles.countNumber}>{followCounts.following}</Text>
          <Text style={styles.countLabel}>{t.myPage.following}</Text>
        </Pressable>
      </View>

      <View style={styles.footerLinksRow}>
        <Pressable onPress={() => navigation.navigate('Help')} hitSlop={8}>
          <Text style={styles.footerLinkText}>{t.myPage.help}</Text>
        </Pressable>
        <Text style={styles.footerLinkDivider}>・</Text>
        <Pressable onPress={() => navigation.navigate('About')} hitSlop={8}>
          <Text style={styles.footerLinkText}>{t.myPage.about}</Text>
        </Pressable>
        <Text style={styles.footerLinkDivider}>・</Text>
        <Pressable onPress={() => navigation.navigate('BlockedUsers')} hitSlop={8}>
          <Text style={styles.footerLinkText}>{t.myPage.blockedUsers}</Text>
        </Pressable>
        <Text style={styles.footerLinkDivider}>・</Text>
        <Pressable onPress={() => navigation.navigate('Contact')} hitSlop={8}>
          <Text style={styles.footerLinkText}>{t.myPage.contact}</Text>
        </Pressable>
        {/* 運営(is_admin)本人のアカウントでログインしている場合のみ、問い合わせ管理画面への
            リンクを表示する(見た目上も隠しておき、実際のアクセス制御はRLS側で行う)。 */}
        {isAdmin && (
          <>
            <Text style={styles.footerLinkDivider}>・</Text>
            <Pressable onPress={() => navigation.navigate('AdminInbox')} hitSlop={8}>
              <Text style={styles.footerLinkText}>問い合わせ管理</Text>
            </Pressable>
          </>
        )}
        {/* ホーム画面への追加はWeb版限定。すでにホーム画面から起動している場合は表示不要 */}
        {Platform.OS === 'web' && !isStandaloneDisplay() && (
          <>
            <Text style={styles.footerLinkDivider}>・</Text>
            <Pressable onPress={() => navigation.navigate('AddToHomeScreen')} hitSlop={8}>
              <Text style={styles.footerLinkText}>{t.myPage.addToHomeScreen}</Text>
            </Pressable>
          </>
        )}
      </View>

      <View style={styles.tabRow}>
        {TABS.map((tab, index) => (
          <Pressable key={tab.icon} style={styles.tabButton} onPress={() => goToPage(index)}>
            <Ionicons
              name={tab.icon}
              size={24}
              color={pageIndex === index ? colors.accent : colors.textMuted}
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
        <Animated.ScrollView
          ref={pagerRef}
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          onScroll={onPagerScroll}
          scrollEventThrottle={16}
          style={styles.pager}
        >
          {pages.map((pageSpots, index) => (
            <View key={index} style={{ width: screenWidth, flex: 1 }}>
              {/* 表示中のページと隣接ページのみ実描画し、負荷を抑える（未訪問ページは空のまま） */}
              {Math.abs(pageIndex - index) <= 1 ? (
                <FlatList
                  data={pageSpots}
                  keyExtractor={(item) => item.id}
                  numColumns={3}
                  style={styles.grid}
                  contentContainerStyle={{ padding: 4 }}
                  refreshControl={
                    <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.accent} />
                  }
                  // 画像の同時デコード数を抑え、初期表示時の操作不能な時間を短くする
                  initialNumToRender={12}
                  maxToRenderPerBatch={9}
                  windowSize={5}
                  removeClippedSubviews
                  ListEmptyComponent={<Text style={styles.emptyText}>{t.myPage.empty}</Text>}
                  renderItem={({ item }) => (
                    <Pressable
                      style={styles.gridItem}
                      onPress={() => navigation.navigate('SpotDetail', { spotId: item.slug })}
                    >
                      {spotThumbnailUrl(item) ? (
                        <Image source={{ uri: spotThumbnailUrl(item)! }} style={styles.gridImage} />
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
              ) : null}
            </View>
          ))}
        </Animated.ScrollView>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
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
  },
  avatarPlaceholder: {
    backgroundColor: colors.accent,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: { color: colors.accentText, fontSize: 18, fontWeight: '700' },
  username: { color: colors.textPrimary, fontSize: 16, fontWeight: '600' },
  displayName: { color: colors.textSecondary, fontSize: 13, marginTop: 2 },
  bio: { color: colors.textSecondary, fontSize: 13, paddingHorizontal: 20, marginBottom: 12, lineHeight: 19 },
  logoutText: { color: colors.textSecondary, fontSize: 12 },
  countsRow: { flexDirection: 'row', paddingHorizontal: 20, gap: 28, marginBottom: 16 },
  countItem: { alignItems: 'center' },
  countNumber: { color: colors.textPrimary, fontSize: 16, fontWeight: '700' },
  countLabel: { color: colors.textMuted, fontSize: 11, marginTop: 2 },
  footerLinksRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    rowGap: 6,
    paddingHorizontal: 20,
    marginBottom: 12,
  },
  footerLinkText: { color: colors.textMuted, fontSize: 11 },
  footerLinkDivider: { color: colors.textMuted, fontSize: 11, marginHorizontal: 6 },
  tabRow: { flexDirection: 'row' },
  tabButton: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingVertical: 10 },
  indicatorTrack: { height: 2, backgroundColor: colors.border },
  indicator: { height: 2, backgroundColor: colors.accent },
  // 残りの縦スペースをこのページャー(横スワイプ)に割り当てないと、
  // 中のFlatListの高さが確定せず投稿が多くても縦にスクロールできなくなる
  pager: { flex: 1 },
  grid: { flex: 1 },
  emptyText: { color: colors.textMuted, textAlign: 'center', marginTop: 40, fontSize: 13 },
  gridItem: { width: '33.33%', aspectRatio: 1, padding: 2 },
  gridImage: { flex: 1, borderRadius: 4 },
  noImage: { backgroundColor: colors.surface, alignItems: 'center', justifyContent: 'center', padding: 6 },
  noImageText: { color: colors.textMuted, fontSize: 11, textAlign: 'center' },
});
