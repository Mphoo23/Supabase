import { useColorScheme } from '@/hooks/use-color-scheme';
import { useAuthStore } from '@/store/useAuthStore';
import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { Stack, useRouter, useSegments } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import 'react-native-reanimated';
import '../global.css';

import { GluestackUIProvider } from '@/components/ui/gluestack-ui-provider';
import { ActivityIndicator, View } from 'react-native';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

const queryClient = new QueryClient();

export const unstable_settings = {
  anchor: '(tabs)',
};

export default function RootLayout() {

  const { initialize, isLoading , session } = useAuthStore()
  const colorScheme = useColorScheme();
  const segments = useSegments(); 
const router = useRouter(); 
useEffect(() => {
initialize();
}, []);

useEffect(() => {
  if (isLoading) return;

  const inAuthGroup = segments[0] === 'auth';

  if (!session && !inAuthGroup) {
    router.replace('/auth/login');
  }

  if (session && (inAuthGroup || segments[0] === undefined)) {
    router.replace('../(protected)');
  }
}, [session, isLoading, segments]);
if (isLoading) {
return (
<View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
<ActivityIndicator size="large" />
</View>
)}
return (
    <QueryClientProvider client={queryClient}>
      <GluestackUIProvider mode="light">
        <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
          <Stack>
            <Stack.Screen name="index" options={{ headerShown: false }} />
            <Stack.Screen name="(protected)" options={{ headerShown: false }} />
            <Stack.Screen name="auth" options={{ headerShown: false }} />
          </Stack>
          <StatusBar style="auto" />
        </ThemeProvider>
      </GluestackUIProvider>
    </QueryClientProvider>
  );
}
