import React from 'react';
import { View, Image, Pressable, StyleSheet, type ImageSourcePropType } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../lib/theme';

// ロゴ本体の高さ＋余白。各タブ画面側は、この分だけ先頭にスペースを空けて
// コンテンツを配置することで、常に最前面に重なるこのヘッダーと被らないようにする。
// ロゴが上に寄りすぎないよう、ロゴ自体の高さより少し大きめの値にして上部に隙間を作る。
export const HEADER_CONTENT_HEIGHT = 64;

type Props = {
  // ロゴ画像。指定がなければ4タブ共通の黄色ロゴを使う
  logoSource?: ImageSourcePropType;
  // ヘッダー行の背景色。指定がなければ透過のまま(タブ画面での既定の見た目)。
  // 投稿詳細画面など、ページ自体の背景色に合わせて塗りたい場合に指定する。
  backgroundColor?: string;
  // ロゴをタップ可能にしたい場合のハンドラ(例: 投稿詳細画面からトップに戻る)
  onLogoPress?: () => void;
  // 右上に表示するアクション。'menu'はハンバーガーメニューのボタンを表示する
  // (現状はマイページタブの時だけMainTabNavigator側から'menu'を渡す)。
  // 省略時・'none'指定時は何も表示しない。
  rightAction?: 'menu' | 'none';
  onMenuPress?: () => void;
};

// ロゴは4つのタブ全てに共通する固定要素。
// MainTabNavigator側で、タブのページャー（スワイプで横に流れる部分）とは別の
// 最前面レイヤーとして重ねて描画することで、タブを切り替えても一緒にスライドせず
// 常に画面の同じ位置に留まる「ヘッダー」のように振る舞う。背景は既定で透過。
// 投稿詳細画面(SpotDetailScreen)など、タブ以外の画面でも全く同じレイアウトの
// ヘッダーが必要な場合は、このコンポーネントをbackgroundColor/logoSource/onLogoPress
// 付きでそのまま再利用し、ロゴの位置・サイズが画面ごとにズレないようにする。
//
// 以前はここに言語切り替えトグルを常時表示していたが、マイページタブ専用の
// ハンバーガーメニュー(ProfileMenu)の中に移動した。ハンバーガーボタン自体も
// マイページタブを表示している間だけ、MainTabNavigator側からrightAction="menu"が
// 渡されたときのみ表示する。
export default function AppHeader({ logoSource, backgroundColor, onLogoPress, rightAction = 'none', onMenuPress }: Props) {
  const logo = (
    <Image
      source={logoSource ?? require('../../assets/logo-header.png')}
      style={styles.logo}
      resizeMode="contain"
    />
  );

  return (
    <SafeAreaView
      edges={['top']}
      style={[styles.wrapper, backgroundColor ? { backgroundColor } : null]}
      pointerEvents="box-none"
    >
      <View style={styles.row} pointerEvents="box-none">
        {onLogoPress ? (
          <Pressable onPress={onLogoPress} hitSlop={10}>
            {logo}
          </Pressable>
        ) : (
          logo
        )}

        {rightAction === 'menu' && (
          <Pressable style={styles.menuButton} onPress={onMenuPress} hitSlop={10}>
            <Ionicons name="menu" size={26} color={colors.textPrimary} />
          </Pressable>
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 10,
  },
  row: {
    height: HEADER_CONTENT_HEIGHT,
    paddingHorizontal: 20,
    paddingBottom: 4,
    flexDirection: 'row',
    // ロゴ・トグルを行の下寄せにすることで、上部にだけ隙間ができるようにする
    alignItems: 'flex-end',
    justifyContent: 'space-between',
  },
  logo: { width: 84, height: 52 },
  menuButton: { padding: 4 },
});
