import type { CompositeScreenProps, NavigatorScreenParams } from '@react-navigation/native';
import type { BottomTabScreenProps } from '@react-navigation/bottom-tabs';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';

export type MainTabParamList = {
  MapTab: { focusLat?: number; focusLng?: number } | undefined;
  SearchTab: { tagId?: number } | undefined;
  MyPageTab: undefined;
};

export type RootStackParamList = {
  Main: NavigatorScreenParams<MainTabParamList> | undefined;
  SpotDetail: { spotId: string };
  CreateSpot: { pickedLat?: number; pickedLng?: number } | undefined;
  LocationPicker: { initialLat?: number; initialLng?: number } | undefined;
  UserProfile: { userId: string };
  Auth: undefined;
};

// タブ内の画面（Map/Search/MyPage）は、タブ自身の画面遷移に加えて
// 親であるRootStack側の画面（SpotDetailなど）にも遷移できる必要があるため、
// CompositeScreenPropsで両方のナビゲーション型を合成する
export type MainTabScreenProps<T extends keyof MainTabParamList> = CompositeScreenProps<
  BottomTabScreenProps<MainTabParamList, T>,
  NativeStackScreenProps<RootStackParamList>
>;

export type RootStackScreenProps<T extends keyof RootStackParamList> = NativeStackScreenProps<
  RootStackParamList,
  T
>;
