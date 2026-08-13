import React, { useEffect } from 'react';
import { View, StyleSheet } from 'react-native';
import { useSpotDetail } from '../hooks/useSpotDetail';
import SpotDetailContent from '../components/SpotDetailContent';
import { useAuth } from '../lib/AuthContext';
import { colors } from '../lib/theme';
import { applySpotSeo, resetSeo } from '../lib/seo';
import { notify } from '../lib/notify';
import type { RootStackScreenProps } from '../navigation/types';

type Props = RootStackScreenProps<'SpotDetail'>;

export default function SpotDetailScreen({ route, navigation }: Props) {
  const { spotId } = route.params;
  const { session } = useAuth();
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
    <View style={styles.screen}>
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
        onDelete={onDelete}
        deleting={deleting}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
});
