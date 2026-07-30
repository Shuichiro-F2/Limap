import React, { useCallback, useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  Image,
  Pressable,
  ActivityIndicator,
  RefreshControl,
  useWindowDimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import {
  fetchRandomSpots,
  fetchLikedSpots,
  fetchBookmarkedSpots,
  toggleLike,
  toggleBookmark,
  spotImageUrl,
} from '../lib/spots';
import { useAuth } from '../lib/AuthContext';
import { colors } from '../lib/theme';
import type { Spot } from '../types/database';
import type { MainTabScreenProps } from '../navigation/types';

type Props = MainTabScreenProps<'FeedTab'>;

export default function FeedScreen({ navigation }: Props) {
  const { session } = useAuth();
  const { width: screenWidth } = useWindowDimensions();
  const [spots, setSpots] = useState<Spot[]>([]);
  const [likedIds, setLikedIds] = useState<Set<string>>(new Set());
  const [bookmarkedIds, setBookmarkedIds] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    try {
      const [randomSpots, liked, bookmarked] = await Promise.all([
        fetchRandomSpots(30),
        session?.user ? fetchLikedSpots(session.user.id) : Promise.resolve([]),
        session?.user ? fetchBookmarkedSpots(session.user.id) : Promise.resolve([]),
      ]);
      setSpots(randomSpots);
      setLikedIds(new Set(liked.map((s) => s.id)));
      setBookmarkedIds(new Set(bookmarked.map((s) => s.id)));
    } catch (e) {
      console.warn('フィード取得エラー', e);
    }
  }, [session?.user?.id]);

  useEffect(() => {
    setLoading(true);
    load().finally(() => setLoading(false));
  }, [load]);

  const onRefresh = async () => {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  };

  const handleToggleLike = async (spotId: string) => {
    if (!session?.user) return;
    const isLiked = likedIds.has(spotId);
    setLikedIds((prev) => {
      const next = new Set(prev);
      isLiked ? next.delete(spotId) : next.add(spotId);
      return next;
    });
    try {
      await toggleLike(session.user.id, spotId, isLiked);
    } catch {
      setLikedIds((prev) => {
        const next = new Set(prev);
        isLiked ? next.add(spotId) : next.delete(spotId);
        return next;
      });
    }
  };

  const handleToggleBookmark = async (spotId: string) => {
    if (!session?.user) return;
    const isBookmarked = bookmarkedIds.has(spotId);
    setBookmarkedIds((prev) => {
      const next = new Set(prev);
      isBookmarked ? next.delete(spotId) : next.add(spotId);
      return next;
    });
    try {
      await toggleBookmark(session.user.id, spotId, isBookmarked);
    } catch {
      setBookmarkedIds((prev) => {
        const next = new Set(prev);
        isBookmarked ? next.add(spotId) : next.delete(spotId);
        return next;
      });
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>フィード</Text>
        <Pressable style={styles.refreshButton} onPress={onRefresh} hitSlop={10}>
          <Ionicons name="shuffle-outline" size={22} color={colors.textPrimary} />
        </Pressable>
      </View>

      {loading ? (
        <ActivityIndicator color={colors.textPrimary} style={{ marginTop: 40 }} />
      ) : (
        <FlatList
          data={spots}
          keyExtractor={(item) => item.id}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.accent} />
          }
          contentContainerStyle={{ paddingBottom: 24 }}
          ListEmptyComponent={<Text style={styles.emptyText}>まだ表示できる投稿がありません</Text>}
          renderItem={({ item }) => {
            const liked = likedIds.has(item.id);
            const bookmarked = bookmarkedIds.has(item.id);
            return (
              <Pressable
                style={styles.card}
                onPress={() => navigation.navigate('SpotDetail', { spotId: item.id })}
              >
                {item.images && item.images.length > 0 ? (
                  <Image
                    source={{ uri: spotImageUrl(item.images[0].storage_path) }}
                    style={[styles.cardImage, { width: screenWidth }]}
                    resizeMode="cover"
                  />
                ) : (
                  <View style={[styles.cardImage, styles.noImage, { width: screenWidth }]} />
                )}

                <View style={styles.cardBody}>
                  <View style={styles.cardHeaderRow}>
                    <Text style={styles.cardTitle} numberOfLines={1}>
                      {item.title}
                    </Text>
                    <View style={styles.iconRow}>
                      <Pressable hitSlop={10} onPress={() => handleToggleLike(item.id)}>
                        <Ionicons
                          name={liked ? 'heart' : 'heart-outline'}
                          size={22}
                          color={liked ? colors.danger : colors.textSecondary}
                        />
                      </Pressable>
                      <Pressable hitSlop={10} onPress={() => handleToggleBookmark(item.id)}>
                        <Ionicons
                          name={bookmarked ? 'bookmark' : 'bookmark-outline'}
                          size={20}
                          color={bookmarked ? colors.accent : colors.textSecondary}
                        />
                      </Pressable>
                    </View>
                  </View>
                  <Text style={styles.cardMeta} numberOfLines={1}>
                    {item.city ?? ''} {item.country ?? ''} ・@{item.author?.username}
                  </Text>
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
            );
          }}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 8,
  },
  headerTitle: { color: colors.textPrimary, fontSize: 20, fontWeight: '700' },
  refreshButton: { padding: 4 },
  emptyText: { color: colors.textMuted, textAlign: 'center', marginTop: 40, fontSize: 13 },
  card: { marginBottom: 18 },
  cardImage: { height: 320 },
  noImage: { backgroundColor: colors.surfaceAlt },
  cardBody: { paddingHorizontal: 16, paddingTop: 10 },
  cardHeaderRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  cardTitle: { color: colors.textPrimary, fontSize: 16, fontWeight: '700', flex: 1, marginRight: 12 },
  iconRow: { flexDirection: 'row', gap: 14 },
  cardMeta: { color: colors.textSecondary, fontSize: 12, marginTop: 4 },
  tagRow: { flexDirection: 'row', flexWrap: 'wrap', marginTop: 8, gap: 6 },
  tagChip: {
    backgroundColor: colors.surface,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  tagChipText: { color: colors.textSecondary, fontSize: 11 },
});
