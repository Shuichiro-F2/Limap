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
  LocationPicker: { initialLat?: number; initialLng?: number } | undefined;
  UserProfile: { userId: string };
  Auth: undefined;
  About: undefined;
  Help: undefined;
  Privacy: undefined;
  Terms: undefined;
  EditProfile: undefined;
  FollowList: { userId: string; mode: 'followers' | 'following' };
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
