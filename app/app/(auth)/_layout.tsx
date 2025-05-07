import React, { useEffect } from 'react';
import { Stack, useRouter } from 'expo-router';
export default function AuthLayout() {

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="login" />
      <Stack.Screen name="signup" />
      <Stack.Screen name="forgotPassword" />
    </Stack>
  );
}
