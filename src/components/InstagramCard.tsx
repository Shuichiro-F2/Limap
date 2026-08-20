import React, { useEffect, useState } from 'react';
import { View, Image, Pressable, ActivityIndicator, Linking, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Text from './AppText';
import { colors } from '../lib/theme';

// Instagram投稿の「引用カード」。
//
// 以前はInstagram公式のライブ埋め込み(blockquote + embed.js)をWeb版はブラウザ内、
// ネイティブ版はWebView内で描画していたが、
// 1) 投稿者がアカウント側で「ウェブサイトへの埋め込み」を許可していない場合、
// 2) リール(動画)特有の相性問題で、
// ブラウザの種類によらず高さが0のまま描画に失敗するケースが多く、信頼性が低かった。
//
// そこでMetaのoEmbed APIから取得したサムネイル画像+投稿者名だけを使い、
// タップでInstagram本体に遷移する軽量なカードに切り替えた。
// (Meta公式ドキュメントで、サムネイルを使う場合は投稿者名とInstagramへの
// リンクを明記することが要件として定められているため、両方を必ず表示する)
//
// サムネイル取得用のAPI(api/instagram-oembed.ts)はサーバー側でのみ動作するため、
// Web版・ネイティブ版共通でこのコンポーネントをそのまま使い回せる。

const OEMBED_API_BASE = 'https://limap.jp/api/instagram-oembed';
const DEFAULT_ASPECT_RATIO = 4 / 5; // 取得に失敗した場合のフォールバック比率(縦長の投稿を想定)

type OEmbedResult = {
  thumbnailUrl: string | null;
  authorName: string | null;
  thumbnailWidth: number | null;
  thumbnailHeight: number | null;
};

type Props = { url: string };

export default function InstagramCard({ url }: Props) {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<OEmbedResult | null>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setFailed(false);
    setData(null);

    fetch(`${OEMBED_API_BASE}?url=${encodeURIComponent(url)}`)
      .then((res) => {
        if (!res.ok) throw new Error(`oembed failed: ${res.status}`);
        return res.json();
      })
      .then((json: OEmbedResult) => {
        if (cancelled) return;
        if (!json.thumbnailUrl) {
          setFailed(true);
        } else {
          setData(json);
        }
      })
      .catch(() => {
        if (!cancelled) setFailed(true);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [url]);

  const openInstagram = () => {
    Linking.openURL(url).catch(() => {});
  };

  if (loading) {
    return (
      <View style={styles.loadingBox}>
        <ActivityIndicator color={colors.textSecondary} size="small" />
      </View>
    );
  }

  // サムネイルが取得できなかった場合(埋め込み非許可のアカウント、
  // Meta側の未設定/未承認、通信エラーなど)は、最低限リンクとして機能させる
  if (failed || !data?.thumbnailUrl) {
    return (
      <Pressable style={styles.fallbackLink} onPress={openInstagram}>
        <Ionicons name="logo-instagram" size={18} color="#ffffff" />
        <Text style={styles.fallbackLinkText}>Instagramで投稿を見る ↗</Text>
      </Pressable>
    );
  }

  const aspectRatio =
    data.thumbnailWidth && data.thumbnailHeight ? data.thumbnailWidth / data.thumbnailHeight : DEFAULT_ASPECT_RATIO;

  return (
    <Pressable style={styles.card} onPress={openInstagram}>
      <Image source={{ uri: data.thumbnailUrl }} style={[styles.thumbnail, { aspectRatio }]} resizeMode="cover" />
      <View style={styles.footer}>
        <Ionicons name="logo-instagram" size={16} color="#ffffff" />
        <Text style={styles.footerText} numberOfLines={1}>
          {data.authorName ? `@${data.authorName}` : 'Instagram'}
        </Text>
        <Ionicons name="open-outline" size={14} color="#ffffff" style={{ marginLeft: 'auto' }} />
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  loadingBox: {
    height: 120,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(0,0,0,0.06)',
    borderRadius: 12,
  },
  fallbackLink: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 16,
    paddingHorizontal: 16,
    borderRadius: 8,
    backgroundColor: '#262626',
  },
  fallbackLinkText: { color: '#ffffff', fontSize: 14, fontWeight: '600' },
  card: { borderRadius: 12, overflow: 'hidden', backgroundColor: '#000000' },
  thumbnail: { width: '100%' },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 8,
    paddingHorizontal: 10,
    backgroundColor: '#262626',
  },
  footerText: { color: '#ffffff', fontSize: 12, fontWeight: '600' },
});
