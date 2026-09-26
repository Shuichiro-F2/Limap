import React from 'react';
import { StyleSheet, Text as RNText, type TextProps } from 'react-native';
import { fonts } from '../lib/theme';

type AppTextProps = TextProps & {
  // display: 見出し・ラベル・ボタン（DotGothic16、既定） / body: 説明文など長い文章（読みやすいゴシック体）
  variant?: 'display' | 'body';
};

// アプリ全体の書体を効かせるためのText置き換え。
// React 19ではText.defaultPropsが効かなくなったため、各画面のimportをこちらに差し替えて使う。
// DotGothic16 は太字の書体を持たず、fontWeight を付けると擬似的に太らせてドットがにじむため、
// display のときは fontWeight を無視する（強弱は文字の大きさと色でつける）。
export default function AppText({ style, variant = 'display', ...props }: AppTextProps) {
  if (variant === 'body') {
    return <RNText style={[{ fontFamily: fonts.body }, style]} {...props} />;
  }
  const { fontWeight: _ignored, ...rest } = StyleSheet.flatten(style) ?? {};
  return <RNText style={[{ fontFamily: fonts.display }, rest]} {...props} />;
}
