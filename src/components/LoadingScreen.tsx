import React, { useEffect, useRef } from 'react';
import { Animated, Easing, Image, StyleSheet, View } from 'react-native';
import { colors } from '../lib/theme';

// アプリ起動時（Webではindex.html側の簡易スプラッシュから引き継ぐ）に、
// セッション確認などの初期化中に表示するロゴ＋ローディングバーの画面
const TRACK_WIDTH = 160;
const BAR_WIDTH = TRACK_WIDTH * 0.4;

export default function LoadingScreen() {
  const progress = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.timing(progress, {
        toValue: 1,
        duration: 1100,
        easing: Easing.inOut(Easing.ease),
        useNativeDriver: true,
      })
    );
    loop.start();
    return () => loop.stop();
  }, [progress]);

  const translateX = progress.interpolate({
    inputRange: [0, 1],
    outputRange: [-BAR_WIDTH, TRACK_WIDTH],
  });

  return (
    <View style={styles.container}>
      <Image source={require('../../assets/splash-logo.png')} style={styles.logo} resizeMode="contain" />
      <View style={styles.track}>
        <Animated.View style={[styles.bar, { transform: [{ translateX }] }]} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background, alignItems: 'center', justifyContent: 'center' },
  logo: { width: 200, height: 127, marginBottom: 32 },
  track: {
    width: TRACK_WIDTH,
    height: 4,
    borderRadius: 2,
    backgroundColor: 'rgba(255,255,255,0.15)',
    overflow: 'hidden',
  },
  bar: { width: BAR_WIDTH, height: 4, borderRadius: 2, backgroundColor: colors.accent },
});
