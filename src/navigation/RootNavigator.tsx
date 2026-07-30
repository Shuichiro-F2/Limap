import React from 'react';
import { ActivityIndicator, View } from 'react-native';
import { NavigationContainer, DarkTheme } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useAuth } from '../lib/AuthContext';
import AuthScreen from '../screens/AuthScreen';
import MainTabNavigator from './MainTabNavigator';
import SpotDetailScreen from '../screens/SpotDetailScreen';
import CreateSpotScreen from '../screens/CreateSpotScreen';
import LocationPickerScreen from '../screens/LocationPickerScreen';
import { colors } from '../lib/theme';
import type { RootStackParamList } from './types';

const Stack = createNativeStackNavigator<RootStackParamList>();

const navTheme = {
  ...DarkTheme,
  colors: {
    ...DarkTheme.colors,
    background: colors.background,
    card: colors.background,
    text: colors.textPrimary,
    border: colors.border,
    primary: colors.accent,
  },
};

export default function RootNavigator() {
  const { session, loading } = useAuth();

  if (loading) {
    return (
      <View style={{ flex: 1, backgroundColor: colors.background, alignItems: 'center', justifyContent: 'center' }}>
        <ActivityIndicator color={colors.textPrimary} />
      </View>
    );
  }

  return (
    <NavigationContainer theme={navTheme}>
      {!session ? (
        <AuthScreen />
      ) : (
        <Stack.Navigator
          screenOptions={{
            headerStyle: { backgroundColor: colors.background },
            headerTintColor: colors.textPrimary,
          }}
        >
          <Stack.Screen name="Main" component={MainTabNavigator} options={{ headerShown: false }} />
          <Stack.Screen
            name="SpotDetail"
            component={SpotDetailScreen}
            options={{
              title: '',
              headerStyle: { backgroundColor: colors.accent },
              headerTintColor: colors.accentText,
            }}
          />
          <Stack.Screen name="CreateSpot" component={CreateSpotScreen} options={{ title: '投稿する' }} />
          <Stack.Screen
            name="LocationPicker"
            component={LocationPickerScreen}
            options={{ title: '場所を選択', presentation: 'modal' }}
          />
        </Stack.Navigator>
      )}
    </NavigationContainer>
  );
}
