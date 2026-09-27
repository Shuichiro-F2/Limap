import React from 'react';
import { View, Image, Pressable, ScrollView, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Text from './AppText';
import { useTranslation } from '../lib/i18n';
import { colors, radius } from '../lib/theme';

// 投稿作成・レビュー投稿・投稿編集の3画面で共通して使う、選択済み写真の一覧。
// 並び順そのものが「表紙(1枚目)」を決めるため、削除(✕)と左右の入れ替え(◀ ▶)を
// サムネイルの上に直接置き、何枚目かも番号で示している。
//
// ドラッグ&ドロップ方式にはreact-native-reanimated / gesture-handler などの
// ネイティブ依存の追加が必要で、入れるとOTA配信ができなくなる(App Storeの再審査が
// 必要になる)ため、左右ボタンでの入れ替えにしている。
// マウス操作のWeb版でも同じ操作でそのまま扱えるという利点もある。

export type PhotoItem = { uri: string };

// 配列内の要素を1つ隣と入れ替えた新しい配列を返す。端なら元の配列をそのまま返す。
export function movePhoto<T>(items: T[], index: number, direction: -1 | 1): T[] {
  const to = index + direction;
  if (index < 0 || index >= items.length) return items;
  if (to < 0 || to >= items.length) return items;
  const next = items.slice();
  next[index] = items[to];
  next[to] = items[index];
  return next;
}

type Props = {
  items: PhotoItem[];
  onRemove: (index: number) => void;
  onMove: (index: number, direction: -1 | 1) => void;
};

export default function PhotoEditList({ items, onRemove, onMove }: Props) {
  const t = useTranslation();

  if (items.length === 0) return null;

  return (
    <View>
      <ScrollView horizontal style={styles.row} showsHorizontalScrollIndicator={false}>
        {items.map((item, i) => {
          const isFirst = i === 0;
          const isLast = i === items.length - 1;
          return (
            // 並べ替えでkeyが動くとImageが作り直されてちらつくため、keyは位置(index)で固定し、
            // 中身(uri)だけを差し替える。
            <View key={i} style={styles.itemWrap}>
              <Image source={{ uri: item.uri }} style={styles.thumb} />

              {/* 何枚目かの表示。1枚目が表紙になるため、順番が一目で分かるようにする */}
              <View style={styles.indexBadge}>
                <Text style={styles.indexBadgeText}>{i + 1}</Text>
              </View>

              <Pressable
                style={styles.removeButton}
                onPress={() => onRemove(i)}
                hitSlop={8}
                accessibilityLabel={t.photoEdit.remove}
              >
                <Ionicons name="close" size={14} color={colors.textPrimary} />
              </Pressable>

              <View style={styles.moveRow}>
                <Pressable
                  style={styles.moveButton}
                  onPress={() => onMove(i, -1)}
                  disabled={isFirst}
                  accessibilityLabel={t.photoEdit.moveLeft}
                >
                  <Ionicons
                    name="chevron-back"
                    size={15}
                    color={isFirst ? colors.textMuted : colors.textPrimary}
                  />
                </Pressable>
                <View style={styles.moveDivider} />
                <Pressable
                  style={styles.moveButton}
                  onPress={() => onMove(i, 1)}
                  disabled={isLast}
                  accessibilityLabel={t.photoEdit.moveRight}
                >
                  <Ionicons
                    name="chevron-forward"
                    size={15}
                    color={isLast ? colors.textMuted : colors.textPrimary}
                  />
                </Pressable>
              </View>
            </View>
          );
        })}
      </ScrollView>
      <Text variant="body" style={styles.coverNote}>{t.photoEdit.coverNote}</Text>
    </View>
  );
}

const THUMB_SIZE = 104;

const styles = StyleSheet.create({
  row: { marginTop: 2 },
  itemWrap: { width: THUMB_SIZE, marginRight: 10 },
  thumb: {
    width: THUMB_SIZE,
    height: THUMB_SIZE,
    borderRadius: radius.s,
    backgroundColor: colors.surfaceAlt,
  },
  indexBadge: {
    position: 'absolute',
    left: 4,
    top: 4,
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    paddingHorizontal: 5,
    backgroundColor: 'rgba(0,0,0,0.6)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  indexBadgeText: { color: colors.textPrimary, fontSize: 11, lineHeight: 14 },
  removeButton: {
    position: 'absolute',
    right: 4,
    top: 4,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: 'rgba(0,0,0,0.65)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  moveRow: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    flexDirection: 'row',
    backgroundColor: 'rgba(0,0,0,0.55)',
    borderBottomLeftRadius: radius.s,
    borderBottomRightRadius: radius.s,
  },
  moveButton: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingVertical: 7 },
  moveDivider: { width: StyleSheet.hairlineWidth, backgroundColor: 'rgba(255,255,255,0.25)' },
  coverNote: { color: colors.textMuted, fontSize: 12, lineHeight: 18, marginTop: 8 },
});
