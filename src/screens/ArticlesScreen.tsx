import React from 'react';
import { View, Pressable, StyleSheet, FlatList, Image, Linking } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Text from '../components/AppText';
import { HEADER_CONTENT_HEIGHT } from '../components/AppHeader';
import { ARTICLES, articleThumbnailUrl, articleUrl, type ArticleSummary } from '../lib/articles';
import { useLanguage, useTranslation } from '../lib/i18n';
import { colors } from '../lib/theme';
import type { MainTabScreenProps } from '../navigation/types';

type Props = MainTabScreenProps<'ArticlesTab'>;

// コラム(記事)タブ: public/articles配下の静的なSEO記事一覧を、アプリ内から
// 見つけて開けるようにするための画面。記事自体はアプリの外(ブラウザ)で開く。
export default function ArticlesScreen({}: Props) {
  const { language } = useLanguage();
  const t = useTranslation();

  const openArticle = (slug: string) => {
    Linking.openURL(articleUrl(slug)).catch(() => {});
  };

  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
      <View style={{ height: HEADER_CONTENT_HEIGHT }} />

      <FlatList
        data={ARTICLES}
        keyExtractor={(item) => item.slug}
        contentContainerStyle={{ padding: 16, paddingBottom: 24 }}
        ListHeaderComponent={
          <View style={styles.listHeader}>
            <Text style={styles.pageTitle}>{t.articles.pageTitle}</Text>
            <Text style={styles.pageLead}>{t.articles.pageLead}</Text>
          </View>
        }
        renderItem={({ item }: { item: ArticleSummary }) => (
          <Pressable style={styles.card} onPress={() => openArticle(item.slug)}>
            <Image source={{ uri: articleThumbnailUrl(item.thumbnailFile) }} style={styles.thumb} />
            <View style={styles.cardBody}>
              <Text style={styles.category}>{language === 'en' ? item.categoryEn : item.categoryJa}</Text>
              <Text style={styles.title} numberOfLines={2}>
                {language === 'en' ? item.titleEn : item.titleJa}
              </Text>
              <Text style={styles.lead} numberOfLines={2}>
                {language === 'en' ? item.leadEn : item.leadJa}
              </Text>
            </View>
          </Pressable>
        )}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  listHeader: { marginBottom: 8 },
  pageTitle: { color: colors.textPrimary, fontSize: 20, fontWeight: '700', marginBottom: 4 },
  pageLead: { color: colors.textSecondary, fontSize: 13, marginBottom: 12, lineHeight: 19 },
  card: {
    flexDirection: 'row',
    backgroundColor: colors.surface,
    borderRadius: 12,
    marginBottom: 12,
    overflow: 'hidden',
  },
  thumb: { width: 96, height: 96 },
  cardBody: { flex: 1, padding: 12, justifyContent: 'center' },
  category: { color: colors.accent, fontSize: 11, fontWeight: '700', marginBottom: 4 },
  title: { color: colors.textPrimary, fontSize: 14, fontWeight: '600', marginBottom: 4, lineHeight: 19 },
  lead: { color: colors.textSecondary, fontSize: 12, lineHeight: 17 },
});
