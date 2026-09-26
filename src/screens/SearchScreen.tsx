import React, { useEffect, useMemo, useState } from 'react';
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
import { fetchTagsWithCounts, type TagWithCount } from '../lib/tags';
import { filterBlockedAuthors } from '../lib/moderation';
import { useAuth } from '../lib/AuthContext';
import { useTranslation } from '../lib/i18n';
import { colors, radius, space, type } from '../lib/theme';
import { JAPAN_PREFECTURES, prefectureFullName } from '../content/japan';
import { COUNTRY_TAGS, spotPlace } from '../content/spotSeo';
import type { Spot } from '../types/database';
import type { MainTabScreenProps } from '../navigation/types';

type Props = MainTabScreenProps<'SearchTab'>;

// 一覧に最初に出す件数（「すべて見る」で全件）
const CATEGORY_LIMIT = 10;
const PREFECTURE_LIMIT = 6;
const COUNTRY_LIMIT = 8;
// 種類の一覧に出さないタグ（ほぼ全スポットに付いている総称・地域のまとめ）
const NON_CATEGORY_TAGS = new Set(['リミナルスペース', '日本', '海外']);
const PREFECTURE_SET = new Set(JAPAN_PREFECTURES);
const COUNTRY_SET = new Set(COUNTRY_TAGS);

type Section = 'category' | 'prefecture' | 'country';

