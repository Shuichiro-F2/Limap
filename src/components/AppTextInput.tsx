import React from 'react';
import { TextInput as RNTextInput, type TextInputProps } from 'react-native';
import { colors, fonts } from '../lib/theme';

type AppTextInputProps = TextInputProps & {
  // display: 1行の入力欄（DotGothic16、既定） / body: 説明文など長い文章の入力欄
  variant?: 'display' | 'body';
};

// アプリ全体の書体を入力欄にも効かせるためのTextInput置き換え。
export default function AppTextInput({ style, variant = 'display', placeholderTextColor, ...props }: AppTextInputProps) {
  return (
    <RNTextInput
      style={[{ fontFamily: variant === 'body' ? fonts.body : fonts.display }, style]}
      placeholderTextColor={placeholderTextColor ?? colors.placeholder}
      {...props}
    />
  );
}
