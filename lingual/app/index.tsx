import React, { useEffect, useState } from 'react';

// Extend the global object to include the tf property
declare global {
  var tf: typeof import('@tensorflow/tfjs');
}
import { Platform } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { router } from 'expo-router';
import LandingScreen from '../screens/LandingScreen';

// Fix for TensorFlow.js navigator issue
if (typeof navigator === 'undefined') {
  if (Platform.OS === 'android' || Platform.OS === 'ios') {
    global.navigator = {
      product: 'ReactNative',
      userAgent: 'ReactNative',
    } as any;
  }
}

// Load TensorFlow only here
import * as tf from '@tensorflow/tfjs';

export default function Index(props) {
  const [tfReady, setTfReady] = useState(false);
  console.log('Control in index');

  useEffect(() => {
    const initializeTF = async () => {
      try {
        await tf.ready();
        console.log('TensorFlow.js initialized');
        global.tf = tf; // assign loaded tf to global reference
        setTfReady(true);
      } catch (error) {
        console.error('TensorFlow.js failed to initialize:', error);
      }
    };
    initializeTF();
  }, []);

  const navigation = {
    navigate: (screen: string) => router.push(`/(auth)/${screen.toLowerCase()}`),
  };

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <LandingScreen navigation={navigation} />
    </GestureHandlerRootView>
  );
}