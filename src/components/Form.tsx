// 入力画面（ログイン・投稿作成/編集・レビュー投稿・プロフィール編集・お問い合わせなど）で
// 共通して使う部品。項目名・入力欄・ボタンの見た目をここに集め、画面ごとにずれないようにする。
import React, { useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  View,
  type StyleProp,
  type TextInputProps,
  type ViewStyle,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import Text from './AppText';
import TextInput from './AppTextInput';
import { useTranslation } from '../lib/i18n';
import { colors, radius, space, type } from '../lib/theme';

// PC など横幅の広い画面で、入力欄が間延びしないようにする最大幅
export const FORM_MAX_WIDTH = 560;

// ひとまとまりの項目（例:「場所」「写真・SNS」）。見出しと、必要なら補足（note）を付ける
export function FormSection({
  title,
  note,
  first,
  children,
}: {
  title: string;
  note?: string;
  // 先頭のまとまりは上の余白を付けない
  first?: boolean;
  children: React.ReactNode;
}) {
  return (
    <View style={[styles.section, first && styles.sectionFirst]}>
      <View style={styles.sectionHead}>
        <Text style={styles.sectionTitle}>{title}</Text>
        {!!note && (
          <Text variant="body" style={styles.sectionNote}>
            {note}
          </Text>
        )}
      </View>
      {children}
    </View>
  );
}

// 1つの入力項目。項目名・必須の印・「?」（押すと説明が開く）と、その下に入力欄などを置く。
// 説明は既定で畳んでおき、画面を細かい文字だらけにしない。
export function FormField({
  label,
  help,
  required,
  children,
}: {
  label: string;
  help?: string;
  required?: boolean;
  children?: React.ReactNode;
}) {
  const t = useTranslation();
  const [showHelp, setShowHelp] = useState(false);
  return (
    <View style={styles.field}>
      <View style={styles.labelRow}>
        <Text style={styles.label}>{label}</Text>
        {required && (
          <View style={styles.requiredBadge}>
            <Text style={styles.requiredText}>{t.form.required}</Text>
          </View>
        )}
        {!!help && (
          <Pressable
            onPress={() => setShowHelp((v) => !v)}
            hitSlop={10}
            accessibilityRole="button"
            accessibilityLabel={t.form.showHelp}
            aria-expanded={showHelp}
          >
            <Ionicons
              name={showHelp ? 'help-circle' : 'help-circle-outline'}
              size={18}
              color={showHelp ? colors.textSecondary : colors.textMuted}
            />
          </Pressable>
        )}
      </View>
      {!!help && showHelp && (
        <Text variant="body" style={styles.helpText}>
          {help}
        </Text>
      )}
      {children}
    </View>
  );
}

// 入力欄。URL や長い文章も読みやすいよう、ドットフォントではなくゴシック体にする
export function FormInput({ style, multiline, ...props }: TextInputProps) {
  return (
    <TextInput
      variant="body"
      multiline={multiline}
      style={[styles.input, multiline && styles.textArea, style]}
      {...props}
    />
  );
}

type ButtonProps = {
  label: string;
  onPress?: () => void;
  // primary: 黄色の主要ボタン / secondary: 枠線のボタン / subtle: 文字だけの控えめなボタン
  variant?: 'primary' | 'secondary' | 'subtle';
  icon?: keyof typeof Ionicons.glyphMap;
  loading?: boolean;
  disabled?: boolean;
  // 入力欄の横に並べる「追加」ボタンなど、小さめにしたいとき
  compact?: boolean;
  style?: StyleProp<ViewStyle>;
};

export function Button({ label, onPress, variant = 'primary', icon, loading, disabled, compact, style }: ButtonProps) {
  const textColor =
    variant === 'primary' ? colors.accentText : variant === 'secondary' ? colors.textPrimary : colors.textSecondary;
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled || loading}
      accessibilityRole="button"
      style={({ pressed }) => [
        styles.button,
        compact && styles.buttonCompact,
        variant === 'primary' && styles.buttonPrimary,
        variant === 'secondary' && styles.buttonSecondary,
        variant === 'subtle' && styles.buttonSubtle,
        (disabled || loading) && styles.buttonDisabled,
        pressed && styles.buttonPressed,
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator color={textColor} size="small" />
      ) : (
        <>
          {icon && <Ionicons name={icon} size={compact ? 16 : 18} color={textColor} />}
          <Text style={[styles.buttonText, compact && styles.buttonTextCompact, { color: textColor }]}>{label}</Text>
        </>
      )}
    </Pressable>
  );
}

