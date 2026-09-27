// 地図上のスポットをタップしたときに、画面下に出す小さなカード。
// タップでスポット詳細画面を開く。ネイティブ版・Web版の地図画面で共通。
import React from 'react';
import { Image, Pressable, StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Text from './AppText';
import { spotThumbnailUrl } from '../lib/spots';
import { useTranslation } from '../lib/i18n';
import { colors, radius, space, type } from '../lib/theme';
import { spotRawTitle } from '../content/spotSeo';
import { spotKicker } from '../lib/spotLabels';
import type { Spot } from '../types/database';

type Props = {
  spot: Spot;
  onPress: () => void;
  onClose: () => void;
};

export default function MapSpotCard({ spot, onPress, onClose }: Props) {
  const t = useTranslation();
  const kicker = spotKicker(spot);
  const thumb = spotThumbnailUrl(spot);
  const author = spot.author?.display_name || spot.author?.username;
  const meta = [author, t.map.likes.replace('{n}', String(spot.like_count ?? 0))].filter(Boolean).join('・');

  return (
    <Pressable style={({ pressed }) => [styles.card, pressed && styles.cardPressed]} onPress={onPress}>
      {thumb ? <Image source={{ uri: thumb }} style={styles.thumb} /> : <View style={[styles.thumb, styles.noThumb]} />}
      <View style={styles.body}>
        {!!kicker && (
          <Text style={styles.kicker} numberOfLines={1}>
            {kicker}
          </Text>
        )}
        <Text style={styles.title} numberOfLines={2}>
          {spotRawTitle(spot)}
        </Text>
        <Text variant="body" style={styles.meta} numberOfLines={1}>
          {meta}
        </Text>
      </View>
      <Pressable
        style={styles.close}
        onPress={onClose}
        hitSlop={10}
        accessibilityRole="button"
        accessibilityLabel={t.map.closeCard}
      >
        <Ionicons name="close" size={16} color={colors.textMuted} />
      </Pressable>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    gap: space.m,
    padding: space.m,
    borderRadius: radius.m,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    // 影は iOS・Android・Web 共通の boxShadow で指定する（shadow*/elevation は非推奨）
    boxShadow: '0px 6px 16px rgba(0, 0, 0, 0.4)',
  },
  cardPressed: { backgroundColor: colors.surfaceAlt },
  thumb: { width: 88, height: 88, borderRadius: radius.s },
  noThumb: { backgroundColor: colors.surfaceAlt },
  body: { flex: 1, minWidth: 0, gap: 6, paddingRight: space.l },
  kicker: { color: colors.accent, fontSize: type.caption, letterSpacing: 0.6 },
  title: { color: colors.textPrimary, fontSize: type.body, lineHeight: 22 },
  meta: { color: colors.textSecondary, fontSize: 12 },
  close: { position: 'absolute', top: space.s, right: space.s, padding: 2 },
});
