import React, { useState } from 'react';
import { View, Pressable, StyleSheet, Platform, ActivityIndicator } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import Text from './AppText';
import { HEADER_CONTENT_HEIGHT } from './AppHeader';
import { useLanguage, useTranslation } from '../lib/i18n';
import { useAuth } from '../lib/AuthContext';
import { notify } from '../lib/notify';
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
  const { session, deleteAccount } = useAuth();
  // アカウント削除(退会)は取り消せない操作のため、メニュー内で一度
  // 確認パネルに切り替えてから実行する(投稿削除と同じ考え方)。
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deletingAccount, setDeletingAccount] = useState(false);

  if (!visible) return null;

  const go = (screen: 'Help' | 'About' | 'BlockedUsers' | 'Contact' | 'AdminInbox' | 'AddToHomeScreen') => {
    onClose();
    navigation.navigate(screen);
  };

  const closeMenu = () => {
    setShowDeleteConfirm(false);
    onClose();
  };

  const confirmDeleteAccount = async () => {
    setDeletingAccount(true);
    try {
      await deleteAccount();
      // 削除完了後はマイページに留まれないため、メニューを閉じて地図画面へ遷移してから通知する
      setShowDeleteConfirm(false);
      onClose();
      navigation.navigate('Main', { screen: 'MapTab' });
      notify('アカウントを削除しました', 'ご利用ありがとうございました。');
    } catch (e: any) {
      notify('アカウントの削除に失敗しました', e.message);
    } finally {
      setDeletingAccount(false);
    }
  };

  const showAddToHomeScreen = Platform.OS === 'web' && !isStandaloneDisplay();

  return (
    <View style={styles.overlay} pointerEvents="box-none">
      <Pressable style={StyleSheet.absoluteFill} onPress={closeMenu} />
      <View style={[styles.panel, showDeleteConfirm && styles.panelWide, { top: insets.top + HEADER_CONTENT_HEIGHT }]}>
        {showDeleteConfirm ? (
          <View style={styles.deleteConfirmPanel}>
            <Text style={styles.deleteConfirmTitle}>アカウントを削除しますか？</Text>
            <Text style={styles.deleteConfirmDesc}>
              削除すると元に戻せません。投稿・レビュー・いいね・フォロー等、このアカウントに紐づくすべてのデータが削除されます。
            </Text>
            <View style={styles.deleteConfirmRow}>
              <Pressable
                style={styles.deleteCancelButton}
                onPress={() => setShowDeleteConfirm(false)}
                disabled={deletingAccount}
              >
                <Text style={styles.deleteCancelText}>キャンセル</Text>
              </Pressable>
              <Pressable
                style={styles.deleteConfirmButton}
                onPress={confirmDeleteAccount}
                disabled={deletingAccount}
              >
                {deletingAccount ? (
                  <ActivityIndicator color="#fff" size="small" />
                ) : (
                  <Text style={styles.deleteConfirmButtonText}>削除する</Text>
                )}
              </Pressable>
            </View>
          </View>
        ) : (
          <>
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
            {/* アカウント削除。ログイン中のみ表示する(未ログインならそもそもこのメニュー自体が
                開かれないはずだが、念のためsessionの有無でガードしておく)。 */}
            {session?.user && (
              <>
                <View style={styles.divider} />
                <Pressable style={styles.item} onPress={() => setShowDeleteConfirm(true)} hitSlop={4}>
                  <Ionicons name="trash-outline" size={18} color={colors.danger} style={styles.itemIcon} />
                  <Text style={[styles.itemText, styles.itemTextDanger]}>アカウントを削除</Text>
                </Pressable>
              </>
            )}
          </>
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
  // 削除確認パネル表示中は、説明文が読みやすいよう少し幅を広げる
  panelWide: { width: 280 },
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
  itemTextDanger: { color: colors.danger },
  deleteConfirmPanel: { padding: 6 },
  deleteConfirmTitle: { color: colors.textPrimary, fontWeight: '600', marginBottom: 10, fontSize: 14 },
  deleteConfirmDesc: { color: colors.textSecondary, fontSize: 13, lineHeight: 19, marginBottom: 16 },
  deleteConfirmRow: { flexDirection: 'row', gap: 10 },
  deleteCancelButton: {
    flex: 1,
    borderRadius: 10,
    paddingVertical: 12,
    alignItems: 'center',
    backgroundColor: colors.background,
  },
  deleteCancelText: { color: colors.textSecondary, fontSize: 14, fontWeight: '600' },
  deleteConfirmButton: {
    flex: 1,
    borderRadius: 10,
    paddingVertical: 12,
    alignItems: 'center',
    backgroundColor: colors.danger,
  },
  deleteConfirmButtonText: { color: '#fff', fontSize: 14, fontWeight: '700' },
});
