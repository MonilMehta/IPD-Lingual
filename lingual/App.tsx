import React, { useEffect } from 'react';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { Platform } from 'react-native';
import RootLayout from './app/_layout'; // Ensure correct import path

// Initialize gesture handler before anything else
if (Platform.OS === 'web') {
  const { initialize } = require('react-native-gesture-handler/lib/web');
  initialize();
}

export default function App(props) {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <RootLayout {...props} />
    </GestureHandlerRootView>
  );
}