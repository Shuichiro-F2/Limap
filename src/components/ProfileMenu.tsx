import React from 'react';
import { View, Pressable, StyleSheet, Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import Text from './AppText';
import { HEADER_CONTENT_HEIGHT } from './AppHeader';
import { useLanguage, useTranslation } from '../lib/i18n';
import { colors } from '../lib/theme';
import { isStandaloneDisplay } from '../lib/pwaInstall';
import type { RootStackParamList } from '../navigation/types';

type Props = {
  visible: boolean;
  onClose: () => void;
  navigation: NativeStackNavigationProp<RootStackParamList>;
  isAdmin: boolean;
};

// マイページタブのヘッダー右上（ハンバーガーボタン）から開く、
// 言語切り替え＋各種案内ページへの導線をまとめたメニュー。
// 以前はAppHeaderに常時表示していた言語トグルと、MyPageScreen下部に
// 並んでいたフッターリンク群(使い方・About・ブロック中のユーザー・お問い合わせ等)を
// ここに集約している。マイページタブ以外では、そもそもハンバーガーボタン自体を
// 表示しないため(MainTabNavigator側で制御)、このメニューが開くことはない。
export default function ProfileMenu({ visible, onClose, navigation, isAdmin }: Props) {
  const insets = useSafeAreaInsets();
  const { language, setLanguage } = useLanguage();
  const t = useTranslation();

  if (!visible) return null;

  const go = (screen: 'Help' | 'About' | 'BlockedUsers' | 'Contact' | 'AdminInbox' | 'AddToHomeScreen') => {
    onClose();
    navigation.navigate(screen);
  };

  const showAddToHomeScreen = Platform.OS === 'web' && !isStandaloneDisplay();

  return (
    <View style={styles.overlay} pointerEvents="box-none">
      <Pressable style={StyleSheet.absoluteFill} onPress={onClose} />
      <View style={[styles.panel, { top: insets.top + HEADER_CONTENT_HEIGHT }]}>
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

        <View style={styles.divider} />

        <MenuItem icon="help-circle-outline" label={t.myPage.help} onPress={() => go('Help')} />
        <MenuItem icon="information-circle-outline" label={t.myPage.about} onPress={() => go('About')} />
        <MenuItem icon="ban-outline" label={t.myPage.blockedUsers} onPress={() => go('BlockedUsers')} />
        <MenuItem icon="mail-outline" label={t.myPage.contact} onPress={() => go('Contact')} />
        {/* 運営(is_admin)本人のアカウントでログインしている場合のみ表示する
            (見た目上も隠しておき、実際のアクセス制御はRLS側で行う)。 */}
        {isAdmin && (
          <MenuItem icon="chatbubbles-outline" label={t.myPage.adminInbox} onPress={() => go('AdminInbox')} />
        )}
        {/* ホーム画面への追加はWeb版限定。すでにホーム画面から起動している場合は表示不要 */}
        {showAddToHomeScreen && (
          <MenuItem icon="add-circle-outline" label={t.myPage.addToHomeScreen} onPress={() => go('AddToHomeScreen')} />
        )}
      </View>
    </View>
  );
}

function MenuItem({
  icon,
  label,
  onPress,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  onPress: () => void;
}) {
  return (
    <Pressable style={styles.item} onPress={onPress} hitSlop={4}>
      <Ionicons name={icon} size={18} color={colors.textSecondary} style={styles.itemIcon} />
      <Text style={styles.itemText}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 50,
  },
  panel: {
    position: 'absolute',
    right: 16,
    minWidth: 220,
    backgroundColor: colors.surface,
    borderRadius: 14,
    paddingVertical: 10,
    paddingHorizontal: 6,
    shadowColor: '#000',
    shadowOpacity: 0.3,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 8,
  },
  langSwitch: {
    flexDirection: 'row',
    alignSelf: 'flex-start',
    marginHorizontal: 10,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: colors.textPrimary,
    borderRadius: 999,
    overflow: 'hidden',
  },
  langButton: { paddingHorizontal: 10, paddingVertical: 5 },
  langButtonActive: { backgroundColor: colors.accent },
  langButtonText: { fontSize: 11, fontWeight: '700', color: colors.textSecondary },
  langButtonTextActive: { color: colors.accentText },
  divider: { height: StyleSheet.hairlineWidth, backgroundColor: colors.border, marginVertical: 4, marginHorizontal: 4 },
  item: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 10, paddingHorizontal: 10, borderRadius: 8 },
  itemIcon: { width: 22 },
  itemText: { color: colors.textPrimary, fontSize: 13.5 },
});
