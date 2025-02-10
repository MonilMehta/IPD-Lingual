import { Stack } from "expo-router";

export default function MainLayout() {
  console.log('Control in main')
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="home" />
      <Stack.Screen name="camera" />
      <Stack.Screen name="settings" />
      <Stack.Screen name="profile" />
      <Stack.Screen name="voicetranslation" />
      <Stack.Screen name="phrasebook" />
    
    </Stack>
  );
}