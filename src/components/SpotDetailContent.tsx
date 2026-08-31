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
import { spotImageUrl, spotImageThumbUrl } from '../lib/spots';
import { shareSpot, copyLink } from '../lib/share';
import { colors } from '../lib/theme';
import type { Spot, SpotImage, SpotEmbed, SpotReview, ReportReason } from '../types/database';

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

// メディアカルーセルを「ピーク表示」(隣のスライドが少しだけ見える)にするための余白。
// MEDIA_PEEKが各スライドの左右の隙間、MEDIA_GAPがスライド間の間隔。
// MEDIA_PEEK > MEDIA_GAP にすることで、隣のスライドの端が (MEDIA_PEEK - MEDIA_GAP) 分だけ覗く。
const MEDIA_PEEK = 24;
const MEDIA_GAP = 10;

// 縦長画像やリール埋め込みなど、カルーセルの必要な高さが非常に大きくなるケース向けの上限。
// 画面高さに対する比率で決め、開いた瞬間に本文の冒頭も見える程度の余白を残す。
const MAX_MEDIA_HEIGHT_RATIO = 0.55;

// おすすめの訪問時間帯(DBには英語キーで保存)の表示ラベル
const VISIT_TIME_LABELS: Record<string, string> = {
  morning: '朝',
  daytime: '昼',
  dusk: '夕方',
  night: '夜',
};

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
  onEdit?: () => void;
  onDelete?: () => void;
  deleting?: boolean;
  // 上に重なる固定ヘッダー(AppHeader)の高さ分だけ、先頭のメディアが隠れないよう空ける余白。
  // フル画面の詳細画面でのみ指定し、プレビューシート側は0のまま(独自のハンドルバーがある)。
  topInset?: number;
  // ホームインジケーターなど下部の安全領域分の余白。フル画面の詳細画面でのみ指定し、
  // 末尾の「みんなの投稿」セクションが画面下端で見切れてスクロールしきれなくなるのを防ぐ。
  bottomInset?: number;
  // 「みんなの投稿」セクション(既存スポットへの他ユーザーによるレビュー投稿)。
  // 未ログイン時などonAddReviewを渡さない場合は投稿ボタンを表示しない。
  reviews?: SpotReview[];
  reviewsLoading?: boolean;
  currentUserId?: string;
  onAddReview?: () => void;
  onDeleteReview?: (review: SpotReview) => void;
  onReportReview?: (review: SpotReview, reason: ReportReason) => void;
};

