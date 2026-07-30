import React, { useEffect, useRef, useState } from 'react';
import {
  Animated,
  Dimensions,
  Modal,
  PanResponder,
  type PanResponderGestureState,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useSpotDetail } from '../hooks/useSpotDetail';
import SpotDetailContent from './SpotDetailContent';
import { colors } from '../lib/theme';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

// シートの全体の高さ（フル状態）と、最初に開いたときの高さ（半分状態）
const FULL_HEIGHT = SCREEN_HEIGHT * 0.92;
const HALF_HEIGHT = SCREEN_HEIGHT * 0.52;

// translateY の値（0 = 画面いっぱいに展開、CLOSED_Y = 完全に隠れる）
const FULL_Y = 0;
const HALF_Y = FULL_HEIGHT - HALF_HEIGHT;
const CLOSED_Y = FULL_HEIGHT;

const FLICK_VELOCITY = 1.1;
const DRAG_THRESHOLD = 6;

type Props = {
  spotId: string | null;
  onClose: () => void;
  onViewOnMap?: (lat: number, lng: number) => void;
};

export default function SpotPreviewSheet({ spotId, onClose, onViewOnMap }: Props) {
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

  const [modalVisible, setModalVisible] = useState(false);
  const [isFull, setIsFull] = useState(false);
  const translateY = useRef(new Animated.Value(CLOSED_Y)).current;
  const currentY = useRef(CLOSED_Y);
  const gestureStartY = useRef(CLOSED_Y);
  const isFullRef = useRef(false);
  const contentScrollY = useRef(0);

  useEffect(() => {
    const id = translateY.addListener(({ value }) => {
      currentY.current = value;
    });
    return () => translateY.removeListener(id);
  }, [translateY]);

  useEffect(() => {
    if (spotId) {
      setModalVisible(true);
      setIsFull(false);
      isFullRef.current = false;
      contentScrollY.current = 0;
      translateY.setValue(CLOSED_Y);
      currentY.current = CLOSED_Y;
      Animated.spring(translateY, {
        toValue: HALF_Y,
        useNativeDriver: true,
        bounciness: 4,
      }).start();
    }
  }, [spotId, translateY]);

  const animateTo = (toValue: number, thenClose = false) => {
    if (toValue === FULL_Y) {
      isFullRef.current = true;
      setIsFull(true);
    } else if (toValue === HALF_Y) {
      isFullRef.current = false;
      setIsFull(false);
    }
    Animated.spring(translateY, {
      toValue,
      useNativeDriver: true,
      bounciness: 4,
    }).start(() => {
      if (thenClose) {
        setModalVisible(false);
        onClose();
      }
    });
  };

  const close = () => animateTo(CLOSED_Y, true);

  const onGrant = () => {
    translateY.stopAnimation((value) => {
      gestureStartY.current = value;
    });
  };

  const onMove = (gesture: PanResponderGestureState) => {
    const next = Math.min(CLOSED_Y, Math.max(FULL_Y, gestureStartY.current + gesture.dy));
    translateY.setValue(next);
  };

  const onRelease = (gesture: PanResponderGestureState) => {
    const endY = Math.min(CLOSED_Y, Math.max(FULL_Y, gestureStartY.current + gesture.dy));
    const velocity = gesture.vy;

    // 素早いフリックはスナップ位置より勢いを優先する
    if (velocity > FLICK_VELOCITY) {
      animateTo(endY > HALF_Y - 60 ? CLOSED_Y : HALF_Y, endY > HALF_Y - 60);
      return;
    }
    if (velocity < -FLICK_VELOCITY) {
      animateTo(FULL_Y);
      return;
    }

    // それ以外は最も近いスナップ位置へ
    const distToFull = Math.abs(endY - FULL_Y);
    const distToHalf = Math.abs(endY - HALF_Y);
    const distToClosed = Math.abs(endY - CLOSED_Y);
    const minDist = Math.min(distToFull, distToHalf, distToClosed);

    if (minDist === distToClosed) {
      animateTo(CLOSED_Y, true);
    } else if (minDist === distToFull) {
      animateTo(FULL_Y);
    } else {
      animateTo(HALF_Y);
    }
  };

  // ハンドルバー：どちらの状態でも常に縦ドラッグに反応する専用の操作領域
  const handleResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: (_, gesture) =>
        Math.abs(gesture.dy) > DRAG_THRESHOLD && Math.abs(gesture.dy) > Math.abs(gesture.dx),
      onPanResponderGrant: onGrant,
      onPanResponderMove: (_, gesture) => onMove(gesture),
      onPanResponderRelease: (_, gesture) => onRelease(gesture),
    })
  ).current;

  // 本文エリア：半分表示のときは空白部分どこでもドラッグに反応させる。
  // フル表示のときは、本文が一番上までスクロールされている状態でのみ
  // 下方向のドラッグを奪い、それ以外は中のスクロールを優先する。
  const bodyResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => false,
      onMoveShouldSetPanResponderCapture: (_, gesture) => {
        const isVertical = Math.abs(gesture.dy) > DRAG_THRESHOLD && Math.abs(gesture.dy) > Math.abs(gesture.dx);
        if (!isVertical) return false;
        if (!isFullRef.current) return true;
        return contentScrollY.current <= 0 && gesture.dy > 0;
      },
      onPanResponderGrant: onGrant,
      onPanResponderMove: (_, gesture) => onMove(gesture),
      onPanResponderRelease: (_, gesture) => onRelease(gesture),
    })
  ).current;

  if (!modalVisible) return null;

  const backdropOpacity = translateY.interpolate({
    inputRange: [FULL_Y, CLOSED_Y],
    outputRange: [0.45, 0],
    extrapolate: 'clamp',
  });

  return (
    <Modal visible transparent animationType="none" statusBarTranslucent onRequestClose={close}>
      <View style={StyleSheet.absoluteFill}>
        <Pressable style={StyleSheet.absoluteFill} onPress={close}>
          <Animated.View style={[styles.backdrop, { opacity: backdropOpacity }]} />
        </Pressable>

        <Animated.View style={[styles.sheet, { height: FULL_HEIGHT, transform: [{ translateY }] }]}>
          <View {...handleResponder.panHandlers} style={styles.handleArea}>
            <View style={styles.handleBar} />
            <Pressable style={styles.closeButton} onPress={close} hitSlop={14}>
              <Text style={styles.closeButtonText}>✕</Text>
            </Pressable>
          </View>

          <View {...bodyResponder.panHandlers} style={styles.contentWrap}>
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
              imageHeight={220}
              onScroll={(e) => {
                contentScrollY.current = e.nativeEvent.contentOffset.y;
              }}
              onViewOnMap={
                onViewOnMap && spot
                  ? () => {
                      onViewOnMap(spot.lat, spot.lng);
                      close();
                    }
                  : undefined
              }
            />
          </View>
        </Animated.View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: '#000' },
  sheet: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: colors.accent,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    overflow: 'hidden',
  },
  handleArea: {
    height: 52,
    alignItems: 'center',
    justifyContent: 'center',
  },
  handleBar: {
    width: 44,
    height: 5,
    borderRadius: 3,
    backgroundColor: colors.accentText,
    opacity: 0.4,
  },
  closeButton: {
    position: 'absolute',
    right: 14,
    top: 10,
    padding: 8,
  },
  closeButtonText: { color: colors.accentText, fontSize: 18, fontWeight: '700' },
  contentWrap: { flex: 1 },
});
