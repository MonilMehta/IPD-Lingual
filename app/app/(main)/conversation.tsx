import React from 'react';
import { Stack } from 'expo-router';
import ConversationScreen from '../../screens/ConversationScreen';

export default function ConversationRoute() {
  return (
    <>
      <Stack.Screen 
        options={{ 
          headerShown: false,
          title: 'Conversation Translator'
        }} 
      />
      <ConversationScreen />
    </>
  );
}
