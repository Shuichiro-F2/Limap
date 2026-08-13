import React from 'react';
import { TextInput as RNTextInput, type TextInputProps } from 'react-native';

// アプリ全体の日本語フォント（DotGothic16）を入力欄にも効かせるためのTextInput置き換え。
export default function AppTextInput({ style, ...props }: TextInputProps) {
  return <RNTextInput style={[{ fontFamily: 'DotGothic16_400Regular' }, style]} {...props} />;
}
