// プロフィール画像。未設定のときは、控えめな面に名前の頭文字を黄色で置く
// （以前は黄色一色の丸だったが、一覧で並ぶと目立ちすぎるため）。
import React from 'react';
import { Image, StyleSheet, View } from 'react-native';
import Text from './AppText';
import { colors } from '../lib/theme';

type Props = {
  url?: string | null;
  // 頭文字に使う名前（表示名かユーザー名）
  name?: string | null;
  size?: number;
};

export default function Avatar({ url, name, size = 44 }: Props) {
  const circle = { width: size, height: size, borderRadius: size / 2 };
  if (url) return <Image source={{ uri: url }} style={[circle, styles.image]} />;
  return (
    <View style={[circle, styles.placeholder]}>
      <Text style={[styles.initial, { fontSize: Math.round(size * 0.4) }]}>{(name || '?').replace(/^@/, '').charAt(0).toUpperCase() || '?'}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  image: { backgroundColor: colors.surfaceAlt },
  placeholder: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  initial: { color: colors.accent },
});