function formatReviewDate(iso: string): string {
  try {
    return new Date(iso).toLocaleDateString('ja-JP', { year: 'numeric', month: 'short', day: 'numeric' });
  } catch {
    return '';
  }
}

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
  onEdit,
  onDelete,
  deleting = false,
  topInset = 0,
  bottomInset = 0,
  reviews = [],
  reviewsLoading = false,
  currentUserId,
  onAddReview,
  onDeleteReview,
  onReportReview,
}: Props) {
  const { width: screenWidth, height: screenHeight } = useWindowDimensions();
  // PCなど横幅の広い画面では、画像や本文が横に間延びしないよう最大幅で中央寄せする。
  const contentWidth = Math.min(screenWidth, MAX_CONTENT_WIDTH);
  // 各スライドの実際の幅。両端にMEDIA_PEEK分の隙間を作ることで、
  // 隣にもスライドがあることがひと目でわかるようにする。
  const mediaItemWidth = Math.max(contentWidth - MEDIA_PEEK * 2, 0);
  const [showMenu, setShowMenu] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  // 現在表示中のメディア(画像/SNS埋め込み)のインデックス。下のドットインジケーターに使う。
  const [activeMediaIndex, setActiveMediaIndex] = useState(0);
  // 先頭画像の縦横比（高さ÷幅）。取得できるまではimageHeightのデフォルト値で表示する。
  const [imageAspectRatio, setImageAspectRatio] = useState<number | null>(null);
  // SNS埋め込み(Instagram/X)ごとの実測高さ(embed.idをキーに保持)。
  // ウィジェット全体が見切れないよう、カルーセルの高さはこれらの最大値を含めて決める。
  const [embedHeights, setEmbedHeights] = useState<Record<string, number>>({});
  // 通報理由パネルを開いているレビューのID(一度に1件のみ開ける)
  const [reportingReviewId, setReportingReviewId] = useState<string | null>(null);

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
    setActiveMediaIndex(0);
  }, [spot?.id]);

  // 画像側の希望の高さ。縦横比が判明していれば、上下がカットされないよう実寸に合わせる。
  // 極端に縦長な場合はMAX_IMAGE_ASPECT_RATIOを超えないようクランプし、その分だけカットする。
  // 画像が1枚もない場合はSNS埋め込み(Instagram/X)の高さだけで決まるので0として扱う。
  const baseImageHeight =
    sortedImages.length === 0
      ? 0
      : imageAspectRatio
        ? Math.min(mediaItemWidth * imageAspectRatio, mediaItemWidth * MAX_IMAGE_ASPECT_RATIO)
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
  // ただし、縦長画像やリール埋め込みなどでこの値が非常に大きくなる場合、開いた瞬間に
  // ほぼメディアだけで画面が埋まってしまうため、画面高さに対する上限でクランプする
  // (はみ出た分は中央基準でカットされるだけで、下にスクロールすれば見える)。
  const rawDisplayedHeight = mediaItems.length === 0 ? imageHeight : Math.max(baseImageHeight, maxEmbedHeight);
  const displayedImageHeight =
    mediaItems.length === 0 ? rawDisplayedHeight : Math.min(rawDisplayedHeight, screenHeight * MAX_MEDIA_HEIGHT_RATIO);

  if (loading || !spot) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color={colors.accentText} />
      </View>
    );
  }

  // 投稿者がGoogleマップのリンクを指定していればそちらを優先し、
  // 未指定の場合は従来通り緯度経度から生成したリンクを開く
  const openInGoogleMaps = () => {
    const url = spot.google_maps_url || `https://www.google.com/maps/search/?api=1&query=${spot.lat},${spot.lng}`;
    Linking.openURL(url).catch(() => {});
  };

  // Appleの審査ガイドライン4(位置情報機能はネイティブの地図アプリも起動できる
  // 選択肢を用意する必要がある)への対応。maps.apple.comのURLはiOS上では
  // Apple Mapsアプリが直接開く(Universal Link)。Android/Web版ではApple Maps
  // アプリ自体が存在しないため、iOSの時だけボタンを表示する。
  const openInAppleMaps = () => {
    const label = encodeURIComponent(spot.title || 'LIMap');
    const url = `https://maps.apple.com/?ll=${spot.lat},${spot.lng}&q=${label}`;
    Linking.openURL(url).catch(() => {});
  };

  const handleShare = () => shareSpot(spot.title, spot.slug);
  const handleCopyLink = () => copyLink(spot.slug);

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={[
        styles.scrollContent,
        topInset ? { paddingTop: topInset } : null,
        { paddingBottom: 32 + bottomInset },
      ]}
      scrollEnabled={scrollEnabled}
      onScroll={onScroll}
      scrollEventThrottle={16}
    >
      <View style={[styles.contentWrapper, { maxWidth: MAX_CONTENT_WIDTH }]}>
        {mediaItems.length > 0 && (
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            decelerationRate="fast"
            snapToInterval={mediaItemWidth + MEDIA_GAP}
            snapToAlignment="start"
            // 1回のスワイプで複数枚分スクロールしてしまうことがないようにし、
            // 必ず1枚単位でぴったり止まる(中途半端な位置で止まらない)ようにする。
            disableIntervalMomentum
            onScroll={(e) => {
              const x = e.nativeEvent.contentOffset.x;
              const index = Math.round(x / (mediaItemWidth + MEDIA_GAP));
              const clamped = Math.max(0, Math.min(mediaItems.length - 1, index));
              setActiveMediaIndex((prev) => (prev === clamped ? prev : clamped));
            }}
            scrollEventThrottle={16}
            style={{ width: contentWidth }}
            contentContainerStyle={{ paddingHorizontal: MEDIA_PEEK }}
          >
            {mediaItems.map((item, index) => {
              const isLast = index === mediaItems.length - 1;
              const itemStyle = {
                width: mediaItemWidth,
                height: displayedImageHeight,
                marginRight: isLast ? 0 : MEDIA_GAP,
              };
              if (item.kind === 'image') {
                return (
                  <Image
                    key={`image-${item.image.id}`}
                    source={{ uri: spotImageUrl(item.image.storage_path) }}
                    style={[styles.image, itemStyle]}
                    // "cover"だと箱の縦横比に合わせて上下(または左右)が切れてしまうため、
                    // 画像全体が必ず収まる"contain"にする。余白は画像自体の余白としてではなく
                    // このスライドの背景色(黄色)がそのまま見えるだけなので違和感は出ない。
                    resizeMode="contain"
                  />
                );
              }

              // SNS埋め込み(Instagram/X)は実測の自然な高さ(naturalHeight)を持つが、
              // カルーセルの共有高さ(displayedImageHeight、画面高さで上限クランプ済み)より
              // 高い場合、そのままではみ出た分がクリップされ見切れてしまう。
              // そこで、はみ出るケースだけ自然なサイズのまま描画したうえで縦横比を保ったまま
              // 均一に縮小(scale)し、共有高さの枠内に必ず収まるようにする。
              const naturalHeight = embedHeights[item.embed.id] ?? EMBED_FALLBACK_HEIGHT;
              const embedScale = naturalHeight > displayedImageHeight ? displayedImageHeight / naturalHeight : 1;
              return (
                <View key={`embed-${item.embed.id}`} style={[styles.embedSlide, itemStyle]}>
                  <View style={{ width: mediaItemWidth, height: naturalHeight, transform: [{ scale: embedScale }] }}>
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
                </View>
              );
            })}
          </ScrollView>
        )}

        {/* Instagramの投稿と同じように、何枚あるか・今どれを見ているかをドットで伝える */}
        {mediaItems.length > 1 && (
          <View style={styles.dotsRow}>
            {mediaItems.map((_, i) => (
              <View key={i} style={[styles.dot, i === activeMediaIndex && styles.dotActive]} />
            ))}
          </View>
        )}

        <View style={styles.body}>
          {spot.title && <Text style={styles.titleText}>{spot.title}</Text>}

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

        {spot.access && (
          <View style={styles.accessBox}>
            <Text style={styles.accessLabel}>アクセス</Text>
            <Text style={styles.accessText}>{spot.access}</Text>
          </View>
        )}

        {spot.recommended_visit_time && (
          <View style={styles.accessBox}>
            <Text style={styles.accessLabel}>おすすめの訪問時間帯</Text>
            <Text style={styles.accessText}>
              {VISIT_TIME_LABELS[spot.recommended_visit_time] ?? spot.recommended_visit_time}
            </Text>
          </View>
        )}

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

        {/* アイコンだけだと何のボタンか判断しづらいとの指摘があったため、
            よく使われるGoogleマップ導線だけは文字付きの単独ボタンにする。
            iOSでは、Appleの審査ガイドライン4(位置情報機能はサードパーティの地図アプリのみに
            限定せず、ネイティブのApple Mapsアプリも起動できる選択肢を用意すること)に対応するため、
            Apple Mapsで開くボタンも並べて表示する(Android/Web版にはApple Mapsアプリ自体が
            存在しないため表示しない)。 */}
        <View style={styles.mapsButtonRow}>
          <Pressable style={styles.mapsButton} onPress={openInGoogleMaps} hitSlop={6}>
            <Ionicons name="navigate-outline" size={16} color={colors.accent} />
            <Text style={styles.mapsButtonText}>Googleマップで見る</Text>
          </Pressable>
          {Platform.OS === 'ios' && (
            <Pressable style={styles.mapsButton} onPress={openInAppleMaps} hitSlop={6}>
              <Ionicons name="map-outline" size={16} color={colors.accent} />
              <Text style={styles.mapsButtonText}>Appleマップで見る</Text>
            </Pressable>
          )}
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
            {isOwner && onEdit && (
              <Pressable
                style={styles.menuItem}
                onPress={() => {
                  setShowMenu(false);
                  onEdit();
                }}
              >
                <Ionicons name="create-outline" size={18} color={colors.textPrimary} />
                <Text style={styles.menuItemText}>編集する</Text>
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

        {/* 「みんなの投稿」: 他ユーザーがこのスポットに追加したレビュー(写真・SNS埋め込み・
            コメント・訪問時間帯)を本文の下に一覧で並べる。onAddReviewが渡っている場合のみ
            投稿ボタンを表示する(未ログイン時は親側でボタンごと出し分ける想定)。 */}
        <View style={styles.reviewsSection}>
          <View style={styles.reviewsHeaderRow}>
            <Text style={styles.reviewsHeading}>
              みんなの投稿{reviews.length > 0 ? `(${reviews.length})` : ''}
            </Text>
            {onAddReview && (
              <Pressable style={styles.addReviewButton} onPress={onAddReview} hitSlop={6}>
                <Ionicons name="add" size={15} color={colors.accent} />
                <Text style={styles.addReviewButtonText}>投稿を追加</Text>
              </Pressable>
            )}
          </View>

          {reviewsLoading ? (
            <ActivityIndicator color={colors.background} style={{ marginTop: 14 }} />
          ) : reviews.length === 0 ? (
            <Text style={styles.reviewsEmptyText}>
              まだ投稿がありません。最初の投稿を追加してみましょう。
            </Text>
          ) : (
            reviews.map((review) => {
              const reviewMedia = [
                ...(review.images ?? []).map((img) => ({
                  key: `img-${img.id}`,
                  uri: spotImageThumbUrl(img),
                  url: null as string | null,
                })),
                ...(review.embeds ?? [])
                  .filter((e) => e.thumbnail_url)
                  .map((e) => ({ key: `embed-${e.id}`, uri: e.thumbnail_url as string, url: e.url })),
              ];
              return (
                <View key={review.id} style={styles.reviewCard}>
                  <View style={styles.reviewHeaderRow}>
                    {review.author?.username ? (
                      <UsernameWithBadge
                        username={review.author.username}
                        badge={review.author.badge}
                        textStyle={styles.reviewAuthorText}
                      />
                    ) : (
                      <View />
                    )}
                    <Text style={styles.reviewDate}>{formatReviewDate(review.created_at)}</Text>
                  </View>

                  {review.recommended_visit_time && (
                    <Text style={styles.reviewVisitTime}>
                      おすすめ: {VISIT_TIME_LABELS[review.recommended_visit_time] ?? review.recommended_visit_time}
                    </Text>
                  )}

                  {reviewMedia.length > 0 && (
                    <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.reviewMediaRow}>
                      {reviewMedia.map((m) =>
                        m.url ? (
                          <Pressable key={m.key} onPress={() => Linking.openURL(m.url!).catch(() => {})}>
                            <Image source={{ uri: m.uri }} style={styles.reviewImage} />
                          </Pressable>
                        ) : (
                          <Image key={m.key} source={{ uri: m.uri }} style={styles.reviewImage} />
                        )
                      )}
                    </ScrollView>
                  )}

                  {review.description && <Text style={styles.reviewDescription}>{review.description}</Text>}

                  {currentUserId && review.author_id === currentUserId && onDeleteReview && (
                    <Pressable style={styles.reviewDeleteButton} onPress={() => onDeleteReview(review)} hitSlop={6}>
                      <Text style={styles.reviewDeleteText}>削除する</Text>
                    </Pressable>
                  )}

                  {(!currentUserId || review.author_id !== currentUserId) && onReportReview && (
                    <Pressable
                      style={styles.reviewDeleteButton}
                      onPress={() => setReportingReviewId((id) => (id === review.id ? null : review.id))}
                      hitSlop={6}
                    >
                      <Text style={styles.reviewReportText}>通報する</Text>
                    </Pressable>
                  )}

                  {reportingReviewId === review.id && onReportReview && (
                    <View style={styles.reviewReportPanel}>
                      <Text style={styles.reportTitle}>通報理由を選択</Text>
                      {REPORT_REASONS.map((r) => (
                        <Pressable
                          key={r.value}
                          style={styles.reportOption}
                          onPress={() => {
                            onReportReview(review, r.value);
                            setReportingReviewId(null);
                          }}
                        >
                          <Text style={styles.reportOptionText}>{r.label}</Text>
                        </Pressable>
                      ))}
                    </View>
                  )}
                </View>
              );
            })
          )}
        </View>
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
  // resizeMode="contain"で画像の縦横比を保ったまま表示するため、箱の縦横比と合わない場合に
  // 余白ができる。この余白がスライドの黄色い背景と同じ色になるよう明示しておく。
  image: { borderRadius: 14, backgroundColor: colors.accent },
  // SNS埋め込み(Instagram/X)も画像と同じ横スライドの中で扱うための枠。
  // カルーセルの高さ自体を埋め込みの実測高さに合わせて広げているため、
  // 通常はここでクリップされることはない(overflow:hiddenは計測が届く前の一瞬の保険)。
  // 他のスライド(画像や、より縦長の別の埋め込み)に合わせて枠の方が高くなった場合は
  // 埋め込みを縦中央に配置する。背景は詳細画面の黄色と揃え、余白部分が別の色に
  // 見えてしまわないようにする。
  embedSlide: { backgroundColor: colors.accent, overflow: 'hidden', justifyContent: 'center', borderRadius: 14 },
  dotsRow: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 6, marginTop: 10 },
  dot: { width: 6, height: 6, borderRadius: 3, backgroundColor: colors.accentTextMuted },
  dotActive: { backgroundColor: colors.accentText },
  body: { padding: 20, backgroundColor: colors.accent },
  titleText: { fontSize: 20, fontWeight: '700', color: colors.accentText, marginBottom: 8 },
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
  // colors.background(暗い色)を背景にする箱なので、文字色は黄色背景用の
  // accentText系ではなく、暗い背景の上で読める明るい色を使う
  accessBox: {
    marginTop: 16,
    padding: 12,
    borderRadius: 10,
    backgroundColor: colors.background,
  },
  accessLabel: { fontSize: 12, fontWeight: '700', color: colors.accent, marginBottom: 4 },
  accessText: { fontSize: 14, color: colors.textPrimary, lineHeight: 20 },
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
  mapsButtonRow: { flexDirection: 'row', gap: 10, marginTop: 12 },
  mapsButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 10,
    borderRadius: 10,
    backgroundColor: colors.background,
  },
  mapsButtonText: { color: colors.accent, fontSize: 13, fontWeight: '600' },
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
  reviewsSection: {
    marginTop: 32,
    paddingTop: 20,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0,0,0,0.12)',
  },
  reviewsHeaderRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  reviewsHeading: { color: colors.accentText, fontSize: 15, fontWeight: '700' },
  addReviewButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: colors.background,
    borderRadius: 999,
    paddingVertical: 6,
    paddingHorizontal: 12,
  },
  addReviewButtonText: { color: colors.accent, fontSize: 12.5, fontWeight: '700' },
  reviewsEmptyText: { color: colors.accentTextMuted, fontSize: 13, marginTop: 14, lineHeight: 19 },
  reviewCard: {
    backgroundColor: colors.background,
    borderRadius: 12,
    padding: 14,
    marginTop: 14,
  },
  reviewHeaderRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  reviewAuthorText: { fontSize: 13, color: colors.accent, fontWeight: '700' },
  reviewDate: { fontSize: 11, color: colors.textMuted },
  reviewVisitTime: { fontSize: 12, color: colors.accent, marginTop: 6, fontWeight: '600' },
  reviewMediaRow: { marginTop: 10 },
  reviewImage: { width: 96, height: 96, borderRadius: 8, marginRight: 8, backgroundColor: colors.surfaceAlt },
  reviewDescription: { fontSize: 13.5, color: colors.textPrimary, lineHeight: 19, marginTop: 10 },
  reviewDeleteButton: { marginTop: 10, alignSelf: 'flex-start' },
  reviewReportText: { color: colors.textMuted, fontSize: 12, textDecorationLine: 'underline' },
  reviewReportPanel: {
    marginTop: 10,
    backgroundColor: colors.surfaceAlt,
    borderRadius: 8,
    padding: 12,
  },
  reviewDeleteText: { color: colors.danger, fontSize: 12, fontWeight: '600' },
});
