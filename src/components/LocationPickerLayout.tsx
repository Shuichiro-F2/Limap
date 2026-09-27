// 「場所を選択」画面の地図以外の部分（検索欄・候補一覧・中央のピン・現在地ボタン・決定ボタン）。
// 地図本体はネイティブ(@rnmapbox/maps)とWeb(react-map-gl)で異なるため children で受け取り、
// まわりの見た目は両方でこの1つを使う。
import React from 'react';
import { ActivityIndicator, FlatList, Pressable, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import Text from './AppText';
import TextInput from './AppTextInput';
import { Button, FORM_MAX_WIDTH } from './Form';
import { useTranslation } from '../lib/i18n';
import { colors, radius, space, type } from '../lib/theme';
import type { SuggestResult } from '../lib/mapboxSearch';

type Props = {
  query: string;
  onChangeQuery: (text: string) => void;
  onSearch: () => void;
  searching: boolean;
  results: SuggestResult[];
  onSelectResult: (item: SuggestResult) => void;
  onLocate: () => void;
  center: { lat: number; lng: number };
  onConfirm: () => void;
  children: React.ReactNode;
};

export default function LocationPickerLayout({
  query,
  onChangeQuery,
  onSearch,
  searching,
  results,
  onSelectResult,
  onLocate,
  center,
  onConfirm,
  children,
}: Props) {
  const t = useTranslation().locationPicker;
  const insets = useSafeAreaInsets();

  return (
    <View style={styles.container}>
      <View style={styles.mapWrap}>
        {children}

        {/* 地図中央に固定表示するピン。地図側ではなくオーバーレイとして描画することで
            「地図を動かして中央に場所を合わせる」操作を実現している */}
        <View style={[styles.centerPin, { pointerEvents: 'none' }]}>
          <View style={styles.pinDot} />
          <View style={styles.pinStick} />
        </View>

        {/* 検索欄は地図の上に重ねる（地図画面の検索欄と同じ丸い形） */}
        <View style={[styles.top, { pointerEvents: 'box-none' }]}>
          <View style={styles.searchPill}>
            <Pressable onPress={onSearch} hitSlop={8} accessibilityRole="button" accessibilityLabel={t.searchPlaceholder}>
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
              placeholder={t.searchPlaceholder}
              onSubmitEditing={onSearch}
              returnKeyType="search"
            />
            {query.length > 0 && (
              <Pressable onPress={() => onChangeQuery('')} hitSlop={8} accessibilityRole="button">
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

        {/* 右下の Mapbox の「i」マーク（出典表示）と重ならないよう、少し上に置く */}
        <Pressable
          style={styles.locateButton}
          onPress={onLocate}
          hitSlop={8}
          accessibilityRole="button"
          accessibilityLabel={t.currentLocation}
        >
          <Ionicons name="locate-outline" size={20} color={colors.textPrimary} />
        </Pressable>
      </View>

      <View style={[styles.footer, { paddingBottom: Math.max(insets.bottom, space.m) }]}>
        <View style={styles.footerInner}>
          <Text variant="body" style={styles.coordText}>
            {center.lat.toFixed(5)}, {center.lng.toFixed(5)}
          </Text>
          <Button label={t.confirm} icon="checkmark" onPress={onConfirm} />
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  mapWrap: { flex: 1 },
  top: { position: 'absolute', top: space.m, left: space.l, right: space.l, gap: space.s },
  searchPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    height: 48,
    paddingHorizontal: space.l,
    borderRadius: radius.pill,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    width: '100%',
    maxWidth: FORM_MAX_WIDTH,
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
    maxHeight: 240,
    width: '100%',
    maxWidth: FORM_MAX_WIDTH,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.m,
  },
  resultItem: { paddingHorizontal: space.l, paddingVertical: space.m },
  resultDivider: { borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: colors.border },
  resultName: { color: colors.textPrimary, fontSize: type.body, marginBottom: 2 },
  resultText: { color: colors.textSecondary, fontSize: type.small },
  centerPin: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    marginLeft: -12,
    marginTop: -38,
    alignItems: 'center',
  },
  pinDot: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: colors.accent,
    borderWidth: 4,
    borderColor: colors.background,
  },
  pinStick: { width: 2, height: 16, backgroundColor: colors.accent },
  locateButton: {
    position: 'absolute',
    right: space.l,
    bottom: 44,
    width: 44,
    height: 44,
    borderRadius: radius.pill,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  footer: {
    paddingHorizontal: 20,
    paddingTop: space.m,
    backgroundColor: colors.background,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.border,
  },
  footerInner: { width: '100%', maxWidth: FORM_MAX_WIDTH, alignSelf: 'center', gap: 10 },
  coordText: { color: colors.textMuted, fontSize: 12, textAlign: 'center' },
});
