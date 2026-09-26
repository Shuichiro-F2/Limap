import React from 'react';
import { View, Pressable, StyleSheet, FlatList, Image, Linking } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Text from '../components/AppText';
import { HEADER_CONTENT_HEIGHT } from '../components/AppHeader';
import { ARTICLES, articleThumbnailUrl, articleUrl, type ArticleSummary } from '../lib/articles';
import { useLanguage, useTranslation } from '../lib/i18n';
import { colors, radius, space, type } from '../lib/theme';
import type { MainTabScreenProps } from '../navigation/types';

type Props = MainTabScreenProps<'ArticlesTab'>;

// コラム(記事)タブ: public/articles配下の静的なSEO記事一覧を、アプリ内から
// 見つけて開けるようにするための画面。記事自体はアプリの外(ブラウザ)で開く。
export default function ArticlesScreen({}: Props) {
  const { language } = useLanguage();
  const t = useTranslation();
  const en = language === 'en';

  const openArticle = (slug: string) => {
    Linking.openURL(articleUrl(slug, language)).catch(() => {});
  };

  // 最新の1本は大きな写真付きで目立たせ、残りは細い線で区切った一覧にする
  const [featured, ...rest] = ARTICLES;

  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
      <View style={{ height: HEADER_CONTENT_HEIGHT }} />

      <FlatList
        data={rest}
        keyExtractor={(item) => item.slug}
        contentContainerStyle={styles.content}
        ListHeaderComponent={
          <View>
            <View style={styles.listHeader}>
              <Text style={styles.pageTitle}>{t.articles.pageTitle}</Text>
              <Text variant="body" style={styles.pageLead}>
                {t.articles.pageLead}
              </Text>
            </View>

            {featured && (
              <Pressable
                style={({ pressed }) => [styles.featured, pressed && styles.pressed]}
                onPress={() => openArticle(featured.slug)}
              >
                <Image
                  source={{ uri: articleThumbnailUrl(featured.thumbnailFile, 900) }}
                  style={styles.featuredImage}
                />
                <View style={styles.featuredBody}>
                  <Text style={styles.category}>
                    {(en ? featured.categoryEn : featured.categoryJa) + '・' + featured.publishedDate}
                  </Text>
                  <Text style={styles.featuredTitle}>{en ? featured.titleEn : featured.titleJa}</Text>
                  <Text variant="body" style={styles.lead} numberOfLines={2}>
                    {en ? featured.leadEn : featured.leadJa}
                  </Text>
                </View>
              </Pressable>
            )}
          </View>
        }
        renderItem={({ item, index }: { item: ArticleSummary; index: number }) => (
          <Pressable
            style={({ pressed }) => [styles.row, index > 0 && styles.rowDivider, pressed && styles.pressed]}
            onPress={() => openArticle(item.slug)}
          >
            <Image source={{ uri: articleThumbnailUrl(item.thumbnailFile, 300) }} style={styles.thumb} />
            <View style={styles.rowBody}>
              <Text style={styles.category}>{en ? item.categoryEn : item.categoryJa}</Text>
              <Text style={styles.title} numberOfLines={3}>
                {en ? item.titleEn : item.titleJa}
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
  content: { paddingHorizontal: space.l, paddingBottom: space.xl, width: '100%', maxWidth: 720, alignSelf: 'center' },
  listHeader: { gap: 6, paddingTop: space.m, marginBottom: space.l },
  pageTitle: { color: colors.textPrimary, fontSize: type.displayL },
  pageLead: { color: colors.textSecondary, fontSize: type.small, lineHeight: 20 },
  featured: {
    borderRadius: radius.m,
    overflow: 'hidden',
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: space.s,
  },
  featuredImage: { width: '100%', aspectRatio: 16 / 9, backgroundColor: colors.surfaceAlt },
  featuredBody: { paddingHorizontal: space.l, paddingTop: 14, paddingBottom: space.l, gap: space.s },
  featuredTitle: { color: colors.textPrimary, fontSize: type.heading, lineHeight: 27 },
  pressed: { opacity: 0.75 },
  row: { flexDirection: 'row', gap: space.m, paddingVertical: space.m },
  rowDivider: { borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: colors.border },
  thumb: { width: 88, height: 66, borderRadius: radius.s, backgroundColor: colors.surfaceAlt },
  rowBody: { flex: 1, minWidth: 0, gap: space.xs },
  category: { color: colors.accent, fontSize: type.caption, letterSpacing: 0.6 },
  title: { color: colors.textPrimary, fontSize: type.body, lineHeight: 22 },
  lead: { color: colors.textSecondary, fontSize: type.small, lineHeight: 20 },
});
