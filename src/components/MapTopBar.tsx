// 地図画面の上部（検索バー・絞り込みボタン・下地のグラデーション）。
// ネイティブ版(MapScreen.tsx)・Web版(MapScreen.web.tsx)の両方で使う。
import React from 'react';
import { ActivityIndicator, FlatList, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import Text from './AppText';
import TextInput from './AppTextInput';
import { HEADER_CONTENT_HEIGHT } from './AppHeader';
import { useTranslation } from '../lib/i18n';
import { colors, gradientBackground, radius, space, type } from '../lib/theme';
import type { SuggestResult } from '../lib/mapboxSearch';

// 絞り込みボタンに並べるタグ（tags テーブルのタグ名）。投稿数の多い「種類」のタグから選んでいる
export const MAP_FILTER_TAGS = ['廃墟', '地下', '駅', '集合住宅', '廃工場'] as const;

// 絞り込みの判定。「地下」で「地下鉄駅」「地下通路」も、「駅」で「地下鉄駅」も拾えるよう、タグ名の部分一致にする
export function spotMatchesFilter(tagNames: string[], filter: string | null): boolean {
  if (!filter) return true;
  return tagNames.some((name) => name.includes(filter));
}

// ロゴ・検索バー・絞り込みボタンの下に敷く、上から下へ透明になっていく暗い帯。
// 地図の明るい部分とロゴや文字が重なっても読めるようにする。
const scrimStyle = gradientBackground('linear-gradient(rgba(26,26,26,0.94) 50%, rgba(26,26,26,0))');

type Props = {
  query: string;
  onChangeQuery: (text: string) => void;
  onSubmit: () => void;
  onClear: () => void;
  searching: boolean;
  results: SuggestResult[];
  onSelectResult: (item: SuggestResult) => void;
  filter: string | null;
  onFilterChange: (filter: string | null) => void;
};

export default function MapTopBar({
  query,
  onChangeQuery,
  onSubmit,
  onClear,
  searching,
  results,
  onSelectResult,
  filter,
  onFilterChange,
}: Props) {
  const t = useTranslation();
  const insets = useSafeAreaInsets();

  return (
    <View style={styles.wrap} pointerEvents="box-none">
      <View
        style={[styles.scrim, scrimStyle, { height: insets.top + HEADER_CONTENT_HEIGHT + 150 }]}
        pointerEvents="none"
      />

      {/* 共通ヘッダー(ロゴ)が最前面に重なっているため、その高さ分だけ空けてから検索バーを配置する */}
      <View style={{ height: insets.top + HEADER_CONTENT_HEIGHT }} pointerEvents="none" />

      <View style={styles.inner} pointerEvents="box-none">
        <View style={styles.searchColumn} pointerEvents="box-none">
          <View style={styles.searchPill}>
            <Pressable onPress={onSubmit} hitSlop={8} accessibilityRole="button" accessibilityLabel={t.map.searchPlaceholder}>
              {searching ? (
                <ActivityIndicator color={colors.textSecondary} size="small" />
              ) : (
                <Ionicons name="search-outline" size={18} color={colors.textSecondary} />
              )}
            </Pressable>
            <TextInput
              variant="body"
              style={styles.searchInput}
              value={query}
              onChangeText={onChangeQuery}
              placeholder={t.map.searchPlaceholder}
              onSubmitEditing={onSubmit}
              returnKeyType="search"
            />
            {query.length > 0 && (
              <Pressable onPress={onClear} hitSlop={8} accessibilityRole="button" accessibilityLabel={t.map.clearSearch}>
                <Ionicons name="close-circle" size={18} color={colors.textMuted} />
              </Pressable>
            )}
          </View>

          {results.length > 0 && (
            <FlatList
              style={styles.resultList}
              data={results}
              keyExtractor={(item) => item.mapboxId}
              keyboardShouldPersistTaps="handled"
              renderItem={({ item, index }) => (
                <Pressable
                  style={[styles.resultItem, index > 0 && styles.resultDivider]}
                  onPress={() => onSelectResult(item)}
                >
                  <Text variant="body" style={styles.resultName} numberOfLines={1}>
                    {item.name}
                  </Text>
                  {!!item.placeFormatted && (
                    <Text variant="body" style={styles.resultText} numberOfLines={1}>
                      {item.placeFormatted}
                    </Text>
                  )}
                </Pressable>
              )}
            />
          )}
        </View>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.chipScroll}
          contentContainerStyle={styles.chipRow}
          keyboardShouldPersistTaps="handled"
        >
          {[null, ...MAP_FILTER_TAGS].map((name) => {
            const active = filter === name;
            const label = name ? (t.map.filterLabels[name] ?? name) : t.map.filterAll;
            return (
              <Pressable
                key={name ?? 'all'}
                style={[styles.chip, active && styles.chipActive]}
                onPress={() => onFilterChange(name)}
                accessibilityRole="button"
                aria-selected={active}
              >
                <Text style={[styles.chipText, active && styles.chipTextActive]}>{label}</Text>
              </Pressable>
            );
          })}
        </ScrollView>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { position: 'absolute', top: 0, left: 0, right: 0 },
  scrim: { position: 'absolute', top: 0, left: 0, right: 0 },
  inner: { paddingHorizontal: space.l, gap: space.m },
  // PCなど横長の画面で検索欄が画面いっぱいに間延びしないよう、幅に上限を付けて左に寄せる
  searchColumn: { width: '100%', maxWidth: 560, gap: space.m },
  searchPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.s + 2,
    height: 48,
    paddingHorizontal: space.l,
    borderRadius: radius.pill,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  searchInput: {
    flex: 1,
    height: '100%',
    color: colors.textPrimary,
    // 16px未満だとiOS Safariがフォーカス時に自動ズームし、フォーカスが外れても
    // ズームが戻らないまま画面全体が拡大された状態になってしまうため16px以上にする。
    fontSize: 16,
  },
  resultList: {
    maxHeight: 260,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.m,
  },
  resultItem: { paddingHorizontal: space.l, paddingVertical: space.m },
  resultDivider: { borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: colors.border },
  resultName: { color: colors.textPrimary, fontSize: type.body, marginBottom: 2 },
  resultText: { color: colors.textSecondary, fontSize: type.small },
  // 横スクロールの端で絞り込みボタンが画面の端まで流れるよう、左右の余白は中身側で持つ
  chipScroll: { marginHorizontal: -space.l },
  chipRow: { gap: space.s, paddingHorizontal: space.l },
  chip: {
    height: 32,
    paddingHorizontal: 14,
    justifyContent: 'center',
    borderRadius: radius.pill,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  chipActive: { backgroundColor: colors.accent, borderColor: colors.accent },
  chipText: { color: colors.textPrimary, fontSize: type.small },
  chipTextActive: { color: colors.accentText },
});
