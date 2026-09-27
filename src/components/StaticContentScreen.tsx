import React from 'react';
import { View, ScrollView, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Text from './AppText';
import { colors, space, type } from '../lib/theme';
import { useTranslation } from '../lib/i18n';
import type { StaticPageContent } from '../content/staticPages';

// 「リミナルスペースとは」「使い方」など、静的な読み物ページの共通レイアウト。
// 見出し・本文セクション・FAQを1つのコンポーネントで描画する。
// footer: 本文・FAQの後ろに差し込む任意の要素(例: Aboutページの支援カード)
export default function StaticContentScreen({
  content,
  footer,
}: {
  content: StaticPageContent;
  footer?: React.ReactNode;
}) {
  const t = useTranslation().staticPage;
  return (
    <SafeAreaView style={styles.container} edges={['left', 'right', 'bottom']}>
      <ScrollView contentContainerStyle={styles.scroll}>
        <Text style={styles.heading}>{content.heading}</Text>
        <Text variant="body" style={styles.lead}>{content.lead}</Text>

        {content.sections.map((section) => (
          <View key={section.heading} style={styles.section}>
            {/* 章見出し。Webの記事ページと同じく、頭に小さな黄色の四角（ドット）を置く */}
            <View style={styles.sectionHeadingRow}>
              <View style={styles.headingDot} />
              <Text style={styles.sectionHeading}>{section.heading}</Text>
            </View>
            <Text variant="body" style={styles.sectionBody}>{section.body}</Text>
          </View>
        ))}

        {content.faq.length > 0 && (
          <View style={styles.faqBlock}>
            <Text style={styles.faqTitle}>{t.faqTitle}</Text>
            {content.faq.map((item) => (
              <View key={item.question} style={styles.faqItem}>
                <Text style={styles.faqQuestion}>Q. {item.question}</Text>
                <Text variant="body" style={styles.faqAnswer}>A. {item.answer}</Text>
              </View>
            ))}
          </View>
        )}

        {footer}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  scroll: { paddingHorizontal: 20, paddingTop: space.xl, paddingBottom: 56, width: '100%', maxWidth: 680, alignSelf: 'center' },
  heading: { color: colors.textPrimary, fontSize: type.displayL - 2, lineHeight: 36, marginBottom: space.m },
  lead: { color: colors.textSecondary, fontSize: type.body, lineHeight: 26, marginBottom: space.xxl },
  section: { marginBottom: space.xxl, gap: space.m },
  sectionHeadingRow: { flexDirection: 'row', alignItems: 'center', gap: space.m },
  headingDot: { width: 8, height: 8, backgroundColor: colors.accent },
  sectionHeading: { flex: 1, color: colors.textPrimary, fontSize: type.heading, lineHeight: 27 },
  sectionBody: { color: colors.textSecondary, fontSize: type.body, lineHeight: 27 },
  faqBlock: { marginTop: space.s, borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: colors.border, paddingTop: space.xl },
  faqTitle: { color: colors.textPrimary, fontSize: type.heading, marginBottom: space.l },
  faqItem: { marginBottom: 20, gap: 6 },
  faqQuestion: { color: colors.textPrimary, fontSize: type.body, lineHeight: 24 },
  faqAnswer: { color: colors.textSecondary, fontSize: 14, lineHeight: 24 },
});
