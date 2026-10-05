import React, { useEffect, useRef, useState } from 'react';
import {
  Animated,
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
import { MAPBOX_ACCESS_TOKEN } from '@env';
import Text from './AppText';
import { UsernameWithBadge } from './UserBadge';
import InstagramEmbed from './InstagramEmbed';
import XEmbed from './XEmbed';
import PixelDoor from './PixelDoor';
import VerticalFade from './VerticalFade';
import { spotImageUrl, spotImageThumbUrl, spotThumbnailUrl } from '../lib/spots';
import { shareSpot, copyLink } from '../lib/share';
import { colors, radius, space, type } from '../lib/theme';
import { useLanguage, useTranslation } from '../lib/i18n';
import { spotPlace } from '../content/spotSeo';
import { prefectureFullName } from '../content/japan';
import type { Spot, SpotEmbed, SpotReview, ReportReason } from '../types/database';

// PC/Web表示時に画像・本文が横に広がりすぎないようにする最大幅。
const MAX_CONTENT_WIDTH = 640;

// 先頭の写真は画面の端から端まで大きく見せる。高さは先頭画像の縦横比に合わせつつ、
// 横長すぎ・縦長すぎの写真でも極端な高さにならないよう、横幅に対する比率で上下限を付ける。
const MIN_HERO_RATIO = 0.6;
const MAX_HERO_RATIO = 1.25;
// 開いた瞬間にタイトルも少し見えるよう、画面の高さに対しても上限を付ける
const MAX_HERO_SCREEN_RATIO = 0.6;

// SNS埋め込み(Instagram/X)の実測高さがまだ届いていない間の仮の高さ。
// react-native-webview版のDEFAULT_HEIGHTと合わせておく。
const EMBED_FALLBACK_HEIGHT = 420;

// 通報理由の表示順。ラベルは i18n の spotDetail.reportReasons
const REPORT_REASONS: ReportReason[] = ['privacy', 'wrong_location', 'inappropriate', 'spam', 'other'];

// 戻る・共有ボタンや写真の枚数表示の下地（黄色背景の墨色を半透明にしたもの）
const OVERLAY_BG = 'rgba(29,27,14,0.72)';

// 画面上部に重ねるヘッダー（戻る・ロゴ・共有）の高さ。ステータスバーの高さは含まない
export const SPOT_HEADER_HEIGHT = 56;
// 下へスクロールしてからヘッダーを隠すまでの待ち時間(ms)。すぐ消えると落ち着かないため少し遅らせる
const HEADER_HIDE_DELAY = 350;
// これより小さいスクロール量は、指の揺れとみなしてヘッダーの表示を切り替えない
const HEADER_SCROLL_THRESHOLD = 4;

export type NearbySpot = Spot & { distanceKm: number };

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
  onBack?: () => void;
  // ヘッダーのロゴをタップしたとき（このスポットを中心にした地図へ戻る）
  onLogoPress?: () => void;
  onViewOnMap?: () => void;
  onTagPress?: (tagId: number) => void;
  onAuthorPress?: (userId: string) => void;
  isOwner?: boolean;
  onEdit?: () => void;
  onDelete?: () => void;
  deleting?: boolean;
  // ステータスバーの高さ分。固定ヘッダーをその下に置く
  topInset?: number;
  // ホームインジケーターなど下部の安全領域分の余白。
  // 末尾の「みんなの投稿」セクションが画面下端で見切れてスクロールしきれなくなるのを防ぐ。
  bottomInset?: number;
  // 「近くのリミナルスペース」に並べるスポット（近い順）
  nearbySpots?: NearbySpot[];
  onSpotPress?: (slug: string) => void;
  // 「みんなの投稿」セクション(既存スポットへの他ユーザーによるレビュー投稿)。
  // 未ログイン時などonAddReviewを渡さない場合は投稿ボタンを表示しない。
  reviews?: SpotReview[];
  reviewsLoading?: boolean;
  currentUserId?: string;
  onAddReview?: () => void;
  onDeleteReview?: (review: SpotReview) => void;
  onReportReview?: (review: SpotReview, reason: ReportReason) => void;
};

function formatReviewDate(iso: string, locale: string): string {
  try {
    return new Date(iso).toLocaleDateString(locale, { year: 'numeric', month: 'short', day: 'numeric' });
  } catch {
    return '';
  }
}

function formatDistance(km: number): string {
  return km < 1 ? `${Math.round(km * 100) * 10} m` : `${km.toFixed(1)} km`;
}

// 位置を示す小さな地図（Mapbox Static Images API の画像。表示するだけで保存はしない）
function staticMapUrl(lat: number, lng: number): string {
  const pin = `pin-l+dece32(${lng},${lat})`;
  return `https://api.mapbox.com/styles/v1/mapbox/dark-v11/static/${pin}/${lng},${lat},14,0/640x300@2x?access_token=${MAPBOX_ACCESS_TOKEN}`;
}

