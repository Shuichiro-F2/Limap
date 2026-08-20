import React, { useEffect, useState } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  Image,
  Pressable,
  ActivityIndicator,
  Linking,
  Platform,
  useWindowDimensions,
  type NativeScrollEvent,
  type NativeSyntheticEvent,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Text from './AppText';
import { UsernameWithBadge } from './UserBadge';
import InstagramEmbed from './InstagramEmbed';
import XEmbed from './XEmbed';
import { spotImageUrl } from '../lib/spots';
import { shareSpot, copyLink } from '../lib/share';
import { colors } from '../lib/theme';
import type { Spot, SpotImage, SpotEmbed, ReportReason } from '../types/database';

// 画像・SNS埋め込み(Instagram/X)を「メディア」として一つの横スクロールにまとめて扱うための型。
// 表示順は画像(position順)→SNS埋め込み(position順)。
type MediaItem = { kind: 'image'; image: SpotImage } | { kind: 'embed'; embed: SpotEmbed };

// PC/Web表示時に画像・本文が横に広がりすぎないようにする最大幅。
const MAX_CONTENT_WIDTH = 640;

// 画像の高さは基本的に元画像の縦横比に合わせて表示し、上下がカットされないようにする。
// ただし極端に縦長な画像の場合はこの倍率(横幅比)を上限に高さをクランプし、はみ出た分だけカットする。
const MAX_IMAGE_ASPECT_RATIO = 1.5;

// SNS埋め込み(Instagram/X)の実測高さがまだ届いていない間の仮の高さ。
// react-native-webview版のDEFAULT_HEIGHTと合わせておく。
const EMBED_FALLBACK_HEIGHT = 420;

const REPORT_REASONS: { value: ReportReason; label: string }[] = [
  { value: 'privacy', label: 'プライバシー・私有地の懸念' },
  { value: 'wrong_location', label: '位置情報が誤っている' },
  { value: 'inappropriate', label: '不適切なコンテンツ' },
  { value: 'spam', label: 'スパム・宣伝' },
  { value: 'other', label: 'その他' },
];

type Props = {
  spot: Spot | null;
  loading: boolean;
  liked: boolean;
  bookmarked: boolean;
  showReport: boolean;
  onToggleReport: () => void;
  onLike: () => void;
  onBookmark: () => void;
  onReport: (reason: ReportReason) => void;
  imageHeight?: number;
  scrollEnabled?: boolean;
  onScroll?: (e: NativeSyntheticEvent<NativeScrollEvent>) => void;
  onViewOnMap?: () => void;
  onTagPress?: (tagId: number) => void;
  onAuthorPress?: (userId: string) => void;
  isOwner?: boolean;
  onDelete?: () => void;
  deleting?: boolean;
};

