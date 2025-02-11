import { Stack } from 'expo-router';

export default function MainLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="home" />
      <Stack.Screen name="settings" />
      <Stack.Screen name="camera" />
      <Stack.Screen name="phrasebook" />
      <Stack.Screen name="allguides" />
    </Stack>
  );
}