// 「朝・昼・夕方・夜」のような、いくつかの中から1つ選ぶボタンの列（横幅いっぱいに均等に並べる）。
// 選択中のものをもう一度押すと選択を外す（allowDeselect）。
export function ChoiceRow<T extends string>({
  options,
  value,
  onChange,
  allowDeselect,
}: {
  options: { value: T; label: string }[];
  value: T | null;
  onChange: (value: T | null) => void;
  allowDeselect?: boolean;
}) {
  return (
    <View style={styles.choiceRow}>
      {options.map((opt) => {
        const selected = value === opt.value;
        return (
          <Pressable
            key={opt.value}
            style={[styles.choice, selected && styles.choiceSelected]}
            onPress={() => onChange(selected && allowDeselect ? null : opt.value)}
            accessibilityRole="button"
            aria-selected={selected}
          >
            <Text style={[styles.choiceText, selected && styles.choiceTextSelected]} numberOfLines={1}>
              {opt.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

// タグなどの小さな丸いボタン（選択済みは黄色）
export function Chip({
  label,
  selected,
  onPress,
  removable,
}: {
  label: string;
  selected?: boolean;
  onPress?: () => void;
  // 押すと外せることを「×」で示す
  removable?: boolean;
}) {
  return (
    <Pressable style={[styles.chip, selected && styles.chipSelected]} onPress={onPress} disabled={!onPress}>
      <Text style={[styles.chipText, selected && styles.chipTextSelected]}>{label}</Text>
      {removable && <Ionicons name="close" size={13} color={selected ? colors.accentText : colors.textSecondary} />}
    </Pressable>
  );
}

// 画面下に固定する、送信ボタンなどの帯。長い入力画面でも、スクロールせずに押せるようにする
export function FormFooter({ children }: { children: React.ReactNode }) {
  const insets = useSafeAreaInsets();
  return (
    <View style={[formStyles.footer, { paddingBottom: Math.max(insets.bottom, space.m) }]}>
      <View style={formStyles.footerInner}>{children}</View>
    </View>
  );
}

export const formStyles = StyleSheet.create({
  // 画面全体のスクロール領域の中身（左右の余白と最大幅）
  content: {
    paddingHorizontal: 20,
    paddingTop: space.xl,
    paddingBottom: 40,
    width: '100%',
    maxWidth: FORM_MAX_WIDTH,
    alignSelf: 'center',
  },
  // 入力欄と「追加」ボタンを横に並べる行
  inputRow: { flexDirection: 'row', gap: space.s, alignItems: 'center' },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: space.s },
  // 項目の下に添える小さな補足（文字数・上限の案内など）
  caption: { color: colors.textMuted, fontSize: 12, lineHeight: 18 },
  // 画面下に固定するボタンの帯
  footer: {
    paddingHorizontal: 20,
    paddingTop: space.m,
    backgroundColor: colors.background,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.border,
  },
  footerInner: { width: '100%', maxWidth: FORM_MAX_WIDTH, alignSelf: 'center' },
});

const styles = StyleSheet.create({
  section: { marginTop: 36, gap: 20 },
  sectionFirst: { marginTop: 0 },
  sectionHead: { gap: 6 },
  sectionTitle: { color: colors.textPrimary, fontSize: type.heading },
  sectionNote: { color: colors.textSecondary, fontSize: type.small, lineHeight: 20 },
  field: { gap: 10 },
  labelRow: { flexDirection: 'row', alignItems: 'center', gap: space.s },
  label: { color: colors.textPrimary, fontSize: type.body },
  requiredBadge: {
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: radius.pill,
    backgroundColor: colors.accent,
  },
  requiredText: { color: colors.accentText, fontSize: type.caption },
  helpText: { color: colors.textSecondary, fontSize: type.small, lineHeight: 21 },
  input: {
    minHeight: 48,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.m,
    paddingHorizontal: space.l,
    paddingVertical: 12,
    color: colors.textPrimary,
    // 16px未満だとiOS Safariがフォーカス時に画面を自動で拡大してしまうため16にする
    fontSize: 16,
  },
  textArea: { minHeight: 120, textAlignVertical: 'top', lineHeight: 24 },
  button: {
    minHeight: 50,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: space.s,
    paddingHorizontal: 20,
    borderRadius: radius.pill,
  },
  buttonCompact: { minHeight: 48, paddingHorizontal: space.l },
  buttonPrimary: { backgroundColor: colors.accent },
  buttonSecondary: { borderWidth: 1, borderColor: colors.border, backgroundColor: colors.surface },
  buttonSubtle: { minHeight: 40 },
  buttonDisabled: { opacity: 0.45 },
  buttonPressed: { opacity: 0.75 },
  buttonText: { fontSize: type.body },
  buttonTextCompact: { fontSize: 14 },
  choiceRow: { flexDirection: 'row', gap: space.s },
  choice: {
    flex: 1,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  choiceSelected: { backgroundColor: colors.accent, borderColor: colors.accent },
  choiceText: { color: colors.textSecondary, fontSize: 14 },
  choiceTextSelected: { color: colors.accentText },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    height: 34,
    paddingHorizontal: 14,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  chipSelected: { backgroundColor: colors.accent, borderColor: colors.accent },
  chipText: { color: colors.textSecondary, fontSize: type.small },
  chipTextSelected: { color: colors.accentText },
});