// スポット詳細の中身（画像カルーセル＋本文）だけを描画する表示専用コンポーネント。
// フル画面の詳細画面と、地図画面のプレビューシートの両方で使い回す。
export default function SpotDetailContent({
  spot,
  loading,
  liked,
  bookmarked,
  showReport,
  onToggleReport,
  onLike,
  onBookmark,
  onReport,
  imageHeight = 280,
  scrollEnabled = true,
  onScroll,
  onViewOnMap,
  onTagPress,
  onAuthorPress,
  isOwner = false,
  onDelete,
  deleting = false,
}: Props) {
  const { width: screenWidth } = useWindowDimensions();
  // PCなど横幅の広い画面では、画像や本文が横に間延びしないよう最大幅で中央寄せする。
  const contentWidth = Math.min(screenWidth, MAX_CONTENT_WIDTH);
  const [showMenu, setShowMenu] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  // 先頭画像の縦横比（高さ÷幅）。取得できるまではimageHeightのデフォルト値で表示する。
  const [imageAspectRatio, setImageAspectRatio] = useState<number | null>(null);
  // SNS埋め込み(Instagram/X)ごとの実測高さ(embed.idをキーに保持)。
  // ウィジェット全体が見切れないよう、カルーセルの高さはこれらの最大値を含めて決める。
  const [embedHeights, setEmbedHeights] = useState<Record<string, number>>({});

  // 画像とSNS埋め込み(Instagram/X)をまとめて1つの横スライドで扱う。
  // 表示順は画像→SNS埋め込み。カルーセル全体の高さは(下記の通り)先頭画像の
  // 縦横比に合わせるため、画像がある場合は画像を先に並べるのが自然な見た目になる。
  const sortedImages = spot?.images ? [...spot.images].sort((a, b) => a.position - b.position) : [];
  const sortedEmbeds = spot?.embeds
    ? [...spot.embeds]
        .filter((e) => e.platform === 'instagram' || e.platform === 'x')
        .sort((a, b) => a.position - b.position)
    : [];
  const mediaItems: MediaItem[] = [
    ...sortedImages.map((image) => ({ kind: 'image' as const, image })),
    ...sortedEmbeds.map((embed) => ({ kind: 'embed' as const, embed })),
  ];

  const firstImagePath = sortedImages[0]?.storage_path ?? null;

  useEffect(() => {
    setImageAspectRatio(null);
    if (!firstImagePath) return;
    let cancelled = false;
    Image.getSize(
      spotImageUrl(firstImagePath),
      (w, h) => {
        if (!cancelled && w > 0) setImageAspectRatio(h / w);
      },
      () => {}
    );
    return () => {
      cancelled = true;
    };
  }, [firstImagePath]);

  // スポットが切り替わったら、前のスポットのSNS埋め込み(Instagram/X)の実測高さを引き継がない。
  useEffect(() => {
    setEmbedHeights({});
  }, [spot?.id]);

  // 画像側の希望の高さ。縦横比が判明していれば、上下がカットされないよう実寸に合わせる。
  // 極端に縦長な場合はMAX_IMAGE_ASPECT_RATIOを超えないようクランプし、その分だけカットする。
  // 画像が1枚もない場合はSNS埋め込み(Instagram/X)の高さだけで決まるので0として扱う。
  const baseImageHeight =
    sortedImages.length === 0
      ? 0
      : imageAspectRatio
        ? Math.min(contentWidth * imageAspectRatio, contentWidth * MAX_IMAGE_ASPECT_RATIO)
        : imageHeight;

  // SNS埋め込み(Instagram/X)の実測高さの最大値。ウィジェット全体(キャプション等含む)が
  // 見切れないよう、カルーセルの高さはこれを下回らないようにする。
  // 実測がまだ届いていない埋め込みがあればEMBED_FALLBACK_HEIGHTを仮の高さとして使う。
  const maxEmbedHeight =
    sortedEmbeds.length === 0
      ? 0
      : Math.max(...sortedEmbeds.map((e) => embedHeights[e.id] ?? EMBED_FALLBACK_HEIGHT));

  // カルーセル全体で共有する高さ。画像だけの縦横比ではなく、SNS埋め込み(Instagram/X)の
  // 実際の高さも含めた最大値に合わせることで、埋め込みが枠内で見切れないようにする。
  const displayedImageHeight = mediaItems.length === 0 ? imageHeight : Math.max(baseImageHeight, maxEmbedHeight);

  if (loading || !spot) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color={colors.accentText} />
      </View>
    );
  }

  const openInGoogleMaps = () => {
    const url = `https://www.google.com/maps/search/?api=1&query=${spot.lat},${spot.lng}`;
    Linking.openURL(url).catch(() => {});
  };

  const handleShare = () => shareSpot(spot.title, spot.slug);
  const handleCopyLink = () => copyLink(spot.slug);

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.scrollContent}
      scrollEnabled={scrollEnabled}
      onScroll={onScroll}
      scrollEventThrottle={16}
    >
      <View style={[styles.contentWrapper, { maxWidth: MAX_CONTENT_WIDTH }]}>
        {mediaItems.length > 0 && (
          <ScrollView
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            style={{ width: contentWidth }}
          >
            {mediaItems.map((item) =>
              item.kind === 'image' ? (
                <Image
                  key={`image-${item.image.id}`}
                  source={{ uri: spotImageUrl(item.image.storage_path) }}
                  style={[styles.image, { width: contentWidth, height: displayedImageHeight }]}
                  resizeMode="cover"
                />
              ) : (
                <View
                  key={`embed-${item.embed.id}`}
                  style={[styles.embedSlide, { width: contentWidth, height: displayedImageHeight }]}
                >
                  {item.embed.platform === 'instagram' ? (
                    <InstagramEmbed
                      url={item.embed.url}
                      onHeightChange={(height) =>
                        setEmbedHeights((prev) => (prev[item.embed.id] === height ? prev : { ...prev, [item.embed.id]: height }))
                      }
                    />
                  ) : (
                    <XEmbed
                      url={item.embed.url}
                      onHeightChange={(height) =>
                        setEmbedHeights((prev) => (prev[item.embed.id] === height ? prev : { ...prev, [item.embed.id]: height }))
                      }
                    />
                  )}
                </View>
              )
            )}
          </ScrollView>
        )}

        <View style={styles.body}>
          <View style={styles.metaRow}>
            {(spot.city || spot.country) && (
              <Text style={styles.meta}>
                {spot.city ?? ''} {spot.country ?? ''}
              </Text>
            )}
            {spot.author?.username &&
              (onAuthorPress ? (
                <Pressable onPress={() => onAuthorPress(spot.author_id)} hitSlop={6}>
                  <UsernameWithBadge username={spot.author.username} badge={spot.author.badge} textStyle={styles.authorText} />
                </Pressable>
              ) : (
                <UsernameWithBadge username={spot.author.username} badge={spot.author.badge} textStyle={styles.authorText} />
              ))}
          </View>

        {spot.tags && spot.tags.length > 0 && (
          <View style={styles.tagRow}>
            {spot.tags.map((tag) =>
              onTagPress ? (
                <Pressable key={tag.id} style={styles.tagChip} onPress={() => onTagPress(tag.id)}>
                  <Text style={styles.tagChipText}>{tag.name}</Text>
                </Pressable>
              ) : (
                <View key={tag.id} style={styles.tagChip}>
                  <Text style={styles.tagChipText}>{tag.name}</Text>
                </View>
              )
            )}
          </View>
        )}

        {spot.description && <Text style={styles.description}>{spot.description}</Text>}

        <View style={styles.actionRow}>
          <View style={styles.iconButtonsRow}>
            <Pressable style={styles.iconButtonWithCount} onPress={onLike} hitSlop={10}>
              <Ionicons
                name={liked ? 'heart' : 'heart-outline'}
                size={26}
                color={liked ? colors.danger : colors.accentText}
              />
              {spot.like_count > 0 && <Text style={styles.iconCountText}>{spot.like_count}</Text>}
            </Pressable>
            <Pressable style={styles.iconButtonWithCount} onPress={onBookmark} hitSlop={10}>
              <Ionicons
                name={bookmarked ? 'bookmark' : 'bookmark-outline'}
                size={24}
                color={colors.accentText}
              />
              {spot.bookmark_count > 0 && <Text style={styles.iconCountText}>{spot.bookmark_count}</Text>}
            </Pressable>
            <Pressable style={styles.iconButton} onPress={handleShare} hitSlop={10}>
              <Ionicons name="share-social-outline" size={24} color={colors.accentText} />
            </Pressable>
          </View>
          <Pressable style={styles.menuButton} onPress={() => setShowMenu((v) => !v)} hitSlop={10}>
            <Ionicons name="ellipsis-horizontal" size={22} color={colors.accentText} />
          </Pressable>
        </View>

        {showMenu && (
          <View style={styles.menuPanel}>
            {onViewOnMap && (
              <Pressable
                style={styles.menuItem}
                onPress={() => {
                  setShowMenu(false);
                  onViewOnMap();
                }}
              >
                <Ionicons name="map-outline" size={18} color={colors.textPrimary} />
                <Text style={styles.menuItemText}>地図で見る</Text>
              </Pressable>
            )}
            <Pressable
              style={styles.menuItem}
              onPress={() => {
                setShowMenu(false);
                openInGoogleMaps();
              }}
            >
              <Ionicons name="navigate-outline" size={18} color={colors.textPrimary} />
              <Text style={styles.menuItemText}>Googleマップで開く</Text>
            </Pressable>
            {Platform.OS === 'web' && (
              <Pressable
                style={styles.menuItem}
                onPress={() => {
                  setShowMenu(false);
                  handleCopyLink();
                }}
              >
                <Ionicons name="link-outline" size={18} color={colors.textPrimary} />
                <Text style={styles.menuItemText}>リンクをコピー</Text>
              </Pressable>
            )}
            {isOwner && onDelete ? (
              <Pressable
                style={[styles.menuItem, styles.menuItemLast]}
                onPress={() => {
                  setShowMenu(false);
                  setShowDeleteConfirm(true);
                }}
              >
                <Ionicons name="trash-outline" size={18} color={colors.danger} />
                <Text style={[styles.menuItemText, styles.menuItemDangerText]}>削除する</Text>
              </Pressable>
            ) : (
              <Pressable
                style={[styles.menuItem, styles.menuItemLast]}
                onPress={() => {
                  setShowMenu(false);
                  onToggleReport();
                }}
              >
                <Ionicons name="flag-outline" size={18} color={colors.danger} />
                <Text style={[styles.menuItemText, styles.menuItemDangerText]}>通報する</Text>
              </Pressable>
            )}
          </View>
        )}

        {showReport && (
          <View style={styles.reportPanel}>
            <Text style={styles.reportTitle}>通報理由を選択</Text>
            {REPORT_REASONS.map((r) => (
              <Pressable key={r.value} style={styles.reportOption} onPress={() => onReport(r.value)}>
                <Text style={styles.reportOptionText}>{r.label}</Text>
              </Pressable>
            ))}
          </View>
        )}

        {showDeleteConfirm && (
          <View style={styles.reportPanel}>
            <Text style={styles.reportTitle}>この投稿を削除しますか？</Text>
            <Text style={styles.deleteConfirmDesc}>削除すると元に戻せません。写真や説明文もすべて削除されます。</Text>
            <View style={styles.deleteConfirmRow}>
              <Pressable
                style={styles.deleteCancelButton}
                onPress={() => setShowDeleteConfirm(false)}
                disabled={deleting}
              >
                <Text style={styles.deleteCancelText}>キャンセル</Text>
              </Pressable>
              <Pressable
                style={styles.deleteConfirmButton}
                onPress={onDelete}
                disabled={deleting}
              >
                {deleting ? (
                  <ActivityIndicator color="#fff" size="small" />
                ) : (
                  <Text style={styles.deleteConfirmButtonText}>削除する</Text>
                )}
              </Pressable>
            </View>
          </View>
        )}
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.accent },
  scrollContent: { alignItems: 'center' },
  contentWrapper: { width: '100%' },
  center: {
    flex: 1,
    backgroundColor: colors.accent,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  image: {},
  // SNS埋め込み(Instagram/X)も画像と同じ横スライドの中で扱うための枠。
  // カルーセルの高さ自体を埋め込みの実測高さに合わせて広げているため、
  // 通常はここでクリップされることはない(overflow:hiddenは計測が届く前の一瞬の保険)。
  // 他のスライド(画像や、より縦長の別の埋め込み)に合わせて枠の方が高くなった場合は
  // 埋め込みを縦中央に配置する。
  embedSlide: { backgroundColor: colors.background, overflow: 'hidden', justifyContent: 'center' },
  body: { padding: 20, backgroundColor: colors.accent },
  metaRow: { flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', gap: 8 },
  meta: { fontSize: 13, color: colors.accentTextMuted },
  authorText: { fontSize: 13, color: colors.accentText, fontWeight: '600' },
  tagRow: { flexDirection: 'row', flexWrap: 'wrap', marginTop: 14, gap: 8 },
  tagChip: {
    backgroundColor: colors.background,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    marginRight: 8,
    marginBottom: 8,
  },
  tagChipText: { color: colors.accent, fontSize: 12, fontWeight: '600' },
  description: { fontSize: 15, color: colors.accentText, marginTop: 16, lineHeight: 22 },
  actionRow: {
    flexDirection: 'row',
    marginTop: 24,
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  iconButtonsRow: { flexDirection: 'row', gap: 18 },
  iconButton: { padding: 2 },
  iconButtonWithCount: { flexDirection: 'row', alignItems: 'center', gap: 4, padding: 2 },
  iconCountText: { color: colors.accentText, fontSize: 13, fontWeight: '600' },
  menuButton: { padding: 6 },
  menuPanel: {
    marginTop: 10,
    backgroundColor: colors.background,
    borderRadius: 12,
    overflow: 'hidden',
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 16,
    paddingVertical: 13,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  menuItemLast: { borderBottomWidth: 0 },
  menuItemText: { color: colors.textPrimary, fontSize: 14, fontWeight: '600' },
  menuItemDangerText: { color: colors.danger },
  reportPanel: { marginTop: 16, backgroundColor: colors.background, borderRadius: 12, padding: 16 },
  reportTitle: { color: colors.textPrimary, fontWeight: '600', marginBottom: 10 },
  reportOption: { paddingVertical: 10 },
  reportOptionText: { color: colors.textSecondary, fontSize: 14 },
  deleteConfirmDesc: { color: colors.textSecondary, fontSize: 13, lineHeight: 19, marginBottom: 16 },
  deleteConfirmRow: { flexDirection: 'row', gap: 10 },
  deleteCancelButton: {
    flex: 1,
    borderRadius: 10,
    paddingVertical: 12,
    alignItems: 'center',
    backgroundColor: colors.surface,
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
