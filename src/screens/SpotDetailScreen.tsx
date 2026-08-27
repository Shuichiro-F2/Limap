import React, { useEffect } from 'react';
import { View, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useSpotDetail } from '../hooks/useSpotDetail';
import SpotDetailContent from '../components/SpotDetailContent';
import AppHeader, { HEADER_CONTENT_HEIGHT } from '../components/AppHeader';
import { useAuth } from '../lib/AuthContext';
import { colors } from '../lib/theme';
import { WEB_SAFE_BOTTOM_OVERHANG } from '../lib/safeAreaWeb';
import { applySpotSeo, resetSeo } from '../lib/seo';
import { notify } from '../lib/notify';
import type { RootStackScreenProps } from '../navigation/types';

type Props = RootStackScreenProps<'SpotDetail'>;

export default function SpotDetailScreen({ route, navigation }: Props) {
  const { spotId } = route.params;
  const { session } = useAuth();
  const insets = useSafeAreaInsets();
  const {
    spot,
    loading,
    liked,
    bookmarked,
    showReport,
    setShowReport,
    handleLike,
    handleBookmark,
    handleReport,
    isOwner,
    deleting,
    handleDelete,
    reviews,
    reviewsLoading,
    handleDeleteReview,
    handleReportReview,
  } = useSpotDetail(spotId);

  // Web版: SPA内遷移でこの画面を開いた場合もタイトル/OGP/構造化データを
  // このスポット固有の内容に更新する（初回アクセス時はapi/spot.tsが同等の処理をSSR的に行う）。
  // 画面を離れる際はアプリ全体の既定値に戻す。
  useEffect(() => {
    if (spot) applySpotSeo(spot);
  }, [spot]);

  useEffect(() => {
    return () => resetSeo();
  }, []);

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
    // ホーム画面に追加してスタンドアロン表示にした際、この画面を包む
    // react-navigation側のコンテナがホームインジケーター分の安全領域まで
    // 高さを伸ばしきれないことがあり、その分だけ背景の黄色がグレーで
    // 途切れて見える不具合があった。position:absoluteで自前の領域を
    // 明示し、bottomをinsets.bottom分だけ余分に伸ばすことで、
    // 親コンテナの取りこぼしを吸収して実機の下端まで確実に黄色を届かせる。
    <View
      style={[
        styles.screen,
        {
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          // Web版はCSSのenv(safe-area-inset-bottom)を直接使い、コラム記事ページと
          // 同じ仕組みで誤差なく実機の下端まで届かせる。ネイティブ版はinsets.bottomを使う。
          bottom: WEB_SAFE_BOTTOM_OVERHANG ?? -insets.bottom,
        },
      ]}
    >
      <SpotDetailContent
        spot={spot}
        loading={loading}
        liked={liked}
        bookmarked={bookmarked}
        showReport={showReport}
        onToggleReport={() => setShowReport(!showReport)}
        onLike={handleLike}
        onBookmark={handleBookmark}
        onReport={handleReport}
        onViewOnMap={goToMap}
        onTagPress={goToTag}
        onAuthorPress={goToAuthor}
        isOwner={isOwner}
        onEdit={goToEdit}
        onDelete={onDelete}
        deleting={deleting}
        topInset={insets.top + HEADER_CONTENT_HEIGHT}
        reviews={reviews}
        reviewsLoading={reviewsLoading}
        currentUserId={session?.user?.id}
        onAddReview={goToAddReview}
        onDeleteReview={handleDeleteReview}
        onReportReview={handleReportReview}
      />
      {/* 他の画面(地図・フィード等)と全く同じレイアウトのヘッダーにするため、
          個別のnative-stackヘッダーではなく共通のAppHeaderをそのまま重ねて使う。
          黄色背景に合わせて濃色ロゴを使い、タップで(このスポットの位置を中心にした)地図へ戻る。 */}
      <AppHeader
        logoSource={require('../../assets/logo-header-dark.png')}
        backgroundColor={colors.accent}
        onLogoPress={goToMap}
        showLanguageToggle={false}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.accent },
});
