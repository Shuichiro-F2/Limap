import React, { useCallback, useState } from 'react';
import { View, Pressable, StyleSheet, FlatList, Image, ActivityIndicator, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import Text from '../components/AppText';
import { HEADER_CONTENT_HEIGHT } from '../components/AppHeader';
import { UsernameWithBadge } from '../components/UserBadge';
import { fetchFollowingFeed, fetchRandomSpots, spotThumbnailUrl } from '../lib/spots';
import { filterBlockedAuthors } from '../lib/moderation';
import { useAuth } from '../lib/AuthContext';
import { useTranslation } from '../lib/i18n';
import { colors } from '../lib/theme';
import type { Spot } from '../types/database';
import type { MainTabScreenProps } from '../navigation/types';

type Props = MainTabScreenProps<'FeedTab'>;
type FeedMode = 'recommended' | 'following';

// タイムラインタブ。「おすすめ」（全投稿からランダム抽出）と「フォロー中」を
// 切り替えられる。デフォルトは「おすすめ」にして、まだ誰もフォローしていない
// ユーザーでもタイムラインが空にならないようにする。
// マイページと違い、未ログインでも画面自体は開けるが、中身はログインを促す表示にする
// （フォロー関係という個人的な情報に基づくタブのため）。
export default function FeedScreen({ navigation }: Props) {
  const { session, blockedUserIds } = useAuth();
  const t = useTranslation();
  const [mode, setMode] = useState<FeedMode>('recommended');
  const [spots, setSpots] = useState<Spot[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(
    async (m: FeedMode) => {
      if (!session?.user) return;
      try {
        const data = m === 'following' ? await fetchFollowingFeed(session.user.id) : await fetchRandomSpots();
        setSpots(filterBlockedAuthors(data, blockedUserIds));
      } catch (e) {
        console.warn('フィード取得エラー', e);
      }
    },
    [session?.user?.id, blockedUserIds]
  );

  useFocusEffect(
    useCallback(() => {
      if (!session?.user) {
        setLoading(false);
        return;
      }
      setLoading(true);
      load(mode).finally(() => setLoading(false));
    }, [load, session?.user?.id, mode])
  );

  const onRefresh = async () => {
    setRefreshing(true);
    await load(mode);
    setRefreshing(false);
  };

  if (!session?.user) {
    return (
      <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
        {/* 共通ヘッダー(ロゴ+言語トグル)が最前面に重なっているため、その高さ分だけ空ける */}
        <View style={{ height: HEADER_CONTENT_HEIGHT }} />
        <View style={styles.loggedOutBox}>
          <Text style={styles.loggedOutText}>{t.feed.loggedOutMessage}</Text>
          <Pressable style={styles.loginButton} onPress={() => navigation.navigate('Auth')}>
            <Text style={styles.loginButtonText}>{t.feed.loginButton}</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
      <View style={{ height: HEADER_CONTENT_HEIGHT }} />

      <View style={styles.modeTabs}>
        <Pressable
          style={[styles.modeTab, mode === 'recommended' && styles.modeTabActive]}
          onPress={() => setMode('recommended')}
        >
          <Text style={[styles.modeTabText, mode === 'recommended' && styles.modeTabTextActive]}>
            {t.feed.recommendedTab}
          </Text>
        </Pressable>
        <Pressable
          style={[styles.modeTab, mode === 'following' && styles.modeTabActive]}
          onPress={() => setMode('following')}
        >
          <Text style={[styles.modeTabText, mode === 'following' && styles.modeTabTextActive]}>
            {t.feed.followingTab}
          </Text>
        </Pressable>
      </View>

      {loading ? (
        <ActivityIndicator color={colors.textPrimary} style={{ marginTop: 24 }} />
      ) : (
        <FlatList
          data={spots}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ paddingBottom: 24 }}
          initialNumToRender={4}
          maxToRenderPerBatch={4}
          windowSize={5}
          removeClippedSubviews
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.accent} />}
          ListEmptyComponent={
            <Text style={styles.emptyText}>{mode === 'following' ? t.feed.empty : t.feed.recommendedEmpty}</Text>
          }
          renderItem={({ item }) => (
            <Pressable
              style={styles.card}
              onPress={() => navigation.navigate('SpotDetail', { spotId: item.slug })}
            >
              {spotThumbnailUrl(item) ? (
                <Image source={{ uri: spotThumbnailUrl(item)! }} style={styles.cardImage} />
              ) : (
                <View style={[styles.cardImage, styles.noImage]} />
              )}
              <View style={styles.cardBody}>
                <Pressable
                  onPress={() => navigation.navigate('UserProfile', { userId: item.author_id })}
                  hitSlop={4}
                >
                  <UsernameWithBadge username={item.author?.username} badge={item.author?.badge} textStyle={styles.authorText} />
                </Pressable>
                {item.description ? (
                  <Text style={styles.description} numberOfLines={2}>
                    {item.description}
                  </Text>
                ) : null}
                {item.tags && item.tags.length > 0 && (
                  <View style={styles.tagRow}>
                    {item.tags.slice(0, 4).map((tag) => (
                      <View key={tag.id} style={styles.tagChip}>
                        <Text style={styles.tagChipText}>{tag.name}</Text>
                      </View>
                    ))}
                  </View>
                )}
              </View>
            </Pressable>
          )}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  loggedOutBox: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 32, gap: 16 },
  loggedOutText: { color: colors.textSecondary, fontSize: 14, textAlign: 'center', lineHeight: 21 },
  loginButton: { backgroundColor: colors.accent, borderRadius: 10, paddingVertical: 12, paddingHorizontal: 28 },
  loginButtonText: { color: colors.accentText, fontWeight: '600', fontSize: 14 },
  modeTabs: { flexDirection: 'row', gap: 8, paddingHorizontal: 16, paddingBottom: 12 },
  modeTab: {
    paddingVertical: 8,
    paddingHorizontal: 18,
    borderRadius: 18,
    backgroundColor: colors.surface,
  },
  modeTabActive: { backgroundColor: colors.accent },
  modeTabText: { color: colors.textSecondary, fontSize: 13, fontWeight: '600' },
  modeTabTextActive: { color: colors.accentText },
  emptyText: { color: colors.textMuted, textAlign: 'center', marginTop: 60, marginHorizontal: 32, fontSize: 13, lineHeight: 20 },
  card: { marginHorizontal: 16, marginBottom: 20, borderRadius: 14, overflow: 'hidden', backgroundColor: colors.surface },
  cardImage: { width: '100%', aspectRatio: 4 / 3 },
  noImage: { backgroundColor: colors.surfaceAlt },
  cardBody: { padding: 14 },
  authorText: { color: colors.accent, fontSize: 13, fontWeight: '600', marginBottom: 6 },
  description: { color: colors.textPrimary, fontSize: 14, lineHeight: 20 },
  tagRow: { flexDirection: 'row', flexWrap: 'wrap', marginTop: 10, gap: 6 },
  tagChip: {
    backgroundColor: colors.surfaceAlt,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  tagChipText: { color: colors.textSecondary, fontSize: 11, fontWeight: '600' },
});
