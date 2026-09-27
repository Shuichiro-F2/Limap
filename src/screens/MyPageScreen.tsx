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
import { HEADER_CONTENT_HEIGHT } from '../components/AppHeader';
import { fetchSpotsByAuthor, fetchLikedSpots, fetchBookmarkedSpots, spotThumbnailUrl } from '../lib/spots';
import { fetchFollowCounts, type FollowCounts } from '../lib/profiles';
import { useAuth } from '../lib/AuthContext';
import { useTranslation } from '../lib/i18n';
import { colors, space, type } from '../lib/theme';
import ProfileHeader from '../components/ProfileHeader';
import { Button } from '../components/Form';
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
  const { profile, session } = useAuth();
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
      {/* 共通ヘッダー(ロゴ+このタブの時だけのハンバーガーメニュー)が最前面に重なっているため、その高さ分だけ空ける */}
      <View style={{ height: HEADER_CONTENT_HEIGHT }} />

      <ProfileHeader
        profile={profile}
        posts={mineSpots.length}
        followers={followCounts.followers}
        following={followCounts.following}
        onPressFollowers={() =>
          session?.user && navigation.navigate('FollowList', { userId: session.user.id, mode: 'followers' })
        }
        onPressFollowing={() =>
          session?.user && navigation.navigate('FollowList', { userId: session.user.id, mode: 'following' })
        }
      >
        {/* ログアウトは誤って押さないよう、右上のメニューの中に移した */}
        <Button
          compact
          variant="secondary"
          icon="create-outline"
          label={t.profile.editProfile}
          onPress={() => navigation.navigate('EditProfile')}
        />
      </ProfileHeader>

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
                  ListEmptyComponent={<Text variant="body" style={styles.emptyText}>{t.myPage.empty}</Text>}
                  renderItem={({ item }) => (
                    <Pressable
                      style={styles.gridItem}
                      onPress={() => navigation.navigate('SpotDetail', { spotId: item.slug })}
                    >
                      {spotThumbnailUrl(item) ? (
                        <Image source={{ uri: spotThumbnailUrl(item)! }} style={styles.gridImage} />
                      ) : (
                        <View style={[styles.gridImage, styles.noImage]}>
                          <Text variant="body" style={styles.noImageText} numberOfLines={3}>
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
  tabRow: { flexDirection: 'row' },
  tabButton: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingVertical: 10 },
  indicatorTrack: { height: 2, backgroundColor: colors.border },
  indicator: { height: 2, backgroundColor: colors.accent },
  // 残りの縦スペースをこのページャー(横スワイプ)に割り当てないと、
  // 中のFlatListの高さが確定せず投稿が多くても縦にスクロールできなくなる
  pager: { flex: 1 },
  grid: { flex: 1 },
  emptyText: { color: colors.textMuted, textAlign: 'center', marginTop: 40, fontSize: type.small },
  gridItem: { width: '33.33%', aspectRatio: 1, padding: 2 },
  gridImage: { flex: 1, borderRadius: 6, backgroundColor: colors.surface },
  noImage: { alignItems: 'center', justifyContent: 'center', padding: space.s },
  noImageText: { color: colors.textMuted, fontSize: type.caption, lineHeight: 16, textAlign: 'center' },
});
