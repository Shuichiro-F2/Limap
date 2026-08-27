import type { CompositeScreenProps, NavigatorScreenParams } from '@react-navigation/native';
import type { MaterialTopTabScreenProps } from '@react-navigation/material-top-tabs';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';

export type MainTabParamList = {
  MapTab: { focusLat?: number; focusLng?: number } | undefined;
  FeedTab: undefined;
  SearchTab: { tagId?: number } | undefined;
  ArticlesTab: undefined;
  MyPageTab: undefined;
};

export type RootStackParamList = {
  Main: NavigatorScreenParams<MainTabParamList> | undefined;
  SpotDetail: { spotId: string };
  CreateSpot: { pickedLat?: number; pickedLng?: number } | undefined;
  EditSpot: { spotId: string; pickedLat?: number; pickedLng?: number };
  // spotIdは対象スポットのLIMap ID(slug)。入力途中の内容(タイトルは除く)を
  // 新規投稿画面から引き継ぐ場合はsrc/lib/reviewDraft.tsの下書きストアを使う
  // (画像などシリアライズできない値を含むため、route paramsには含めない)。
  AddReview: { spotId: string };
  // returnTo/spotIdは「地図から選択」の呼び出し元がCreateSpot/EditSpotのどちらかを
  // 判別し、確定後に正しい画面(+編集対象)へ戻すために使う(未指定時はCreateSpotへ戻る)
  LocationPicker:
    | { initialLat?: number; initialLng?: number; returnTo?: 'CreateSpot' | 'EditSpot'; spotId?: string }
    | undefined;
  UserProfile: { userId: string };
  Auth: undefined;
  About: undefined;
  Help: undefined;
  Privacy: undefined;
  Terms: undefined;
  AddToHomeScreen: undefined;
  EditProfile: undefined;
  FollowList: { userId: string; mode: 'followers' | 'following' };
  BlockedUsers: undefined;
};

// タブ内の画面（Map/Search/MyPage）は、タブ自身の画面遷移に加えて
// 親であるRootStack側の画面（SpotDetailなど）にも遷移できる必要があるため、
// CompositeScreenPropsで両方のナビゲーション型を合成する。
// タブはスワイプ切り替えのためmaterial-top-tabs（tabBarPosition: 'bottom'）で実装している。
export type MainTabScreenProps<T extends keyof MainTabParamList> = CompositeScreenProps<
  MaterialTopTabScreenProps<MainTabParamList, T>,
  NativeStackScreenProps<RootStackParamList>
>;

export type RootStackScreenProps<T extends keyof RootStackParamList> = NativeStackScreenProps<
  RootStackParamList,
  T
>;
