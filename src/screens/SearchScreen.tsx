import React, { useEffect, useState } from 'react';
import {
  View,
  Pressable,
  StyleSheet,
  ScrollView,
  FlatList,
  Image,
  ActivityIndicator,
  Keyboard,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import Text from '../components/AppText';
import TextInput from '../components/AppTextInput';
import { HEADER_CONTENT_HEIGHT } from '../components/AppHeader';
import { searchSpots, spotThumbnailUrl } from '../lib/spots';
import { fetchAllTags } from '../lib/tags';
import { useTranslation } from '../lib/i18n';
import { colors } from '../lib/theme';
import type { Spot, Tag } from '../types/database';
import type { MainTabScreenProps } from '../navigation/types';

type Props = MainTabScreenProps<'SearchTab'>;

export default function SearchScreen({ navigation, route }: Props) {
  const t = useTranslation();
  const [keyword, setKeyword] = useState('');
  const [selectedTags, setSelectedTags] = useState<number[]>([]);
  const [results, setResults] = useState<Spot[]>([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);

  // タグは固定リストではなく、DBに存在するものをその都度取得する。
  // おすすめ投稿のフィードは廃止し、代わりにこの雰囲気タグ一覧を検索タブの主要コンテンツにする。
  const [allTags, setAllTags] = useState<Tag[]>([]);
  useEffect(() => {
    fetchAllTags()
      .then(setAllTags)
      .catch((e) => console.warn('タグ取得エラー', e));
  }, []);

  // タグをタップした時点で、検索ボタンを押さなくてもそのタグの投稿一覧を即座に表示する
  const toggleTag = (id: number) => {
    const next = selectedTags.includes(id) ? selectedTags.filter((t) => t !== id) : [...selectedTags, id];
    setSelectedTags(next);
    if (next.length === 0 && keyword.trim() === '') {
      clearSearch();
    } else {
      runSearch({ tagIds: next });
    }
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

  // 検索バーを空にして送信すると、タグ一覧の初期表示に戻す
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

  const tagChips = (
    <View style={styles.tagGrid}>
      {allTags.map((tag) => (
        <Pressable
          key={tag.id}
          style={[styles.tagOption, selectedTags.includes(tag.id) && styles.tagOptionSelected]}
          onPress={() => toggleTag(tag.id)}
        >
          <Text style={[styles.tagOptionText, selectedTags.includes(tag.id) && styles.tagOptionTextSelected]}>
            {tag.name}
          </Text>
        </Pressable>
      ))}
    </View>
  );

  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
      {/* 共通ヘッダー(ロゴ+言語トグル)が最前面に重なっているため、その高さ分だけ空けてから検索バーを配置する */}
      <View style={{ height: HEADER_CONTENT_HEIGHT }} />
      <View style={styles.searchBar}>
        <TextInput
          style={styles.input}
          value={keyword}
          onChangeText={setKeyword}
          placeholder={t.search.placeholder}
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

      {searched ? (
        <>
          <View style={styles.compactTagRow}>{tagChips}</View>
          {loading ? (
            <ActivityIndicator color={colors.textPrimary} style={{ marginTop: 24 }} />
          ) : (
            <FlatList
              data={results}
              keyExtractor={(item) => item.id}
              contentContainerStyle={{ padding: 16 }}
              initialNumToRender={10}
              maxToRenderPerBatch={8}
              windowSize={5}
              removeClippedSubviews
              ListEmptyComponent={<Text style={styles.emptyText}>{t.search.empty}</Text>}
              renderItem={({ item }) => (
                <Pressable
                  style={styles.resultCard}
                  onPress={() => navigation.navigate('SpotDetail', { spotId: item.slug })}
                >
                  {spotThumbnailUrl(item) ? (
                    <Image source={{ uri: spotThumbnailUrl(item)! }} style={styles.thumb} />
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
          )}
        </>
      ) : (
        <ScrollView contentContainerStyle={styles.browseScroll}>{tagChips}</ScrollView>
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
    // Web版は16px未満だとiOS Safariがフォーカス時に自動ズームし、フォーカスが
    // 外れても画面全体が拡大されたまま戻らなくなるため16px以上にする。
    fontSize: Platform.OS === 'web' ? 16 : 14,
  },
  searchButton: {
    width: 44,
    backgroundColor: colors.accent,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  compactTagRow: { paddingHorizontal: 16, paddingBottom: 4 },
  browseScroll: { paddingHorizontal: 16, paddingTop: 16, paddingBottom: 40 },
  tagGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
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
});
