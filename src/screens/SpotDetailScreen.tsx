import React, { useEffect, useState } from 'react';
import { View, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useSpotDetail } from '../hooks/useSpotDetail';
import SpotDetailContent, { type NearbySpot } from '../components/SpotDetailContent';
import { useAuth } from '../lib/AuthContext';
import { fetchNearbySpots } from '../lib/spots';
import { filterBlockedAuthors } from '../lib/moderation';
import { colors } from '../lib/theme';
import { WEB_SAFE_BOTTOM_OVERHANG } from '../lib/safeAreaWeb';
import { applySpotSeo, resetSeo } from '../lib/seo';
import { confirmAction, notify } from '../lib/notify';
import { useTranslation } from '../lib/i18n';
import type { RootStackScreenProps } from '../navigation/types';

type Props = RootStackScreenProps<'SpotDetail'>;

export default function SpotDetailScreen({ route, navigation }: Props) {
  const { spotId } = route.params;
  const { session, blockedUserIds } = useAuth();
  const insets = useSafeAreaInsets();
  const t = useTranslation().spotDetail;
  const {
    spot,
    loading,
    liked,
    bookmarked,
    visited,
    showReport,
    setShowReport,
    handleLike,
    handleBookmark,
    handleVisit,
    handleReport,
    isOwner,
    deleting,
    handleDelete,
    reviews,
    reviewsLoading,
    handleDeleteReview,
    handleReportReview,
  } = useSpotDetail(spotId, {
    // 未ログインで保存したとき、1件目と3件目に、アカウントを作ると保存を引き継げることを案内する
    onGuestBookmark: async (count) => {
      if (count !== 1 && count !== 3) return;
      const ok = await confirmAction(
        t.guestSavedTitle,
        t.guestSavedMessage,
        t.guestSavedSignUp,
        t.guestSavedLater
      );
      if (ok) navigation.navigate('Auth', { mode: 'signup' });
    },
    // 未ログインで「行った」を押したとき
    onRequireLogin: async () => {
      const ok = await confirmAction(t.visitLoginTitle, t.visitLoginMessage, t.guestSavedSignUp, t.guestSavedLater);
      if (ok) navigation.navigate('Auth', { mode: 'signup' });
    },
  });

  // Web版: SPA内遷移でこの画面を開いた場合もタイトル/OGP/構造化データを
  // このスポット固有の内容に更新する（初回アクセス時はapi/spot.tsが同等の処理をSSR的に行う）。
  // 画面を離れる際はアプリ全体の既定値に戻す。
  useEffect(() => {
    if (spot) applySpotSeo(spot);
  }, [spot]);

  useEffect(() => {
    return () => resetSeo();
  }, []);

  // 「近くのリミナルスペース」。本文の表示を待たせないよう、スポット本体の取得後に別で読み込む
  const [nearbySpots, setNearbySpots] = useState<NearbySpot[]>([]);
  const spotKey = spot ? `${spot.id}:${spot.lat}:${spot.lng}` : null;
  useEffect(() => {
    if (!spot) return;
    let cancelled = false;
    setNearbySpots([]);
    fetchNearbySpots(spot, 8)
      .then((items) => {
        if (!cancelled) setNearbySpots(filterBlockedAuthors(items, blockedUserIds).slice(0, 4));
      })
      .catch((e) => console.warn('近くのスポット取得エラー', e));
    return () => {
      cancelled = true;
    };
    // spot オブジェクトはいいね等で作り直されるため、位置が変わったときだけ読み直す
  }, [spotKey, blockedUserIds]);

  // 戻れる場合は前の画面へ、URLから直接開いた場合などは地図へ
  const goBack = () => {
    if (navigation.canGoBack()) {
      navigation.goBack();
    } else {
      navigation.navigate('Main', { screen: 'MapTab' });
    }
  };

  const goToSpot = (slug: string) => {
    navigation.push('SpotDetail', { spotId: slug });
  };

  const goToMap = () => {
    if (!spot) return;
    navigation.navigate('Main', {
      screen: 'MapTab',
      params: { focusLat: spot.lat, focusLng: spot.lng },
    });
  };

  const goToTag = (tagId: number) => {
    navigation.navigate('Main', {
      screen: 'SearchTab',
      params: { tagId },
    });
  };

  // 自分自身の場合はマイページタブへ、他ユーザーの場合はプロフィール画面へ遷移する
  const goToAuthor = (userId: string) => {
    if (session?.user?.id === userId) {
      navigation.navigate('Main', { screen: 'MyPageTab' });
    } else {
      navigation.navigate('UserProfile', { userId });
    }
  };

  const goToEdit = () => {
    if (!spot) return;
    navigation.navigate('EditSpot', { spotId: spot.slug });
  };

  // 未ログインの場合はAddReviewScreen側の内部ガードでログイン画面へ誘導される
  const goToAddReview = () => {
    if (!spot) return;
    navigation.navigate('AddReview', { spotId: spot.slug });
  };

  // 削除後は詳細画面に留まれないため、戻れる場合は戻り、戻れない場合は地図画面へ遷移する
  const onDelete = async () => {
    const success = await handleDelete();
    if (!success) return;
    notify('削除しました', '', () => {
      if (navigation.canGoBack()) {
        navigation.goBack();
      } else {
        navigation.navigate('Main', { screen: 'MapTab' });
      }
    });
  };

  return (
    // Web版でホーム画面に追加してスタンドアロン表示にした際、この画面を包む
    // react-navigation側のコンテナがホームインジケーター分の安全領域まで
    // 高さを伸ばしきれないことがあり、その分だけ背景の黄色がグレーで
    // 途切れて見える不具合があった。position:absoluteで自前の領域を
    // 明示し、bottomを安全領域分だけ余分に伸ばすことで、
    // 親コンテナの取りこぼしを吸収して実機の下端まで確実に黄色を届かせる。
    // ネイティブ版は同様の問題が起きないため、ここでオーバーハングさせると
    // 逆にScrollViewの表示領域が画面より大きくなり、末尾のコンテンツが
    // 画面下端の外側(見えない領域)に隠れてスクロールしきれなくなってしまう。
    // そのためネイティブ版はオーバーハングなし(0)にする。
    <View
      style={[
        styles.screen,
        {
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          // Web版はCSSのenv(safe-area-inset-bottom)を直接使い、コラム記事ページと
          // 同じ仕組みで誤差なく実機の下端まで届かせる。
          bottom: WEB_SAFE_BOTTOM_OVERHANG ?? 0,
        },
      ]}
    >
      <SpotDetailContent
        spot={spot}
        loading={loading}
        liked={liked}
        bookmarked={bookmarked}
        visited={visited}
        onVisit={handleVisit}
        showReport={showReport}
        onToggleReport={() => setShowReport(!showReport)}
        onLike={handleLike}
        onBookmark={handleBookmark}
        onReport={handleReport}
        onBack={goBack}
        onLogoPress={goToMap}
        onViewOnMap={goToMap}
        onTagPress={goToTag}
        onAuthorPress={goToAuthor}
        isOwner={isOwner}
        onEdit={goToEdit}
        onDelete={onDelete}
        deleting={deleting}
        topInset={insets.top}
        bottomInset={insets.bottom}
        nearbySpots={nearbySpots}
        onSpotPress={goToSpot}
        reviews={reviews}
        reviewsLoading={reviewsLoading}
        currentUserId={session?.user?.id}
        onAddReview={goToAddReview}
        onDeleteReview={handleDeleteReview}
        onReportReview={handleReportReview}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.accent },
});
