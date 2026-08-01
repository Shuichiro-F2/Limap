import React from 'react';
import { View, StyleSheet } from 'react-native';
import { useSpotDetail } from '../hooks/useSpotDetail';
import SpotDetailContent from '../components/SpotDetailContent';
import { colors } from '../lib/theme';
import type { RootStackScreenProps } from '../navigation/types';

type Props = RootStackScreenProps<'SpotDetail'>;

export default function SpotDetailScreen({ route, navigation }: Props) {
  const { spotId } = route.params;
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
      />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.accent },
});
