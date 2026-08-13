import React from 'react';
import { Text as RNText, type TextProps } from 'react-native';

// アプリ全体の日本語フォント（DotGothic16）を効かせるためのText置き換え。
// React 19ではText.defaultPropsが効かなくなったため、各画面のimportをこちらに差し替えて使う。
export default function AppText({ style, ...props }: TextProps) {
  return <RNText style={[{ fontFamily: 'DotGothic16_400Regular' }, style]} {...props} />;
}
