import React from 'react';
import { View, StyleSheet } from 'react-native';
import { useSpotDetail } from '../hooks/useSpotDetail';
import SpotDetailContent from '../components/SpotDetailContent';
import { useAuth } from '../lib/AuthContext';
import { colors } from '../lib/theme';
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
  } = useSpotDetail(spotId);

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
      />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.accent },
});
