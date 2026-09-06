import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Animated, Image, Pressable, StyleSheet, View } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import Text from './AppText';
import { colors } from '../lib/theme';

// ネイティブアプリ限定のオープニング演出。
// 黄色(ブランドカラー)の背景に、ドットフォントで
//   1. 「ようこそ」      …インストール後の初回起動時のみ
//   2. 「避難しよう。」   …キャッチコピー。毎回表示する
//   3. LIMapロゴ         …フェードイン/アウト。毎回表示する
// の順に流し、終わったら onDone() を呼ぶ(呼び出し側で通常のローディング画面へ進む)。
//
// 1と2は1文字ずつタイプされる。画面のどこをタップしてもその場で演出を打ち切れる。
// Web版では呼び出し側(RootNavigator)がこの画面自体をマウントしない。

const GREETING = 'ようこそ';
const TAGLINE = '避難しよう。';

// 演出のタイミング(ms)。初回は約5.2秒、2回目以降は約3.6秒。
const TYPE_MS = 130; // 1文字あたりの表示間隔
const FADE_IN_MS = 120; // テキストの下地のフェードイン
const HOLD_MS = 800; // 打ち終わってから消え始めるまで
const FADE_OUT_MS = 300;
const LOGO_IN_MS = 500;
const LOGO_HOLD_MS = 850;
const LOGO_OUT_MS = 350;

type Props = {
  // 初回起動時のみtrue。「ようこそ」から始めるかどうか。
  // 判定(AsyncStorageの読み取り)がまだ終わっていない間はnullを渡す。
  // その間この画面は黄色の背景だけを出して待ち、確定してから演出を始める。
  showGreeting: boolean | null;
  onDone: () => void;
};

export default function IntroScreen({ showGreeting, onDone }: Props) {
  const texts = useMemo(
    () => (showGreeting === null ? null : showGreeting ? [GREETING, TAGLINE] : [TAGLINE]),
    [showGreeting]
  );

  // 0..texts.length-1 = テキスト / texts.length = ロゴ
  const [step, setStep] = useState(0);
  const [typedCount, setTypedCount] = useState(0);
  const opacity = useRef(new Animated.Value(0)).current;
  // タップスキップと演出完了が競合しうるため、onDoneは一度だけ呼ぶ
  const finished = useRef(false);

  const finish = useCallback(() => {
    if (finished.current) return;
    finished.current = true;
    onDone();
  }, [onDone]);

  // stepが変わるたびに、そのステップの演出を最初から再生する
  useEffect(() => {
    if (finished.current || texts === null) return;
    const timers: ReturnType<typeof setTimeout>[] = [];
    opacity.setValue(0);

    if (step < texts.length) {
      const text = texts[step];
      setTypedCount(0);
      Animated.timing(opacity, { toValue: 1, duration: FADE_IN_MS, useNativeDriver: true }).start();

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
            }).start(({ finished: done }) => {
              // タップスキップで中断された場合は done が false になり、次へ進めない
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
  }, [step, texts, opacity, finish]);

  const isLogo = texts !== null && step >= texts.length;

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
            <Text style={styles.text}>{texts ? texts[step].slice(0, typedCount) : ''}</Text>
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
