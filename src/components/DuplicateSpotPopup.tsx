import React from 'react';
import { View, StyleSheet, Pressable, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Text from './AppText';
import { colors } from '../lib/theme';
import { spotThumbnailUrl, type NearbySpotMatch } from '../lib/spots';
import { useTranslation } from '../lib/i18n';

// 新規投稿画面で、座標が近い/名前が似た既存のスポットが見つかった場合に表示する
// 案内ポップアップ。重複投稿を防ぐため、そちらへ「レビュー」として投稿を追加するよう促す。
type Props = {
  visible: boolean;
  matches: NearbySpotMatch[];
  onSelectMatch: (match: NearbySpotMatch) => void;
  onDismiss: () => void;
};

export default function DuplicateSpotPopup({ visible, matches, onSelectMatch, onDismiss }: Props) {
  const t = useTranslation();
  if (!visible || matches.length === 0) return null;

  return (
    <View style={styles.overlay} pointerEvents="box-none">
      <View style={styles.card}>
        <Pressable style={styles.closeButton} onPress={onDismiss} hitSlop={10}>
          <Ionicons name="close" size={16} color={colors.textMuted} />
        </Pressable>

        <View style={styles.headerRow}>
          <View style={styles.iconWrap}>
            <Ionicons name="alert-circle-outline" size={20} color={colors.accentText} />
          </View>
          <Text style={styles.title}>{t.duplicateSpot.title}</Text>
        </View>
        <Text style={styles.lead}>{t.duplicateSpot.lead}</Text>

        <View style={styles.matchList}>
          {matches.map((match) => {
            const thumb = spotThumbnailUrl(match);
            return (
              <Pressable key={match.id} style={styles.matchRow} onPress={() => onSelectMatch(match)}>
                {thumb ? (
                  <Image source={{ uri: thumb }} style={styles.matchThumb} />
                ) : (
                  <View style={[styles.matchThumb, styles.matchThumbEmpty]} />
                )}
                <View style={styles.matchTextWrap}>
                  <Text style={styles.matchTitle} numberOfLines={1}>
                    {match.title}
                  </Text>
                  <Text style={styles.matchDistance}>
                    {match.distanceMeters < 1000
                      ? `${Math.round(match.distanceMeters)}m`
                      : `${(match.distanceMeters / 1000).toFixed(1)}km`}
                  </Text>
                </View>
                <Ionicons name="chevron-forward" size={18} color={colors.textMuted} />
              </Pressable>
            );
          })}
        </View>

        <Pressable onPress={onDismiss} hitSlop={8} style={styles.continueButton}>
          <Text style={styles.continueText}>{t.duplicateSpot.continueAsNew}</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    top: 0,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(0,0,0,0.45)',
    zIndex: 30,
    padding: 20,
  },
  card: {
    width: '100%',
    maxWidth: 420,
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: 18,
    paddingTop: 20,
  },
  closeButton: { position: 'absolute', right: 12, top: 12, padding: 6, zIndex: 1 },
  headerRow: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingRight: 20 },
  iconWrap: {
    width: 32,
    height: 32,
    borderRadius: 9,
    backgroundColor: colors.accent,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: { color: colors.textPrimary, fontSize: 15, fontWeight: '700', flexShrink: 1 },
  lead: { color: colors.textSecondary, fontSize: 12.5, lineHeight: 18, marginTop: 10 },
  matchList: { marginTop: 14, gap: 8 },
  matchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: colors.background,
    borderRadius: 12,
    padding: 10,
  },
  matchThumb: { width: 44, height: 44, borderRadius: 8 },
  matchThumbEmpty: { backgroundColor: colors.border },
  matchTextWrap: { flex: 1 },
  matchTitle: { color: colors.textPrimary, fontSize: 13.5, fontWeight: '600' },
  matchDistance: { color: colors.textMuted, fontSize: 11.5, marginTop: 2 },
  continueButton: { marginTop: 16, alignItems: 'center' },
  continueText: { color: colors.textMuted, fontSize: 13, fontWeight: '600' },
});
