import React, { useCallback, useState } from 'react';
import { View, Pressable, StyleSheet, FlatList, Image, ActivityIndicator, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import Text from '../components/AppText';
import PixelDoor from '../components/PixelDoor';
import Avatar from '../components/Avatar';
import { spotKicker } from '../lib/spotLabels';
import { spotRawTitle } from '../content/spotSeo';
import { Button } from '../components/Form';
import { HEADER_CONTENT_HEIGHT } from '../components/AppHeader';
import { fetchFollowingFeed, fetchRandomSpots, spotThumbnailUrl } from '../lib/spots';
import { filterBlockedAuthors } from '../lib/moderation';
import { useAuth } from '../lib/AuthContext';
import { useTranslation } from '../lib/i18n';
import { colors, radius, space, type } from '../lib/theme';
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
        {/* 共通ヘッダー(ロゴ)が最前面に重なっているため、その高さ分だけ空ける */}
        <View style={{ height: HEADER_CONTENT_HEIGHT }} />
        <View style={styles.loggedOutBox}>
          <PixelDoor size={56} ink={colors.accent} paper={colors.background} />
          <Text variant="body" style={styles.loggedOutText}>
            {t.feed.loggedOutMessage}
          </Text>
          <Button label={t.feed.loginButton} onPress={() => navigation.navigate('Auth')} style={styles.loginButton} />
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
          renderItem={({ item }) => {
            const thumb = spotThumbnailUrl(item);
            const kicker = spotKicker(item);
            const author = item.author?.display_name || item.author?.username;
            const embedPlatform = item.embeds?.find((e) => e.platform === 'instagram' || e.platform === 'x')?.platform;
            return (
              <Pressable
                style={({ pressed }) => [styles.card, pressed && styles.cardPressed]}
                onPress={() => navigation.navigate('SpotDetail', { spotId: item.slug })}
              >
                {thumb ? (
                  <Image source={{ uri: thumb }} style={styles.cardImage} />
                ) : (
                  // 写真もSNS投稿の画像も無いとき（Instagramの投稿など）は、灰色の大きな箱ではなく
                  // 低めの枠に「◯◯の投稿を見る」と出して、中身が詳細画面にあることを示す
                  <View style={styles.noImage}>
                    <Ionicons
                      name={embedPlatform === 'instagram' ? 'logo-instagram' : embedPlatform === 'x' ? 'logo-x' : 'image-outline'}
                      size={22}
                      color={colors.textMuted}
                    />
                    {embedPlatform && (
                      <Text variant="body" style={styles.noImageText}>
                        {t.feed.embedPlaceholder.replace('{platform}', embedPlatform === 'instagram' ? 'Instagram' : 'X')}
                      </Text>
                    )}
                  </View>
                )}
                <View style={styles.cardBody}>
                  {!!kicker && (
                    <Text style={styles.kicker} numberOfLines={1}>
                      {kicker}
                    </Text>
                  )}
                  <Text style={styles.title} numberOfLines={2}>
                    {spotRawTitle(item)}
                  </Text>
                  {!!item.description && (
                    <Text variant="body" style={styles.description} numberOfLines={2}>
                      {item.description}
                    </Text>
                  )}
                  <View style={styles.metaRow}>
                    <Pressable
                      style={styles.authorRow}
                      onPress={() => navigation.navigate('UserProfile', { userId: item.author_id })}
                      hitSlop={6}
                    >
                      <Avatar url={item.author?.avatar_url} name={author} size={22} />
                      <Text variant="body" style={styles.authorText} numberOfLines={1}>
                        {author}
                      </Text>
                    </Pressable>
                    {item.like_count > 0 && (
                      <Text variant="body" style={styles.likes}>
                        {t.feed.likes.replace('{n}', String(item.like_count))}
                      </Text>
                    )}
                  </View>
                </View>
              </Pressable>
            );
          }}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  loggedOutBox: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 32, gap: 20 },
  loggedOutText: { color: colors.textSecondary, fontSize: 14, textAlign: 'center', lineHeight: 23, maxWidth: 320 },
  loginButton: { width: '100%', maxWidth: 320 },
  modeTabs: { flexDirection: 'row', gap: space.s, paddingHorizontal: space.l, paddingBottom: space.m },
  modeTab: {
    height: 34,
    justifyContent: 'center',
    paddingHorizontal: space.l,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  modeTabActive: { backgroundColor: colors.accent, borderColor: colors.accent },
  modeTabText: { color: colors.textSecondary, fontSize: type.small },
  modeTabTextActive: { color: colors.accentText },
  emptyText: { color: colors.textMuted, textAlign: 'center', marginTop: 60, marginHorizontal: 32, fontSize: 13, lineHeight: 20 },
  card: {
    marginHorizontal: space.l,
    marginBottom: 20,
    borderRadius: radius.m,
    overflow: 'hidden',
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  cardPressed: { opacity: 0.85 },
  cardImage: { width: '100%', aspectRatio: 4 / 3, backgroundColor: colors.surfaceAlt },
  noImage: {
    height: 96,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: colors.surfaceAlt,
  },
  noImageText: { color: colors.textMuted, fontSize: 12 },
  cardBody: { padding: space.l, gap: space.s },
  kicker: { color: colors.accent, fontSize: type.caption, letterSpacing: 0.6 },
  title: { color: colors.textPrimary, fontSize: 17, lineHeight: 25 },
  description: { color: colors.textSecondary, fontSize: 14, lineHeight: 22 },
  metaRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: space.m, marginTop: space.xs },
  authorRow: { flexDirection: 'row', alignItems: 'center', gap: space.s, flexShrink: 1 },
  authorText: { color: colors.textSecondary, fontSize: 12, flexShrink: 1 },
  likes: { color: colors.textMuted, fontSize: 12 },
});
