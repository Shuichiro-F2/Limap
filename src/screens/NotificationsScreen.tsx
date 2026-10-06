import React, { useCallback, useState } from 'react';
import { View, FlatList, Pressable, StyleSheet, ActivityIndicator, RefreshControl } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import Text from '../components/AppText';
import { useAuth } from '../lib/AuthContext';
import { useLanguage, useTranslation } from '../lib/i18n';
import { fetchActivity, markActivitySeen, type ActivityItem } from '../lib/activity';
import { colors, space, type } from '../lib/theme';
import type { RootStackScreenProps } from '../navigation/types';

// アプリ内のお知らせ（自分の投稿へのいいね・行ってきた投稿、新しいフォロワー）。マイページから開く。
// 開いたら「見た」ことにして、マイページのベルの印を消す（lib/activity.ts）。

export default function NotificationsScreen({ navigation }: RootStackScreenProps<'Notifications'>) {
  const { session } = useAuth();
  const t = useTranslation().notifications;
  const { language } = useLanguage();
  const [items, setItems] = useState<ActivityItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    const userId = session?.user?.id;
    if (!userId) return;
    try {
      const data = await fetchActivity(userId);
      setItems(data);
      markActivitySeen(userId, data[0]?.at ?? new Date().toISOString());
    } catch (e) {
      console.warn('お知らせの取得エラー', e);
    }
  }, [session?.user?.id]);

  useFocusEffect(
    useCallback(() => {
      if (!session?.user) {
        navigation.replace('Auth');
        return;
      }
      load().finally(() => setLoading(false));
    }, [load, session?.user])
  );

  const nameOf = (item: ActivityItem) => item.actor.display_name || item.actor.username || t.someone;
  const textOf = (item: ActivityItem) => {
    if (item.kind === 'follow') return t.followed.replace('{name}', nameOf(item));
    const template = item.kind === 'like' ? t.liked : t.reviewed;
    return template.replace('{name}', nameOf(item)).replace('{spot}', item.spotTitle);
  };
  const dateOf = (iso: string) =>
    new Date(iso).toLocaleDateString(language === 'ja' ? 'ja-JP' : 'en-US', { month: 'short', day: 'numeric' });

  const open = (item: ActivityItem) => {
    if (item.kind === 'follow') navigation.navigate('UserProfile', { userId: item.actor.id });
    else navigation.navigate('SpotDetail', { spotId: item.spotSlug });
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <ActivityIndicator color={colors.textPrimary} style={{ marginTop: 24 }} />
      </View>
    );
  }

  return (
    <FlatList
      style={styles.container}
      data={items}
      keyExtractor={(item, i) => `${item.kind}-${item.at}-${i}`}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={async () => {
            setRefreshing(true);
            await load();
            setRefreshing(false);
          }}
          tintColor={colors.textPrimary}
        />
      }
      ListEmptyComponent={
        <Text variant="body" style={styles.empty}>
          {t.empty}
        </Text>
      }
      renderItem={({ item }) => (
        <Pressable style={styles.row} onPress={() => open(item)}>
          <Ionicons
            name={item.kind === 'like' ? 'heart' : item.kind === 'review' ? 'images-outline' : 'person-add-outline'}
            size={20}
            color={colors.accent}
          />
          <View style={styles.textCol}>
            <Text variant="body" style={styles.text}>
              {textOf(item)}
            </Text>
            <Text style={styles.date}>{dateOf(item.at)}</Text>
          </View>
        </Pressable>
      )}
    />
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  row: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: space.m,
    paddingHorizontal: space.l,
    paddingVertical: space.m,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
  },
  textCol: { flex: 1, gap: 2 },
  text: { color: colors.textPrimary, fontSize: type.body, lineHeight: 21 },
  date: { color: colors.textMuted, fontSize: type.caption },
  empty: { color: colors.textMuted, textAlign: 'center', marginTop: 40, fontSize: type.small, paddingHorizontal: space.l },
});
