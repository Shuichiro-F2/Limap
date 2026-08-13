import React, { useCallback, useEffect, useState } from 'react';
import {
  View,
  Pressable,
  StyleSheet,
  FlatList,
  Image,
  ActivityIndicator,
  Keyboard,
  RefreshControl,
  useWindowDimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import Text from '../components/AppText';
import TextInput from '../components/AppTextInput';
import { searchSpots, fetchRandomSpots, spotImageUrl } from '../lib/spots';
import { fetchAllTags } from '../lib/tags';
import { colors } from '../lib/theme';
import type { Spot, Tag } from '../types/database';
import type { MainTabScreenProps } from '../navigation/types';

const GRID_GAP = 2;
const GRID_COLUMNS = 3;

type Props = MainTabScreenProps<'SearchTab'>;

export default function SearchScreen({ navigation, route }: Props) {
  const { width: screenWidth } = useWindowDimensions();
  const tileSize = (screenWidth - GRID_GAP * (GRID_COLUMNS - 1)) / GRID_COLUMNS;

  const [keyword, setKeyword] = useState('');
  const [selectedTags, setSelectedTags] = useState<number[]>([]);
  const [results, setResults] = useState<Spot[]>([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);

  // タグは固定リストではなく、DBに存在するものをその都度取得する
  const [allTags, setAllTags] = useState<Tag[]>([]);
  useEffect(() => {
    fetchAllTags()
      .then(setAllTags)
      .catch((e) => console.warn('タグ取得エラー', e));
  }, []);

  // 検索前のデフォルト表示：Instagramの発見タブのようなおすすめ投稿のグリッド
  const [recommended, setRecommended] = useState<Spot[]>([]);
  const [loadingRecommended, setLoadingRecommended] = useState(true);
  const [refreshingRecommended, setRefreshingRecommended] = useState(false);

  const loadRecommended = useCallback(async () => {
    try {
      const data = await fetchRandomSpots(30);
      setRecommended(data);
    } catch (e) {
      console.warn('おすすめ取得エラー', e);
    }
  }, []);

  useEffect(() => {
    loadRecommended().finally(() => setLoadingRecommended(false));
  }, [loadRecommended]);

  const shuffleRecommended = async () => {
    setRefreshingRecommended(true);
    await loadRecommended();
    setRefreshingRecommended(false);
  };

  const toggleTag = (id: number) => {
    setSelectedTags((prev) => (prev.includes(id) ? prev.filter((t) => t !== id) : [...prev, id]));
  };

  const runSearch = async (overrides?: { keyword?: string; tagIds?: number[] }) => {
    Keyboard.dismiss();
    const searchKeyword = overrides?.keyword ?? keyword;
    const searchTagIds = overrides?.tagIds ?? selectedTags;
    setLoading(true);
    setSearched(true);
    try {
      const data = await searchSpots({ keyword: searchKeyword, tagIds: searchTagIds });
      setResults(data);
    } catch (e) {
      console.warn('検索エラー', e);
    } finally {
      setLoading(false);
    }
  };

  // 検索バーを空にして送信すると、おすすめグリッドの初期表示に戻す
  const clearSearch = () => {
    setKeyword('');
    setSelectedTags([]);
    setResults([]);
    setSearched(false);
  };

  // 投稿詳細のタグをタップして遷移してきた場合、そのタグで自動的に絞り込む
  useEffect(() => {
    const tagId = route.params?.tagId;
    if (tagId == null) return;
    setKeyword('');
    setSelectedTags([tagId]);
    runSearch({ keyword: '', tagIds: [tagId] });
    navigation.setParams({ tagId: undefined });
  }, [route.params?.tagId]);

  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
      <View style={styles.searchBar}>
        <TextInput
          style={styles.input}
          value={keyword}
          onChangeText={setKeyword}
          placeholder="タイトルや説明文で検索"
          placeholderTextColor="#666"
          onSubmitEditing={() => runSearch()}
          returnKeyType="search"
        />
        {searched ? (
          <Pressable style={styles.searchButton} onPress={clearSearch} hitSlop={8}>
            <Ionicons name="close-outline" size={20} color={colors.accentText} />
          </Pressable>
        ) : (
          <Pressable style={styles.searchButton} onPress={() => runSearch()} hitSlop={8}>
            <Ionicons name="search-outline" size={18} color={colors.accentText} />
          </Pressable>
        )}
      </View>

      <View style={styles.tagGrid}>
        {allTags.map((tag) => (
          <Pressable
            key={tag.id}
            style={[styles.tagOption, selectedTags.includes(tag.id) && styles.tagOptionSelected]}
            onPress={() => toggleTag(tag.id)}
          >
            <Text
              style={[styles.tagOptionText, selectedTags.includes(tag.id) && styles.tagOptionTextSelected]}
            >
              {tag.name}
            </Text>
          </Pressable>
        ))}
      </View>

      {searched ? (
        loading ? (
          <ActivityIndicator color={colors.textPrimary} style={{ marginTop: 24 }} />
        ) : (
          <FlatList
            data={results}
            keyExtractor={(item) => item.id}
            contentContainerStyle={{ padding: 16 }}
            ListEmptyComponent={<Text style={styles.emptyText}>該当するスポットが見つかりませんでした</Text>}
            renderItem={({ item }) => (
              <Pressable
                style={styles.resultCard}
                onPress={() => navigation.navigate('SpotDetail', { spotId: item.id })}
              >
                {item.images && item.images.length > 0 ? (
                  <Image source={{ uri: spotImageUrl(item.images[0].storage_path) }} style={styles.thumb} />
                ) : (
                  <View style={[styles.thumb, styles.noThumb]} />
                )}
                <View style={styles.cardBody}>
                  <Text style={styles.cardTitle} numberOfLines={1}>
                    {item.title}
                  </Text>
                  <Text style={styles.cardMeta} numberOfLines={1}>
                    {item.city ?? ''} {item.country ?? ''}
                  </Text>
                </View>
              </Pressable>
            )}
          />
        )
      ) : loadingRecommended ? (
        <ActivityIndicator color={colors.textPrimary} style={{ marginTop: 24 }} />
      ) : (
        <>
          <View style={styles.recommendedHeader}>
            <Text style={styles.recommendedTitle}>おすすめ</Text>
            <Pressable style={styles.shuffleButton} onPress={shuffleRecommended} hitSlop={10}>
              <Ionicons name="shuffle-outline" size={20} color={colors.textPrimary} />
            </Pressable>
          </View>
          <FlatList
            data={recommended}
            keyExtractor={(item) => item.id}
            numColumns={GRID_COLUMNS}
            columnWrapperStyle={{ justifyContent: 'space-between' }}
            contentContainerStyle={{ paddingBottom: 24 }}
            refreshControl={
              <RefreshControl
                refreshing={refreshingRecommended}
                onRefresh={shuffleRecommended}
                tintColor={colors.accent}
              />
            }
            ListEmptyComponent={<Text style={styles.emptyText}>まだ表示できる投稿がありません</Text>}
            renderItem={({ item }) => (
              <Pressable
                style={[styles.gridTile, { width: tileSize, height: tileSize }]}
                onPress={() => navigation.navigate('SpotDetail', { spotId: item.id })}
              >
                {item.images && item.images.length > 0 ? (
                  <Image source={{ uri: spotImageUrl(item.images[0].storage_path) }} style={styles.gridImage} />
                ) : (
                  <View style={[styles.gridImage, styles.noThumb]} />
                )}
              </Pressable>
            )}
          />
        </>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  searchBar: { flexDirection: 'row', padding: 16, gap: 8 },
  input: {
    flex: 1,
    backgroundColor: colors.surface,
    color: colors.textPrimary,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 14,
  },
  searchButton: {
    width: 44,
    backgroundColor: colors.accent,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tagGrid: { flexDirection: 'row', flexWrap: 'wrap', paddingHorizontal: 16, gap: 8 },
  tagOption: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 6,
    marginRight: 6,
    marginBottom: 8,
  },
  tagOptionSelected: { backgroundColor: colors.accent, borderColor: colors.accent },
  tagOptionText: { color: colors.textSecondary, fontSize: 12 },
  tagOptionTextSelected: { color: colors.accentText, fontWeight: '600' },
  emptyText: { color: colors.textMuted, textAlign: 'center', marginTop: 40, fontSize: 13 },
  resultCard: {
    flexDirection: 'row',
    backgroundColor: colors.surface,
    borderRadius: 10,
    marginBottom: 10,
    overflow: 'hidden',
  },
  thumb: { width: 72, height: 72 },
  noThumb: { backgroundColor: colors.surfaceAlt },
  cardBody: { flex: 1, padding: 10, justifyContent: 'center' },
  cardTitle: { color: colors.textPrimary, fontSize: 14, fontWeight: '600' },
  cardMeta: { color: colors.textSecondary, fontSize: 12, marginTop: 4 },
  recommendedHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 4,
    paddingBottom: 8,
  },
  recommendedTitle: { color: colors.textPrimary, fontSize: 15, fontWeight: '700' },
  shuffleButton: { padding: 4 },
  gridTile: { marginBottom: GRID_GAP },
  gridImage: { width: '100%', height: '100%' },
});
