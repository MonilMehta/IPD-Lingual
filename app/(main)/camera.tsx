import React from 'react';
import { View, Platform } from 'react-native';
import CameraScreen from '@/screens/Camera';
import { WebCamera } from '@/screens/Camera/WebCamera';

export default function Camera({ route, navigation }: any) {
  // Check if we're running on web
  if (Platform.OS === 'web') {
    return (
      <View style={{ flex: 1 }}>
        <WebCamera navigation={navigation} />
      </View>
    );
  }
  
  // Otherwise render native camera
  return (
    <View style={{ flex: 1 }}>
      <CameraScreen navigation={navigation} />
    </View>
  );
}
