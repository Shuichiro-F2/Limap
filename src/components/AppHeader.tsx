import React from 'react';
import { View, Image, Pressable, StyleSheet, type ImageSourcePropType } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Text from './AppText';
import { useLanguage } from '../lib/i18n';
import { colors } from '../lib/theme';

// ロゴ本体の高さ＋余白。各タブ画面側は、この分だけ先頭にスペースを空けて
// コンテンツを配置することで、常に最前面に重なるこのヘッダーと被らないようにする。
// ロゴが上に寄りすぎないよう、ロゴ自体の高さより少し大きめの値にして上部に隙間を作る。
export const HEADER_CONTENT_HEIGHT = 64;

type Props = {
  // ロゴ画像。指定がなければ4タブ共通の黄色ロゴを使う
  logoSource?: ImageSourcePropType;
  // ヘッダー行の背景色。指定がなければ透過のまま(タブ画面での既定の見た目)。
  // 投稿詳細画面など、ページ自体の背景色に合わせて塗りたい場合に指定する。
  backgroundColor?: string;
  // ロゴをタップ可能にしたい場合のハンドラ(例: 投稿詳細画面からトップに戻る)
  onLogoPress?: () => void;
  showLanguageToggle?: boolean;
};

// ロゴと言語切り替えトグルは4つのタブ全てに共通する固定要素。
// MainTabNavigator側で、タブのページャー（スワイプで横に流れる部分）とは別の
// 最前面レイヤーとして重ねて描画することで、タブを切り替えても一緒にスライドせず
// 常に画面の同じ位置に留まる「ヘッダー」のように振る舞う。背景は既定で透過。
// 投稿詳細画面(SpotDetailScreen)など、タブ以外の画面でも全く同じレイアウトの
// ヘッダーが必要な場合は、このコンポーネントをbackgroundColor/logoSource/onLogoPress
// 付きでそのまま再利用し、ロゴの位置・サイズが画面ごとにズレないようにする。
export default function AppHeader({ logoSource, backgroundColor, onLogoPress, showLanguageToggle = true }: Props) {
  const { language, setLanguage } = useLanguage();

  const logo = (
    <Image
      source={logoSource ?? require('../../assets/logo-header.png')}
      style={styles.logo}
      resizeMode="contain"
    />
  );

  return (
    <SafeAreaView
      edges={['top']}
      style={[styles.wrapper, backgroundColor ? { backgroundColor } : null]}
      pointerEvents="box-none"
    >
      <View style={styles.row} pointerEvents="box-none">
        {onLogoPress ? (
          <Pressable onPress={onLogoPress} hitSlop={10}>
            {logo}
          </Pressable>
        ) : (
          logo
        )}

        {showLanguageToggle && (
          <View style={styles.langSwitch}>
            <Pressable
              style={[styles.langButton, language === 'ja' && styles.langButtonActive]}
              onPress={() => setLanguage('ja')}
              hitSlop={6}
            >
              <Text style={[styles.langButtonText, language === 'ja' && styles.langButtonTextActive]}>日本語</Text>
            </Pressable>
            <Pressable
              style={[styles.langButton, language === 'en' && styles.langButtonActive]}
              onPress={() => setLanguage('en')}
              hitSlop={6}
            >
              <Text style={[styles.langButtonText, language === 'en' && styles.langButtonTextActive]}>English</Text>
            </Pressable>
          </View>
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 10,
  },
  row: {
    height: HEADER_CONTENT_HEIGHT,
    paddingHorizontal: 20,
    paddingBottom: 4,
    flexDirection: 'row',
    // ロゴ・トグルを行の下寄せにすることで、上部にだけ隙間ができるようにする
    alignItems: 'flex-end',
    justifyContent: 'space-between',
  },
  logo: { width: 84, height: 52 },
  langSwitch: {
    flexDirection: 'row',
    borderWidth: 1,
    borderColor: colors.textPrimary,
    borderRadius: 999,
    overflow: 'hidden',
  },
  langButton: { paddingHorizontal: 10, paddingVertical: 5 },
  langButtonActive: { backgroundColor: colors.accent },
  langButtonText: { fontSize: 11, fontWeight: '700', color: colors.textSecondary },
  langButtonTextActive: { color: colors.accentText },
});
