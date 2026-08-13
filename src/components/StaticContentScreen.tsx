import React from 'react';
import { View, ScrollView, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Text from './AppText';
import { colors } from '../lib/theme';
import type { StaticPageContent } from '../content/staticPages';

// 「リミナルスペースとは」「使い方」など、静的な読み物ページの共通レイアウト。
// 見出し・本文セクション・FAQを1つのコンポーネントで描画する。
export default function StaticContentScreen({ content }: { content: StaticPageContent }) {
  return (
    <SafeAreaView style={styles.container} edges={['left', 'right', 'bottom']}>
      <ScrollView contentContainerStyle={styles.scroll}>
        <Text style={styles.heading}>{content.heading}</Text>
        <Text style={styles.lead}>{content.lead}</Text>

        {content.sections.map((section) => (
          <View key={section.heading} style={styles.section}>
            <Text style={styles.sectionHeading}>{section.heading}</Text>
            <Text style={styles.sectionBody}>{section.body}</Text>
          </View>
        ))}

        {content.faq.length > 0 && (
          <View style={styles.faqBlock}>
            <Text style={styles.faqTitle}>よくある質問</Text>
            {content.faq.map((item) => (
              <View key={item.question} style={styles.faqItem}>
                <Text style={styles.faqQuestion}>Q. {item.question}</Text>
                <Text style={styles.faqAnswer}>A. {item.answer}</Text>
              </View>
            ))}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  scroll: { padding: 20, paddingBottom: 48 },
  heading: { color: colors.textPrimary, fontSize: 22, fontWeight: '700', marginBottom: 12 },
  lead: { color: colors.textSecondary, fontSize: 14, lineHeight: 22, marginBottom: 24 },
  section: { marginBottom: 22 },
  sectionHeading: { color: colors.accent, fontSize: 15, fontWeight: '700', marginBottom: 8 },
  sectionBody: { color: colors.textSecondary, fontSize: 13, lineHeight: 21 },
  faqBlock: { marginTop: 8, borderTopWidth: 1, borderTopColor: colors.border, paddingTop: 20 },
  faqTitle: { color: colors.textPrimary, fontSize: 16, fontWeight: '700', marginBottom: 14 },
  faqItem: { marginBottom: 16 },
  faqQuestion: { color: colors.textPrimary, fontSize: 13, fontWeight: '600', marginBottom: 6 },
  faqAnswer: { color: colors.textSecondary, fontSize: 13, lineHeight: 20 },
});
