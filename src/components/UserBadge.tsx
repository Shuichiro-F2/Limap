import React from 'react';
import { View, StyleSheet, type StyleProp, type TextStyle, type ViewStyle } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Text from './AppText';
import type { BadgeType } from '../types/database';
import { useLanguage } from '../lib/i18n';

type BadgeProps = {
  badge?: BadgeType | null;
  size?: number; // バッジ(丸アイコン)の直径
  style?: StyleProp<ViewStyle>;
};

// アカウントに付与するバッジ（現状は「公式」のみ、将来的にスポンサー・アンバサダー等を追加予定）。
// badge_typesテーブルのアイコン名・色をそのまま使って描画するだけなので、
// 新しい種別を追加してもこのコンポーネント自体は変更不要。
export default function UserBadge({ badge, size = 15, style }: BadgeProps) {
  if (!badge) return null;
  return (
    <View
      style={[
        styles.circle,
        { width: size, height: size, borderRadius: size / 2, backgroundColor: badge.bg_color, marginLeft: 4 },
        style,
      ]}
    >
      <Ionicons name={badge.icon_name as any} size={Math.round(size * 0.7)} color={badge.text_color} />
    </View>
  );
}

type UsernameProps = {
  username: string | null | undefined;
  badge?: BadgeType | null;
  textStyle?: StyleProp<TextStyle>;
  badgeSize?: number;
  numberOfLines?: number;
};

// 「@username」＋バッジを横並びで表示する共通パーツ。
// フィード・検索結果・投稿詳細・マイページ・ユーザープロフィールなど、
// ユーザー名を表示する箇所はこれに差し替えることでバッジ表示に対応する。
export function UsernameWithBadge({ username, badge, textStyle, badgeSize, numberOfLines }: UsernameProps) {
  return (
    <View style={styles.row}>
      <Text style={textStyle} numberOfLines={numberOfLines}>
        @{username ?? '...'}
      </Text>
      <UserBadge badge={badge} size={badgeSize} />
    </View>
  );
}

const styles = StyleSheet.create({
  circle: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    flexShrink: 1,
  },
});

// バッジのラベル(言語切り替え対応)を取得したい場合に使うフック。
// 例: プロフィール編集画面やツールチップ的な説明表示など。
export function useBadgeLabel(badge?: BadgeType | null): string | null {
  const { language } = useLanguage();
  if (!badge) return null;
  return language === 'en' ? badge.label_en : badge.label_ja;
}