export default function SearchScreen({ navigation, route }: Props) {
  const t = useTranslation();
  const { blockedUserIds } = useAuth();
  const [keyword, setKeyword] = useState('');
  const [selectedTags, setSelectedTags] = useState<number[]>([]);
  const [results, setResults] = useState<Spot[]>([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);
  const [expanded, setExpanded] = useState<Record<Section, boolean>>({
    category: false,
    prefecture: false,
    country: false,
  });

  // タグはDBに存在するもののうち、公開スポットが付いているものを件数の多い順に取得する。
  // 「種類」「都道府県」「海外（国）」に分けて、それぞれ上位だけを最初に見せる
  const [allTags, setAllTags] = useState<TagWithCount[]>([]);
  useEffect(() => {
    fetchTagsWithCounts()
      .then(setAllTags)
      .catch((e) => console.warn('タグ取得エラー', e));
  }, []);

  const groups = useMemo(() => {
    const categories = allTags.filter(
      (tag) => !NON_CATEGORY_TAGS.has(tag.name) && !PREFECTURE_SET.has(tag.name) && !COUNTRY_SET.has(tag.name)
    );
    const prefectures = allTags.filter((tag) => PREFECTURE_SET.has(tag.name));
    const countries = allTags.filter((tag) => COUNTRY_SET.has(tag.name));
    const overseas = allTags.find((tag) => tag.name === '海外') ?? null;
    return { categories, prefectures, countries, overseas };
  }, [allTags]);

  // タグをタップした時点で、検索ボタンを押さなくてもそのタグの投稿一覧を即座に表示する
  const toggleTag = (id: number) => {
    const next = selectedTags.includes(id) ? selectedTags.filter((tagId) => tagId !== id) : [...selectedTags, id];
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
      setResults(filterBlockedAuthors(data, blockedUserIds));
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

  const sectionHeader = (label: string, section: Section | null, total: number, limit: number) => (
    <View style={styles.sectionHeader}>
      <Text style={styles.sectionTitle}>{label}</Text>
      {section && total > limit && (
        <Pressable onPress={() => setExpanded((e) => ({ ...e, [section]: !e[section] }))} hitSlop={8}>
          <Text style={styles.sectionToggle}>{expanded[section] ? t.search.showLess : t.search.showAll}</Text>
        </Pressable>
      )}
    </View>
  );

  const chip = (tag: TagWithCount) => {
    const selected = selectedTags.includes(tag.id);
    return (
      <Pressable key={tag.id} style={[styles.chip, selected && styles.chipSelected]} onPress={() => toggleTag(tag.id)}>
        <Text style={[styles.chipText, selected && styles.chipTextSelected]}>{tag.name}</Text>
        <Text style={[styles.chipCount, selected && styles.chipCountSelected]}>{tag.count}</Text>
      </Pressable>
    );
  };

  const visibleCategories = expanded.category ? groups.categories : groups.categories.slice(0, CATEGORY_LIMIT);
  const visiblePrefectures = expanded.prefecture ? groups.prefectures : groups.prefectures.slice(0, PREFECTURE_LIMIT);
  const visibleCountries = expanded.country ? groups.countries : groups.countries.slice(0, COUNTRY_LIMIT);
  const overseasSummary = t.search.overseasSummary.replace(
    '{list}',
    groups.countries
      .slice(0, 3)
      .map((c) => `${c.name} ${c.count}`)
      .join('・')
  );

  const browse = (
    <View style={styles.browse}>
      {groups.categories.length > 0 && (
        <View style={styles.section}>
          {sectionHeader(t.search.sectionCategory, 'category', groups.categories.length, CATEGORY_LIMIT)}
          <View style={styles.chipWrap}>{visibleCategories.map(chip)}</View>
        </View>
      )}

      {groups.prefectures.length > 0 && (
        <View style={styles.section}>
          {sectionHeader(t.search.sectionPrefecture, 'prefecture', groups.prefectures.length, PREFECTURE_LIMIT)}
          <View style={styles.prefGrid}>
            {visiblePrefectures.map((tag) => {
              const selected = selectedTags.includes(tag.id);
              return (
                <Pressable
                  key={tag.id}
                  style={[styles.prefItem, selected && styles.prefItemSelected]}
                  onPress={() => toggleTag(tag.id)}
                >
                  <Text style={[styles.prefName, selected && styles.chipTextSelected]}>{prefectureFullName(tag.name)}</Text>
                  <Text style={[styles.chipCount, selected && styles.chipCountSelected]}>{tag.count}</Text>
                </Pressable>
              );
            })}
          </View>
        </View>
      )}

      {groups.overseas && (
        <View style={styles.section}>
          {sectionHeader(t.search.sectionOverseas, 'country', groups.countries.length, COUNTRY_LIMIT)}
          <Pressable
            style={[styles.overseasCard, selectedTags.includes(groups.overseas.id) && styles.prefItemSelected]}
            onPress={() => toggleTag(groups.overseas!.id)}
          >
            <View style={styles.overseasText}>
              <Text
                style={[styles.overseasTitle, selectedTags.includes(groups.overseas.id) && styles.chipTextSelected]}
              >
                {t.search.overseasAll}
              </Text>
              {groups.countries.length > 0 && (
                <Text variant="body" style={styles.overseasSummary} numberOfLines={1}>
                  {overseasSummary}
                </Text>
              )}
            </View>
            <Text style={styles.overseasCount}>{groups.overseas.count}</Text>
            <Ionicons name="chevron-forward" size={16} color={colors.accent} />
          </Pressable>
          {groups.countries.length > 0 && <View style={styles.chipWrap}>{visibleCountries.map(chip)}</View>}
        </View>
      )}
    </View>
  );

  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
      {/* 共通ヘッダー(ロゴ)が最前面に重なっているため、その高さ分だけ空けてから検索バーを配置する */}
      <View style={{ height: HEADER_CONTENT_HEIGHT }} />
      <View style={styles.searchBarWrap}>
        <View style={styles.searchBar}>
          <Ionicons name="search-outline" size={18} color={colors.textSecondary} />
          <TextInput
            style={styles.input}
            value={keyword}
            onChangeText={setKeyword}
            placeholder={t.search.placeholder}
            onSubmitEditing={() => runSearch()}
            returnKeyType="search"
          />
          {searched && (
            <Pressable onPress={clearSearch} hitSlop={10} accessibilityLabel="clear">
              <Ionicons name="close-circle" size={20} color={colors.textMuted} />
            </Pressable>
          )}
        </View>
      </View>

      {searched ? (
        loading ? (
          <ActivityIndicator color={colors.textPrimary} style={{ marginTop: space.xl }} />
        ) : (
          // 検索後はハッシュタグ一覧を隠し、その領域に検索結果を表示する。
          // スマホ版はタブのスワイプページャーと縦スクロールの相性が悪く、
          // タグ一覧の下に結果を並べるだけだと結果までスクロールで到達できなかったため。
          <FlatList
            style={styles.resultList}
            data={results}
            keyExtractor={(item) => item.id}
            contentContainerStyle={{ padding: space.l }}
            initialNumToRender={10}
            maxToRenderPerBatch={8}
            windowSize={5}
            removeClippedSubviews
            ListEmptyComponent={<Text style={styles.emptyText}>{t.search.empty}</Text>}
            renderItem={({ item }) => {
              const place = spotPlace(
                (item.tags || []).map((tag) => tag.name),
                item.city,
                item.country
              );
              return (
                <Pressable
                  style={styles.resultRow}
                  onPress={() => navigation.navigate('SpotDetail', { spotId: item.slug })}
                >
                  {spotThumbnailUrl(item) ? (
                    <Image source={{ uri: spotThumbnailUrl(item)! }} style={styles.thumb} />
                  ) : (
                    <View style={[styles.thumb, styles.noThumb]} />
                  )}
                  <View style={styles.cardBody}>
                    <Text style={styles.cardTitle} numberOfLines={2}>
                      {item.title}
                    </Text>
                    {place.label && (
                      <Text variant="body" style={styles.cardMeta} numberOfLines={1}>
                        {place.label}
                      </Text>
                    )}
                  </View>
                </Pressable>
              );
            }}
          />
        )
      ) : (
        // タグ一覧が画面に収まらない場合でもスマホ版で下までスクロールできるよう、
        // ScrollView自体にflex:1を与えて残りの縦スペースいっぱいに広げる
        // (contentContainerStyleだけでは高さが確定せず、はみ出た分が操作不能になっていた)。
        <ScrollView style={styles.browseScrollContainer} contentContainerStyle={styles.browseScroll}>
          {browse}
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  searchBarWrap: { paddingHorizontal: space.l, paddingTop: space.s, paddingBottom: space.m },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.s,
    height: 48,
    paddingHorizontal: space.l,
    borderRadius: radius.pill,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  input: {
    flex: 1,
    color: colors.textPrimary,
    // Web版は16px未満だとiOS Safariがフォーカス時に自動ズームし、フォーカスが
    // 外れても画面全体が拡大されたまま戻らなくなるため16px以上にする。
    fontSize: Platform.OS === 'web' ? 16 : type.body,
    paddingVertical: 0,
  },
  browseScrollContainer: { flex: 1 },
  browseScroll: { paddingHorizontal: space.l, paddingTop: space.s, paddingBottom: 40 },
  browse: { gap: space.xl },
  section: { gap: space.m },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline' },
  sectionTitle: { color: colors.textPrimary, fontSize: type.heading },
  sectionToggle: { color: colors.textMuted, fontSize: type.small },
  chipWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: space.s },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    height: 34,
    paddingHorizontal: 14,
    borderRadius: radius.pill,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  chipSelected: { backgroundColor: colors.accent, borderColor: colors.accent },
  chipText: { color: colors.textPrimary, fontSize: type.small },
  chipTextSelected: { color: colors.accentText },
  chipCount: { color: colors.textMuted, fontSize: type.caption },
  chipCountSelected: { color: colors.accentTextMuted },
  prefGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: space.s },
  prefItem: {
    width: '48.5%',
    height: 48,
    paddingHorizontal: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderRadius: radius.m,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  prefItemSelected: { backgroundColor: colors.accent, borderColor: colors.accent },
  prefName: { color: colors.textPrimary, fontSize: 14 },
  overseasCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.s,
    padding: space.l,
    borderRadius: radius.m,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  overseasText: { flex: 1, gap: 4 },
  overseasTitle: { color: colors.textPrimary, fontSize: type.body },
  overseasSummary: { color: colors.textMuted, fontSize: 12 },
  overseasCount: { color: colors.accent, fontSize: type.small },
  emptyText: { color: colors.textMuted, textAlign: 'center', marginTop: 40, fontSize: type.small },
  resultList: { flex: 1 },
  resultRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.m,
    paddingVertical: space.m,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
  },
  thumb: { width: 64, height: 64, borderRadius: radius.s },
  noThumb: { backgroundColor: colors.surfaceAlt },
  cardBody: { flex: 1, gap: 4 },
  cardTitle: { color: colors.textPrimary, fontSize: type.body, lineHeight: 22 },
  cardMeta: { color: colors.textMuted, fontSize: 12 },
});
