import React, { useEffect, useState } from 'react';
import { StyleSheet, FlatList, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Text from '../components/AppText';
import UserRow from '../components/UserRow';
import { fetchFollowers, fetchFollowing } from '../lib/profiles';
import { useAuth } from '../lib/AuthContext';
import { useTranslation } from '../lib/i18n';
import { colors, type } from '../lib/theme';
import type { Profile } from '../types/database';
import type { RootStackScreenProps } from '../navigation/types';

type Props = RootStackScreenProps<'FollowList'>;

// マイページ・ユーザープロフィール画面の「フォロー中」「フォロワー」欄をタップした時の一覧表示
export default function FollowListScreen({ route, navigation }: Props) {
  const { userId, mode } = route.params;
  const { session } = useAuth();
  const [users, setUsers] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const t = useTranslation();
  const title = mode === 'followers' ? t.myPage.followers : t.myPage.following;

  // 言語を切り替えたときに一覧を取り直さないよう、タイトルの設定は別のeffectにする
  useEffect(() => {
    navigation.setOptions({ title });
  }, [title]);

  useEffect(() => {
    const fetcher = mode === 'followers' ? fetchFollowers : fetchFollowing;
    setLoading(true);
    fetcher(userId)
      .then(setUsers)
      .catch((e) => console.warn('一覧取得エラー', e))
      .finally(() => setLoading(false));
  }, [userId, mode]);

  const goToProfile = (targetId: string) => {
    if (targetId === session?.user?.id) {
      navigation.navigate('Main', { screen: 'MyPageTab' });
    } else {
      navigation.push('UserProfile', { userId: targetId });
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['left', 'right']}>
      {loading ? (
        <ActivityIndicator color={colors.textPrimary} style={{ marginTop: 24 }} />
      ) : (
        <FlatList
          data={users}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.list}
          ListEmptyComponent={
            <Text variant="body" style={styles.emptyText}>
              {mode === 'followers' ? t.profile.followersEmpty : t.profile.followingEmpty}
            </Text>
          }
          renderItem={({ item, index }) => (
            <UserRow user={item} onPress={() => goToProfile(item.id)} divider={index > 0} />
          )}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  list: { paddingHorizontal: 20, paddingVertical: 8, width: '100%', maxWidth: 640, alignSelf: 'center' },
  emptyText: { color: colors.textMuted, textAlign: 'center', marginTop: 40, fontSize: type.small },
});
