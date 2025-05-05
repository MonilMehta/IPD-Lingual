import React from 'react';
import { Stack } from 'expo-router';

export default function MainLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        animation: 'slide_from_right',
      }}
    >
      <Stack.Screen name="index" />
      <Stack.Screen name="camera" />
      <Stack.Screen name="voice" />
      <Stack.Screen name="phrasebook" />
      <Stack.Screen name="conversation" />
      <Stack.Screen name="settings" />
      <Stack.Screen name="pathway" />
            <Stack.Screen name="learn" />
            <Stack.Screen name="guides" />
      <Stack.Screen 
        name="challenge/[id]" 
        options={{
          animation: 'slide_from_bottom',
        }}
      />
    </Stack>
  );
}