// スポット詳細の中身。黄色の地に、端から端までの写真・タイトル・場所の地図・近くのスポット・
// みんなの投稿を縦に並べる。
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
  onBack,
  onLogoPress,
  onViewOnMap,
  onTagPress,
  onAuthorPress,
  isOwner = false,
  onEdit,
  onDelete,
  deleting = false,
  topInset = 0,
  bottomInset = 0,
  nearbySpots = [],
  onSpotPress,
  reviews = [],
  reviewsLoading = false,
  currentUserId,
  onAddReview,
  onDeleteReview,
  onReportReview,
}: Props) {
  const t = useTranslation().spotDetail;
  const { language } = useLanguage();
  // 英語表示のときは、公式スポットの英語の説明文があればそちらを出す（ユーザーの投稿文は翻訳しない）
  const description = (language === 'en' && spot?.description_en) || spot?.description;
  // おすすめの訪問時間帯はDBに英語キーで保存されている。未知の値はそのまま表示する
  const visitTimeLabel = (key: string) => (t.visitTimes as Record<string, string>)[key] ?? key;
  const { width: screenWidth, height: screenHeight } = useWindowDimensions();
  // PCなど横幅の広い画面では、画像や本文が横に間延びしないよう最大幅で中央寄せする。
  const contentWidth = Math.min(screenWidth, MAX_CONTENT_WIDTH);
  const [showMenu, setShowMenu] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  // 表示中の写真・SNS埋め込みの番号。「1 / 3」の表示に使う。
  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const [activeEmbedIndex, setActiveEmbedIndex] = useState(0);
  // 先頭画像の縦横比（高さ÷幅）。取得できるまでは仮の高さで表示する。
  const [imageAspectRatio, setImageAspectRatio] = useState<number | null>(null);
  // SNS埋め込み(Instagram/X)ごとの実測高さ(embed.idをキーに保持)。
  const [embedHeights, setEmbedHeights] = useState<Record<string, number>>({});
  // 通報理由パネルを開いているレビューのID(一度に1件のみ開ける)
  const [reportingReviewId, setReportingReviewId] = useState<string | null>(null);

  // ヘッダーの表示・非表示。下へスクロールすると少し遅れて消え、上へ戻すとすぐ出る
  const [headerVisible, setHeaderVisible] = useState(true);
  // 一番上から離れているか。離れているときだけ、ヘッダーの後ろに黄色のぼかしを敷いて
  // ロゴ・ボタン・ステータスバーが本文の文字と重ならないようにする（一番上では透明のまま）
  const [scrolledDown, setScrolledDown] = useState(false);
  const headerAnim = useRef(new Animated.Value(1)).current;
  const lastScrollY = useRef(0);
  const hideTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    Animated.timing(headerAnim, {
      toValue: headerVisible ? 1 : 0,
      duration: 220,
      useNativeDriver: Platform.OS !== 'web',
    }).start();
  }, [headerVisible, headerAnim]);

  useEffect(
    () => () => {
      if (hideTimer.current) clearTimeout(hideTimer.current);
    },
    []
  );

  const showHeader = () => {
    if (hideTimer.current) {
      clearTimeout(hideTimer.current);
      hideTimer.current = null;
    }
    setHeaderVisible(true);
  };

  const onMainScroll = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const y = e.nativeEvent.contentOffset.y;
    const dy = y - lastScrollY.current;
    lastScrollY.current = y;
    const away = y > SPOT_HEADER_HEIGHT;
    setScrolledDown((prev) => (prev === away ? prev : away));
    // 一番上付近では常に表示する
    if (y <= SPOT_HEADER_HEIGHT) {
      showHeader();
      return;
    }
    if (dy > HEADER_SCROLL_THRESHOLD) {
      if (!hideTimer.current) {
        hideTimer.current = setTimeout(() => {
          hideTimer.current = null;
          setHeaderVisible(false);
        }, HEADER_HIDE_DELAY);
      }
    } else if (dy < -HEADER_SCROLL_THRESHOLD) {
      showHeader();
    }
  };

  const sortedImages = spot?.images ? [...spot.images].sort((a, b) => a.position - b.position) : [];
  const sortedEmbeds = spot?.embeds
    ? [...spot.embeds]
        .filter((e) => e.platform === 'instagram' || e.platform === 'x')
        .sort((a, b) => a.position - b.position)
    : [];
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

  // スポットが切り替わったら、前のスポットの状態を引き継がない
  useEffect(() => {
    setEmbedHeights({});
    setActiveImageIndex(0);
    setActiveEmbedIndex(0);
    setShowMenu(false);
    setShowDeleteConfirm(false);
  }, [spot?.id]);

  // 写真の高さ。先頭画像の縦横比に合わせつつ、上下限を付ける
  const maxHeroHeight = Math.min(contentWidth * MAX_HERO_RATIO, screenHeight * MAX_HERO_SCREEN_RATIO);
  const heroHeight = Math.max(
    contentWidth * MIN_HERO_RATIO,
    Math.min(contentWidth * (imageAspectRatio ?? 0.75), maxHeroHeight)
  );

  // 画面上部に重ねるヘッダー。背景は透明で、ロゴとボタンだけを置く。
  // スクロール領域の外に重ねることで、中身と一緒に流れず決まった位置に留まる
  const header = (
    <Animated.View
      style={[
        styles.header,
        {
          pointerEvents: headerVisible ? 'box-none' : 'none',
          paddingTop: topInset,
          height: topInset + SPOT_HEADER_HEIGHT,
          opacity: headerAnim,
          transform: [{ translateY: headerAnim.interpolate({ inputRange: [0, 1], outputRange: [-16, 0] }) }],
        },
      ]}
    >
      {scrolledDown && (
        <VerticalFade
          height={topInset + SPOT_HEADER_HEIGHT + space.xl}
          rgb={[222, 206, 50]}
          maxOpacity={0.96}
          solidUntil={0.7}
        />
      )}
      <View style={[styles.headerRow, { maxWidth: MAX_CONTENT_WIDTH }, { pointerEvents: 'box-none' }]}>
        {onBack ? (
          <Pressable style={styles.headerButton} onPress={onBack} hitSlop={6} accessibilityRole="button" accessibilityLabel={t.back}>
            <Ionicons name="chevron-back" size={22} color={colors.accent} />
          </Pressable>
        ) : (
          <View style={styles.headerButtonSpacer} />
        )}
        <Pressable onPress={onLogoPress} disabled={!onLogoPress} hitSlop={6}>
          <Image source={require('../../assets/logo-header-dark.png')} style={styles.headerLogo} resizeMode="contain" />
        </Pressable>
        {spot ? (
          <Pressable
            style={styles.headerButton}
            onPress={() => shareSpot(spot.title, spot.slug)}
            hitSlop={6}
            accessibilityRole="button"
            accessibilityLabel={t.share}
          >
            <Ionicons name="share-social-outline" size={20} color={colors.accent} />
          </Pressable>
        ) : (
          <View style={styles.headerButtonSpacer} />
        )}
      </View>
    </Animated.View>
  );

  if (loading || !spot) {
    return (
      <View style={styles.container}>
        <View style={styles.center}>
          <ActivityIndicator color={colors.accentText} />
        </View>
        {header}
      </View>
    );
  }

  // 投稿者がGoogleマップのリンクを指定していればそちらを優先し、
  // 未指定の場合は緯度経度から経路案内のリンクを作って開く
  const openInGoogleMaps = () => {
    const url = spot.google_maps_url || `https://www.google.com/maps/dir/?api=1&destination=${spot.lat},${spot.lng}`;
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

  const handleCopyLink = () => copyLink(spot.slug);

  // パンくず（日本 › 東京都 / 海外 › アメリカ）。タグが付いていればタップでそのタグの一覧へ
  const tags = spot.tags ?? [];
  const tagNames = tags.map((tag) => tag.name);
  const place = spotPlace(tagNames, spot.city, spot.country);
  const tagByName = (name: string) => tags.find((tag) => tag.name === name);
  const crumbs: { label: string; tagId?: number }[] =
    place.prefectures.length > 0
      ? [
          { label: '日本', tagId: tagByName('日本')?.id },
          ...place.prefectures.map((p) => ({ label: prefectureFullName(p), tagId: tagByName(p)?.id })),
        ]
      : place.country
        ? [
            ...(tagByName('海外') ? [{ label: '海外', tagId: tagByName('海外')?.id }] : []),
            { label: place.country, tagId: tagByName(place.country)?.id },
          ]
        : [];

  const author = spot.author;
  const authorInitial = (author?.display_name || author?.username || '?').slice(0, 1);

  // SNS埋め込み(Instagram/X)。埋め込みは投稿者名・本文・画像が一体になったカードなので、
  // 写真のように端から端へは広げず、左右に余白を取ったブロックとして置く。
  // 複数ある場合は横にめくれるようにし、枠の高さは表示中の埋め込みの実測高さに合わせる。
  const embedWidth = contentWidth - 40;
  const activeEmbed = sortedEmbeds[Math.min(activeEmbedIndex, sortedEmbeds.length - 1)];
  const embedBoxHeight = activeEmbed ? (embedHeights[activeEmbed.id] ?? EMBED_FALLBACK_HEIGHT) : 0;
  const renderEmbed = (embed: SpotEmbed) => {
    const onHeightChange = (height: number) =>
      setEmbedHeights((prev) => (prev[embed.id] === height ? prev : { ...prev, [embed.id]: height }));
    return embed.platform === 'instagram' ? (
      <InstagramEmbed url={embed.url} onHeightChange={onHeightChange} />
    ) : (
      <XEmbed url={embed.url} onHeightChange={onHeightChange} />
    );
  };
  const embedsBlock =
    sortedEmbeds.length === 0 ? null : sortedEmbeds.length === 1 ? (
      <View style={[styles.embedsBlock, { width: embedWidth }]}>{renderEmbed(sortedEmbeds[0])}</View>
    ) : (
      <View style={[styles.embedsBlock, { width: embedWidth }]}>
        <ScrollView
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          onScroll={(e) => {
            const index = Math.round(e.nativeEvent.contentOffset.x / embedWidth);
            const clamped = Math.max(0, Math.min(sortedEmbeds.length - 1, index));
            setActiveEmbedIndex((prev) => (prev === clamped ? prev : clamped));
          }}
          scrollEventThrottle={16}
          style={{ width: embedWidth, height: embedBoxHeight }}
          contentContainerStyle={{ alignItems: 'flex-start' }}
        >
          {sortedEmbeds.map((embed) => (
            <View key={embed.id} style={{ width: embedWidth }}>
              {renderEmbed(embed)}
            </View>
          ))}
        </ScrollView>
        <View style={styles.embedPager}>
          {sortedEmbeds.map((embed, i) => (
            <View key={embed.id} style={[styles.dot, i === activeEmbedIndex && styles.dotActive]} />
          ))}
          <Text style={styles.embedPagerText}>
            {t.photoCounter
              .replace('{index}', String(activeEmbedIndex + 1))
              .replace('{total}', String(sortedEmbeds.length))}
          </Text>
        </View>
      </View>
    );
  const hasImages = sortedImages.length > 0;

  return (
    <View style={styles.container}>
      <ScrollView
        style={styles.container}
        contentContainerStyle={[
          styles.scrollContent,
          { paddingTop: topInset + SPOT_HEADER_HEIGHT, paddingBottom: space.xxl + bottomInset },
        ]}
        onScroll={onMainScroll}
        scrollEventThrottle={16}
      >
        <View style={[styles.contentWrapper, { maxWidth: MAX_CONTENT_WIDTH }]}>
          {hasImages ? (
            <View style={[styles.hero, { height: heroHeight }]}>
              <ScrollView
                horizontal
                pagingEnabled
                showsHorizontalScrollIndicator={false}
                onScroll={(e) => {
                  const index = Math.round(e.nativeEvent.contentOffset.x / contentWidth);
                  const clamped = Math.max(0, Math.min(sortedImages.length - 1, index));
                  setActiveImageIndex((prev) => (prev === clamped ? prev : clamped));
                }}
                scrollEventThrottle={16}
                style={{ width: contentWidth, height: heroHeight }}
              >
                {sortedImages.map((image) => (
                  <Image
                    key={image.id}
                    source={{ uri: spotImageUrl(image.storage_path) }}
                    style={[styles.heroImage, { width: contentWidth, height: heroHeight }]}
                    // 写真の上下左右が切れないよう"contain"にする。縦横比が枠と合わない場合の
                    // 余白は、墨色の地がそのまま額縁のように見える。
                    resizeMode="contain"
                  />
                ))}
              </ScrollView>

              {sortedImages.length > 1 && (
                <View style={[styles.counter, { pointerEvents: 'none' }]}>
                  <Text style={styles.counterText}>
                    {t.photoCounter
                      .replace('{index}', String(activeImageIndex + 1))
                      .replace('{total}', String(sortedImages.length))}
                  </Text>
                </View>
              )}
            </View>
          ) : (
            // 写真が無くSNS埋め込みだけの投稿は、埋め込みを先頭に置く
            embedsBlock && <View style={styles.embedsTop}>{embedsBlock}</View>
          )}

          <View style={styles.body}>
            {crumbs.length > 0 && (
              <View style={styles.breadcrumb}>
                {crumbs.map((crumb, i) => (
                  <React.Fragment key={crumb.label}>
                    {i > 0 && <Text variant="body" style={styles.crumbText}>›</Text>}
                    {crumb.tagId != null && onTagPress ? (
                      <Pressable onPress={() => onTagPress(crumb.tagId!)} hitSlop={6}>
                        <Text variant="body" style={styles.crumbText}>{crumb.label}</Text>
                      </Pressable>
                    ) : (
                      <Text variant="body" style={styles.crumbText}>{crumb.label}</Text>
                    )}
                  </React.Fragment>
                ))}
              </View>
            )}

            {/* タイトルに空行が入っている投稿があり、見出しが間延びするため空行は詰める */}
            {!!spot.title && <Text style={styles.titleText}>{spot.title.trim().replace(/\n\s*\n+/g, '\n')}</Text>}

            <Pressable
              style={styles.authorRow}
              onPress={() => onAuthorPress?.(spot.author_id)}
              disabled={!onAuthorPress}
            >
              {author?.avatar_url ? (
                <Image source={{ uri: author.avatar_url }} style={styles.avatar} />
              ) : (
                <View style={[styles.avatar, styles.avatarFallback]}>
                  <Text style={styles.avatarInitial}>{authorInitial}</Text>
                </View>
              )}
              <View>
                {author?.username && (
                  <UsernameWithBadge username={author.username} badge={author.badge} textStyle={styles.authorText} />
                )}
                <Text variant="body" style={styles.dateText}>
                  {formatReviewDate(spot.created_at, t.dateLocale)}
                </Text>
              </View>
            </Pressable>

            <View style={styles.actionRow}>
              <Pressable
                style={[styles.actionButton, liked && styles.actionButtonActive]}
                onPress={onLike}
                accessibilityRole="button"
                aria-selected={liked}
              >
                <Ionicons name={liked ? 'heart' : 'heart-outline'} size={18} color={liked ? colors.accent : colors.accentText} />
                <Text style={[styles.actionText, liked && styles.actionTextActive]}>
                  {spot.like_count > 0 ? `${t.like} ${spot.like_count}` : t.like}
                </Text>
              </Pressable>
              <Pressable
                style={[styles.actionButton, bookmarked && styles.actionButtonActive]}
                onPress={onBookmark}
                accessibilityRole="button"
                aria-selected={bookmarked}
              >
                <Ionicons
                  name={bookmarked ? 'bookmark' : 'bookmark-outline'}
                  size={17}
                  color={bookmarked ? colors.accent : colors.accentText}
                />
                <Text style={[styles.actionText, bookmarked && styles.actionTextActive]}>
                  {spot.bookmark_count > 0 ? `${t.wantToGo} ${spot.bookmark_count}` : t.wantToGo}
                </Text>
              </Pressable>
              <Pressable
                style={styles.menuButton}
                onPress={() => setShowMenu((v) => !v)}
                accessibilityRole="button"
                accessibilityLabel={t.moreMenu}
              >
                <Ionicons name="ellipsis-horizontal" size={18} color={colors.accentText} />
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
                    <Text style={styles.menuItemText}>{t.viewOnMap}</Text>
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
                    <Text style={styles.menuItemText}>{t.copyLink}</Text>
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
                    <Text style={styles.menuItemText}>{t.edit}</Text>
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
                    <Text style={[styles.menuItemText, styles.menuItemDangerText]}>{t.delete}</Text>
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
                    <Text style={[styles.menuItemText, styles.menuItemDangerText]}>{t.report}</Text>
                  </Pressable>
                )}
              </View>
            )}

            {showReport && (
              <View style={styles.darkPanel}>
                <Text style={styles.panelTitle}>{t.reportTitle}</Text>
                {REPORT_REASONS.map((reason) => (
                  <Pressable key={reason} style={styles.reportOption} onPress={() => onReport(reason)}>
                    <Text variant="body" style={styles.reportOptionText}>{t.reportReasons[reason]}</Text>
                  </Pressable>
                ))}
              </View>
            )}

            {showDeleteConfirm && (
              <View style={styles.darkPanel}>
                <Text style={styles.panelTitle}>{t.deleteConfirmTitle}</Text>
                <Text variant="body" style={styles.deleteConfirmDesc}>{t.deleteConfirmDesc}</Text>
                <View style={styles.deleteConfirmRow}>
                  <Pressable
                    style={styles.deleteCancelButton}
                    onPress={() => setShowDeleteConfirm(false)}
                    disabled={deleting}
                  >
                    <Text style={styles.deleteCancelText}>{t.cancel}</Text>
                  </Pressable>
                  <Pressable style={styles.deleteConfirmButton} onPress={onDelete} disabled={deleting}>
                    {deleting ? (
                      <ActivityIndicator color="#fff" size="small" />
                    ) : (
                      <Text style={styles.deleteConfirmButtonText}>{t.delete}</Text>
                    )}
                  </Pressable>
                </View>
              </View>
            )}

            {!!description && (
              <Text variant="body" style={styles.description}>
                {description}
              </Text>
            )}

            {!!spot.access && (
              <View style={styles.infoBox}>
                <Text style={styles.infoLabel}>{t.access}</Text>
                <Text variant="body" style={styles.infoText}>{spot.access}</Text>
              </View>
            )}

            {!!spot.recommended_visit_time && (
              <View style={styles.infoBox}>
                <Text style={styles.infoLabel}>{t.visitTime}</Text>
                <Text style={styles.infoText}>{visitTimeLabel(spot.recommended_visit_time)}</Text>
              </View>
            )}

            {tags.length > 0 && (
              <View style={styles.tagRow}>
                {tags.map((tag) => (
                  <Pressable
                    key={tag.id}
                    style={styles.tagChip}
                    onPress={() => onTagPress?.(tag.id)}
                    disabled={!onTagPress}
                  >
                    <Text style={styles.tagChipText}>#{tag.name}</Text>
                  </Pressable>
                ))}
              </View>
            )}
          </View>

          {/* 写真とSNS埋め込みの両方がある投稿は、埋め込みを本文の後に置く */}
          {hasImages && embedsBlock && <View style={styles.embedsAfter}>{embedsBlock}</View>}

          {/* 場所: 小さな地図(タップで地図タブへ)と、経路案内のボタン */}
          <View style={styles.locationCard}>
            <Pressable onPress={onViewOnMap} disabled={!onViewOnMap} accessibilityRole="button" accessibilityLabel={t.viewOnMap}>
              <Image source={{ uri: staticMapUrl(spot.lat, spot.lng) }} style={styles.locationMap} />
            </Pressable>
            <View style={styles.locationFooter}>
              <View style={styles.locationTextCol}>
                <Text style={styles.locationPlace} numberOfLines={1}>
                  {place.label ?? t.viewOnMap}
                </Text>
                {onViewOnMap && (
                  <Text variant="body" style={styles.locationHint}>
                    {t.locationHint}
                  </Text>
                )}
              </View>
              <Pressable style={styles.directionsButton} onPress={openInGoogleMaps} hitSlop={4}>
                <Ionicons name="navigate-outline" size={16} color={colors.accentText} />
                <Text style={styles.directionsText}>{t.directions}</Text>
              </Pressable>
            </View>
            {Platform.OS === 'ios' && (
              <Pressable style={styles.appleMapsRow} onPress={openInAppleMaps}>
                <Ionicons name="map-outline" size={16} color={colors.textSecondary} />
                <Text style={styles.appleMapsText}>{t.openInAppleMaps}</Text>
              </Pressable>
            )}
          </View>

          {nearbySpots.length > 0 && (
            <View style={styles.section}>
              <Text style={styles.sectionHeading}>{t.nearbyHeading}</Text>
              <View>
                {nearbySpots.map((near, i) => {
                  const thumb = spotThumbnailUrl(near);
                  return (
                    <Pressable
                      key={near.id}
                      style={[styles.nearbyRow, i > 0 && styles.nearbyDivider]}
                      onPress={() => onSpotPress?.(near.slug)}
                      disabled={!onSpotPress}
                    >
                      {thumb ? (
                        <Image source={{ uri: thumb }} style={styles.nearbyThumb} />
                      ) : (
                        <View style={styles.nearbyThumb} />
                      )}
                      <Text variant="body" style={styles.nearbyTitle} numberOfLines={2}>
                        {near.title || near.description || ''}
                      </Text>
                      <Text style={styles.nearbyDistance}>{formatDistance(near.distanceKm)}</Text>
                    </Pressable>
                  );
                })}
              </View>
            </View>
          )}

          {/* 「みんなの投稿」: 他ユーザーがこのスポットに追加したレビュー(写真・SNS埋め込み・
              コメント・訪問時間帯)。onAddReviewが渡っている場合のみ投稿ボタンを表示する。 */}
          <View style={styles.section}>
            <View style={styles.reviewsHeaderRow}>
              <Text style={styles.sectionHeading}>{t.reviewsHeading}</Text>
              {reviews.length > 0 && onAddReview ? (
                <Pressable style={styles.addReviewSmall} onPress={onAddReview} hitSlop={6}>
                  <Ionicons name="add" size={15} color={colors.accent} />
                  <Text style={styles.addReviewSmallText}>{t.addReview}</Text>
                </Pressable>
              ) : (
                <Text variant="body" style={styles.reviewsCount}>
                  {t.reviewsCount.replace('{count}', String(reviews.length))}
                </Text>
              )}
            </View>

            {reviewsLoading ? (
              <ActivityIndicator color={colors.accentText} style={{ marginTop: space.m }} />
            ) : reviews.length === 0 ? (
              <View style={styles.reviewsEmpty}>
                <PixelDoor ink={colors.accentText} paper={colors.accent} />
                <Text variant="body" style={styles.reviewsEmptyText}>
                  {t.reviewsEmptyLead}
                </Text>
                {onAddReview && (
                  <Pressable style={styles.addReviewButton} onPress={onAddReview}>
                    <Text style={styles.addReviewButtonText}>{t.addReview}</Text>
                  </Pressable>
                )}
              </View>
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
                      <Text variant="body" style={styles.reviewDate}>
                        {formatReviewDate(review.created_at, t.dateLocale)}
                      </Text>
                    </View>

                    {review.recommended_visit_time && (
                      <Text style={styles.reviewVisitTime}>
                        {t.reviewVisitTime.replace('{time}', visitTimeLabel(review.recommended_visit_time))}
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

                    {review.description && (
                      <Text variant="body" style={styles.reviewDescription}>
                        {review.description}
                      </Text>
                    )}

                    {currentUserId && review.author_id === currentUserId && onDeleteReview && (
                      <Pressable style={styles.reviewSmallButton} onPress={() => onDeleteReview(review)} hitSlop={6}>
                        <Text style={styles.reviewDeleteText}>{t.delete}</Text>
                      </Pressable>
                    )}

                    {(!currentUserId || review.author_id !== currentUserId) && onReportReview && (
                      <Pressable
                        style={styles.reviewSmallButton}
                        onPress={() => setReportingReviewId((id) => (id === review.id ? null : review.id))}
                        hitSlop={6}
                      >
                        <Text style={styles.reviewReportText}>{t.report}</Text>
                      </Pressable>
                    )}

                    {reportingReviewId === review.id && onReportReview && (
                      <View style={styles.reviewReportPanel}>
                        <Text style={styles.panelTitle}>{t.reportTitle}</Text>
                        {REPORT_REASONS.map((reason) => (
                          <Pressable
                            key={reason}
                            style={styles.reportOption}
                            onPress={() => {
                              onReportReview(review, reason);
                              setReportingReviewId(null);
                            }}
                          >
                            <Text variant="body" style={styles.reportOptionText}>{t.reportReasons[reason]}</Text>
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
      </ScrollView>
      {header}
    </View>
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

  // 写真
  header: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    alignItems: 'center',
  },
  headerRow: {
    flex: 1,
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: space.m,
  },
  headerButton: {
    width: 40,
    height: 40,
    borderRadius: radius.pill,
    backgroundColor: OVERLAY_BG,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerButtonSpacer: { width: 40, height: 40 },
  headerLogo: { width: 72, height: 40 },

  // 写真
  hero: { backgroundColor: colors.accentText, overflow: 'hidden' },
  heroImage: { backgroundColor: colors.accentText },
  counter: {
    position: 'absolute',
    right: space.l,
    bottom: space.l,
    paddingHorizontal: 10,
    paddingVertical: space.xs,
    borderRadius: radius.pill,
    backgroundColor: OVERLAY_BG,
  },
  counterText: { color: colors.accent, fontSize: type.caption },

  // SNS埋め込み
  embedsTop: { alignItems: 'center', paddingTop: space.l },
  embedsAfter: { alignItems: 'center', marginTop: 28 },
  embedsBlock: { overflow: 'hidden' },
  embedPager: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, marginTop: 10 },
  dot: { width: 6, height: 6, borderRadius: 3, backgroundColor: colors.accentOutline },
  dotActive: { backgroundColor: colors.accentText },
  embedPagerText: { color: colors.accentTextMuted, fontSize: type.caption, marginLeft: space.xs },

  // 本文
  body: { paddingHorizontal: 20, paddingTop: 20, gap: 14 },
  breadcrumb: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: 6 },
  crumbText: { color: colors.accentTextMuted, fontSize: 12 },
  titleText: { fontSize: type.display, lineHeight: 33, color: colors.accentText },
  authorRow: { flexDirection: 'row', alignItems: 'center', gap: 10, alignSelf: 'flex-start' },
  avatar: { width: 32, height: 32, borderRadius: radius.pill },
  avatarFallback: { backgroundColor: colors.accentText, alignItems: 'center', justifyContent: 'center' },
  avatarInitial: { color: colors.accent, fontSize: type.small },
  authorText: { fontSize: type.small, color: colors.accentText },
  dateText: { fontSize: 12, color: colors.accentTextMuted },
  actionRow: { flexDirection: 'row', gap: space.s },
  actionButton: {
    flex: 1,
    height: 44,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    borderRadius: radius.pill,
    borderWidth: 1.5,
    borderColor: colors.accentOutline,
  },
  actionButtonActive: { backgroundColor: colors.accentText, borderColor: colors.accentText },
  actionText: { color: colors.accentText, fontSize: 14 },
  actionTextActive: { color: colors.accent },
  menuButton: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radius.pill,
    borderWidth: 1.5,
    borderColor: colors.accentOutline,
  },
  menuPanel: { backgroundColor: colors.accentText, borderRadius: radius.m, overflow: 'hidden' },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: space.l,
    paddingVertical: 13,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
  },
  menuItemLast: { borderBottomWidth: 0 },
  menuItemText: { color: colors.textPrimary, fontSize: 14 },
  menuItemDangerText: { color: colors.danger },
  darkPanel: { backgroundColor: colors.accentText, borderRadius: radius.m, padding: space.l },
  panelTitle: { color: colors.textPrimary, fontSize: type.body, marginBottom: 10 },
  reportOption: { paddingVertical: 10 },
  reportOptionText: { color: colors.textSecondary, fontSize: 14 },
  deleteConfirmDesc: { color: colors.textSecondary, fontSize: type.small, lineHeight: 20, marginBottom: space.l },
  deleteConfirmRow: { flexDirection: 'row', gap: 10 },
  deleteCancelButton: {
    flex: 1,
    borderRadius: radius.pill,
    paddingVertical: 12,
    alignItems: 'center',
    backgroundColor: colors.surface,
  },
  deleteCancelText: { color: colors.textSecondary, fontSize: 14 },
  deleteConfirmButton: {
    flex: 1,
    borderRadius: radius.pill,
    paddingVertical: 12,
    alignItems: 'center',
    backgroundColor: colors.danger,
  },
  deleteConfirmButtonText: { color: '#fff', fontSize: 14 },
  description: { fontSize: type.body, lineHeight: 28, color: colors.accentText },
  // 墨色の箱なので、文字色は暗い背景の上で読める明るい色を使う
  infoBox: { padding: 14, borderRadius: radius.m, backgroundColor: colors.accentText, gap: space.xs },
  infoLabel: { fontSize: 12, color: colors.accent },
  infoText: { fontSize: 14, color: colors.textPrimary, lineHeight: 22 },
  tagRow: { flexDirection: 'row', flexWrap: 'wrap', gap: space.s },
  tagChip: {
    height: 30,
    paddingHorizontal: 12,
    justifyContent: 'center',
    borderRadius: radius.pill,
    backgroundColor: colors.accentText,
  },
  tagChipText: { color: colors.accent, fontSize: type.small },

  // 場所
  locationCard: {
    marginTop: 28,
    marginHorizontal: 20,
    borderRadius: radius.m,
    backgroundColor: colors.accentText,
    overflow: 'hidden',
  },
  locationMap: { width: '100%', aspectRatio: 640 / 300, backgroundColor: colors.background },
  locationFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.m,
    paddingHorizontal: space.l,
    paddingVertical: 14,
  },
  locationTextCol: { flex: 1, minWidth: 0, gap: 2 },
  locationPlace: { color: colors.textPrimary, fontSize: type.body },
  locationHint: { color: colors.textSecondary, fontSize: 12 },
  directionsButton: {
    height: 40,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: space.l,
    borderRadius: radius.pill,
    backgroundColor: colors.accent,
  },
  directionsText: { color: colors.accentText, fontSize: type.small },
  appleMapsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: space.m,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.border,
  },
  appleMapsText: { color: colors.textSecondary, fontSize: type.small },

  // 近くのスポット・みんなの投稿
  section: { marginTop: space.xxl, marginHorizontal: 20, gap: space.m },
  sectionHeading: { color: colors.accentText, fontSize: type.heading },
  nearbyRow: { flexDirection: 'row', alignItems: 'center', gap: space.m, paddingVertical: 10 },
  nearbyDivider: { borderTopWidth: 1, borderTopColor: colors.accentLine },
  nearbyThumb: { width: 44, height: 44, borderRadius: radius.s, backgroundColor: colors.accentLine },
  nearbyTitle: { flex: 1, color: colors.accentText, fontSize: 14, lineHeight: 20 },
  nearbyDistance: { color: colors.accentTextMuted, fontSize: 12 },
  reviewsHeaderRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  reviewsCount: { color: colors.accentTextMuted, fontSize: 12 },
  addReviewSmall: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: colors.accentText,
    borderRadius: radius.pill,
    paddingVertical: 6,
    paddingHorizontal: space.m,
  },
  addReviewSmallText: { color: colors.accent, fontSize: type.small },
  reviewsEmpty: {
    alignItems: 'center',
    gap: space.m,
    paddingVertical: 28,
    paddingHorizontal: 20,
    borderRadius: radius.m,
    borderWidth: 1.5,
    borderStyle: 'dashed',
    borderColor: colors.accentOutline,
  },
  reviewsEmptyText: { color: 'rgba(29,27,14,0.78)', fontSize: 14, lineHeight: 24, textAlign: 'center' },
  addReviewButton: {
    height: 44,
    paddingHorizontal: 20,
    justifyContent: 'center',
    borderRadius: radius.pill,
    backgroundColor: colors.accentText,
  },
  addReviewButtonText: { color: colors.accent, fontSize: 14 },
  reviewCard: { backgroundColor: colors.accentText, borderRadius: radius.m, padding: 14 },
  reviewHeaderRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  reviewAuthorText: { fontSize: type.small, color: colors.accent },
  reviewDate: { fontSize: type.caption, color: colors.textMuted },
  reviewVisitTime: { fontSize: 12, color: colors.accent, marginTop: 6 },
  reviewMediaRow: { marginTop: 10 },
  reviewImage: { width: 96, height: 96, borderRadius: radius.s, marginRight: space.s, backgroundColor: colors.surfaceAlt },
  reviewDescription: { fontSize: 14, color: colors.textPrimary, lineHeight: 22, marginTop: 10 },
  reviewSmallButton: { marginTop: 10, alignSelf: 'flex-start' },
  reviewReportText: { color: colors.textMuted, fontSize: 12, textDecorationLine: 'underline' },
  reviewReportPanel: { marginTop: 10, backgroundColor: colors.surfaceAlt, borderRadius: radius.s, padding: space.m },
  reviewDeleteText: { color: colors.danger, fontSize: 12 },
});
