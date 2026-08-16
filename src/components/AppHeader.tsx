import React from 'react';
import { View, Image, Pressable, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Text from './AppText';
import { useLanguage } from '../lib/i18n';
import { colors } from '../lib/theme';

// ロゴ本体の高さ＋余白。各タブ画面側は、この分だけ先頭にスペースを空けて
// コンテンツを配置することで、常に最前面に重なるこのヘッダーと被らないようにする。
export const HEADER_CONTENT_HEIGHT = 56;

// ロゴと言語切り替えトグルは4つのタブ全てに共通する固定要素。
// MainTabNavigator側で、タブのページャー（スワイプで横に流れる部分）とは別の
// 最前面レイヤーとして重ねて描画することで、タブを切り替えても一緒にスライドせず
// 常に画面の同じ位置に留まる「ヘッダー」のように振る舞う。背景は透過。
export default function AppHeader() {
  const { language, setLanguage } = useLanguage();

  return (
    <SafeAreaView edges={['top']} style={styles.wrapper} pointerEvents="box-none">
      <View style={styles.row} pointerEvents="box-none">
        <Image source={require('../../assets/logo-header.png')} style={styles.logo} resizeMode="contain" />

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
    flexDirection: 'row',
    alignItems: 'center',
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
