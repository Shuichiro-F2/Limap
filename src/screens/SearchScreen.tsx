import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  Pressable,
  StyleSheet,
  FlatList,
  Image,
  ActivityIndicator,
  Keyboard,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { searchSpots, spotImageUrl } from '../lib/spots';
import { colors } from '../lib/theme';
import type { Spot } from '../types/database';
import type { MainTabScreenProps } from '../navigation/types';

type Props = MainTabScreenProps<'SearchTab'>;

const AVAILABLE_TAGS = [
  { id: 1, name: '廃墟' },
  { id: 2, name: '深夜' },
  { id: 3, name: '無人駅' },
  { id: 4, name: '地下道' },
  { id: 5, name: '駐車場' },
  { id: 6, name: '団地' },
  { id: 7, name: '遊園地跡' },
  { id: 8, name: '海外' },
  { id: 9, name: '雨の日' },
  { id: 10, name: '人工照明' },
];

export default function SearchScreen({ navigation }: Props) {
  const [keyword, setKeyword] = useState('');
  const [selectedTags, setSelectedTags] = useState<number[]>([]);
  const [results, setResults] = useState<Spot[]>([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);

  const toggleTag = (id: number) => {
    setSelectedTags((prev) => (prev.includes(id) ? prev.filter((t) => t !== id) : [...prev, id]));
  };

  const runSearch = async () => {
    Keyboard.dismiss();
    setLoading(true);
    setSearched(true);
    try {
      const data = await searchSpots({ keyword, tagIds: selectedTags });
      setResults(data);
    } catch (e) {
      console.warn('検索エラー', e);
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
      <View style={styles.searchBar}>
        <TextInput
          style={styles.input}
          value={keyword}
          onChangeText={setKeyword}
          placeholder="タイトルや説明文で検索"
          placeholderTextColor="#666"
          onSubmitEditing={runSearch}
          returnKeyType="search"
        />
        <Pressable style={styles.searchButton} onPress={runSearch}>
          <Text style={styles.searchButtonText}>検索</Text>
        </Pressable>
      </View>

      <View style={styles.tagGrid}>
        {AVAILABLE_TAGS.map((tag) => (
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

      {loading ? (
        <ActivityIndicator color={colors.textPrimary} style={{ marginTop: 24 }} />
      ) : (
        <FlatList
          data={results}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ padding: 16 }}
          ListEmptyComponent={
            searched ? <Text style={styles.emptyText}>該当するスポットが見つかりませんでした</Text> : null
          }
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
    backgroundColor: colors.accent,
    borderRadius: 10,
    paddingHorizontal: 16,
    justifyContent: 'center',
  },
  searchButtonText: { color: colors.accentText, fontSize: 14, fontWeight: '600' },
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
});
