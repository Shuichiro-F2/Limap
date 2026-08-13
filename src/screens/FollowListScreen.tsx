import React, { useEffect, useState } from 'react';
import { View, Pressable, StyleSheet, FlatList, Image, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Text from '../components/AppText';
import { fetchFollowers, fetchFollowing } from '../lib/profiles';
import { useAuth } from '../lib/AuthContext';
import { colors } from '../lib/theme';
import type { Profile } from '../types/database';
import type { RootStackScreenProps } from '../navigation/types';

type Props = RootStackScreenProps<'FollowList'>;

// マイページ・ユーザープロフィール画面の「フォロー中」「フォロワー」欄をタップした時の一覧表示
export default function FollowListScreen({ route, navigation }: Props) {
  const { userId, mode } = route.params;
  const { session } = useAuth();
  const [users, setUsers] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    navigation.setOptions({ title: mode === 'followers' ? 'フォロワー' : 'フォロー中' });
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
          contentContainerStyle={{ padding: 12 }}
          ListEmptyComponent={
            <Text style={styles.emptyText}>
              {mode === 'followers' ? 'フォロワーはまだいません' : 'フォロー中のユーザーはいません'}
            </Text>
          }
          renderItem={({ item }) => (
            <Pressable style={styles.row} onPress={() => goToProfile(item.id)}>
              {item.avatar_url ? (
                <Image source={{ uri: item.avatar_url }} style={styles.avatar} />
              ) : (
                <View style={[styles.avatar, styles.avatarPlaceholder]}>
                  <Text style={styles.avatarPlaceholderText}>{item.username.charAt(0).toUpperCase()}</Text>
                </View>
              )}
              <View style={{ flex: 1 }}>
                <Text style={styles.username}>@{item.username}</Text>
                {item.display_name ? <Text style={styles.displayName}>{item.display_name}</Text> : null}
              </View>
            </Pressable>
          )}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  row: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 10, paddingHorizontal: 8 },
  avatar: { width: 44, height: 44, borderRadius: 22 },
  avatarPlaceholder: { backgroundColor: colors.accent, alignItems: 'center', justifyContent: 'center' },
  avatarPlaceholderText: { color: colors.accentText, fontSize: 16, fontWeight: '700' },
  username: { color: colors.textPrimary, fontSize: 14, fontWeight: '600' },
  displayName: { color: colors.textSecondary, fontSize: 12, marginTop: 2 },
  emptyText: { color: colors.textMuted, textAlign: 'center', marginTop: 40, fontSize: 13 },
});
