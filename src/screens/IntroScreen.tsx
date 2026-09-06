import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Animated, Image, Pressable, StyleSheet, View } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import Text from '../components/AppText';
import { colors } from '../lib/theme';
import type { RootStackScreenProps } from '../navigation/types';

// ネイティブアプリ限定: インストール後の初回起動時にだけ流すオープニング演出。
// 黄色(ブランドカラー)の背景に、ドットフォントで
//   1. 「ようこそ」        …1文字ずつタイプされる
//   2. 「避難しよう。」     …同上（キャッチコピー）
//   3. LIMapロゴ           …フェードイン
// の順で表示し、終わったらWelcome画面(アカウント作成/ログインの案内)へ置き換える。
//
// 画面のどこをタップしても、その時点で演出を打ち切ってWelcome画面へ進める。
// 2回目以降の起動ではそもそもこの画面に来ない(RootNavigatorのinitialRouteName参照)。

const TEXTS = ['ようこそ', '避難しよう。'];

// 演出のタイミング(ms)。全体で約5.2秒。
const TYPE_MS = 130; // 1文字あたりの表示間隔
const HOLD_MS = 800; // 打ち終わってから消え始めるまで
const FADE_OUT_MS = 300;
const LOGO_IN_MS = 500;
const LOGO_HOLD_MS = 850;
const LOGO_OUT_MS = 350;

export default function IntroScreen({ navigation }: RootStackScreenProps<'Intro'>) {
  // 0,1 = TEXTS のインデックス / TEXTS.length = ロゴ
  const [step, setStep] = useState(0);
  const [typedCount, setTypedCount] = useState(0);
  const opacity = useRef(new Animated.Value(0)).current;
  // 二重遷移を防ぐためのフラグ(タップスキップと演出完了が競合しうるため)
  const finished = useRef(false);

  const finish = useCallback(() => {
    if (finished.current) return;
    finished.current = true;
    navigation.replace('Welcome');
  }, [navigation]);

  // stepが変わるたびに、そのステップの演出を最初から再生する
  useEffect(() => {
    if (finished.current) return;
    const timers: ReturnType<typeof setTimeout>[] = [];
    opacity.setValue(0);

    if (step < TEXTS.length) {
      const text = TEXTS[step];
      setTypedCount(0);
      Animated.timing(opacity, { toValue: 1, duration: 120, useNativeDriver: true }).start();

      for (let i = 1; i <= text.length; i += 1) {
        timers.push(setTimeout(() => setTypedCount(i), TYPE_MS * i));
      }

      timers.push(
        setTimeout(
          () => {
            Animated.timing(opacity, {
              toValue: 0,
              duration: FADE_OUT_MS,
              useNativeDriver: true,
              // タップスキップでアンマウントされた場合は done が false になるので、
              // そのときは次のステップへ進めない
            }).start(({ finished: done }) => {
              if (done && !finished.current) setStep((s) => s + 1);
            });
          },
          TYPE_MS * text.length + HOLD_MS
        )
      );
    } else {
      Animated.timing(opacity, { toValue: 1, duration: LOGO_IN_MS, useNativeDriver: true }).start();
      timers.push(
        setTimeout(() => {
          Animated.timing(opacity, {
            toValue: 0,
            duration: LOGO_OUT_MS,
            useNativeDriver: true,
          }).start(({ finished: done }) => {
            if (done) finish();
          });
        }, LOGO_IN_MS + LOGO_HOLD_MS)
      );
    }

    return () => timers.forEach(clearTimeout);
  }, [step, opacity, finish]);

  const isLogo = step >= TEXTS.length;

  return (
    <Pressable style={styles.container} onPress={finish} accessibilityLabel="スキップ">
      {/* 黄色背景の上ではステータスバーの文字を暗くする(この画面を離れると元に戻る) */}
      <StatusBar style="dark" />
      <View style={styles.center}>
        <Animated.View style={{ opacity }}>
          {isLogo ? (
            <Image
              source={require('../../assets/logo-header-dark.png')}
              style={styles.logo}
              resizeMode="contain"
            />
          ) : (
            <Text style={styles.text}>{TEXTS[step].slice(0, typedCount)}</Text>
          )}
        </Animated.View>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.accent },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  text: {
    color: colors.accentText,
    fontSize: 22,
    letterSpacing: 1,
    // 1文字ずつ増えても行の高さが変わらないよう、明示しておく
    lineHeight: 34,
    textAlign: 'center',
  },
  // logo-header-dark.png の原寸は 411x263(縦横比 1.563)
  logo: { width: 140, height: 90 },
});
