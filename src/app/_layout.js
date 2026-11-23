import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';

export default function RootLayout() {
  return (
    <>
      <StatusBar style="dark" />
      <Stack
        screenOptions={{
          headerTitleAlign: 'center',
          headerTintColor: '#0f172a',
          headerStyle: { backgroundColor: '#ffffff' },
          contentStyle: { backgroundColor: '#ffffff' },
        }}
      >
        <Stack.Screen name="index" options={{ headerShown: false }} />
        <Stack.Screen name="footwork" options={{ title: '풋워크 연습' }} />
        <Stack.Screen name="forehand-backhand" options={{ title: '포핸드/백핸드 전환 연습' }} />
      </Stack>
    </>
  );
}
