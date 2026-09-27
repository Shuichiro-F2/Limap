// 上から下へ、だんだん透明になっていく帯。地図の上に敷いて、ロゴや文字を読みやすくする。
// Web は CSS のグラデーション1枚で描き、ネイティブは薄い帯を何本も重ねて同じ見た目を作る
// （RN の experimental_backgroundImage がネイティブでは効かなかったため。追加のネイティブモジュールは不要）。
import React from 'react';
import { Platform, StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';

type Props = {
  height: number;
  // 帯の色（r, g, b）
  rgb: [number, number, number];
  // 一番濃いところの不透明度
  maxOpacity: number;
  // 上からどこまでを最大の濃さのままにするか（0〜1）
  solidUntil: number;
  style?: StyleProp<ViewStyle>;
};

const STEPS = 24;

export default function VerticalFade({ height, rgb, maxOpacity, solidUntil, style }: Props) {
  const [r, g, b] = rgb;
  if (Platform.OS === 'web') {
    const css = `linear-gradient(rgba(${r},${g},${b},${maxOpacity}) ${solidUntil * 100}%, rgba(${r},${g},${b},0))`;
    return <View style={[styles.base, { height, backgroundImage: css } as object, style, { pointerEvents: 'none' }]} />;
  }
  const solidHeight = height * solidUntil;
  const stepHeight = (height - solidHeight) / STEPS;
  return (
    <View style={[styles.base, { height }, style, { pointerEvents: 'none' }]}>
      <View style={{ height: solidHeight, backgroundColor: `rgba(${r},${g},${b},${maxOpacity})` }} />
      {Array.from({ length: STEPS }, (_, i) => (
        <View
          key={i}
          style={{
            height: stepHeight,
            backgroundColor: `rgba(${r},${g},${b},${(maxOpacity * (1 - (i + 0.5) / STEPS)).toFixed(3)})`,
          }}
        />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  base: { position: 'absolute', top: 0, left: 0, right: 0 },
});
