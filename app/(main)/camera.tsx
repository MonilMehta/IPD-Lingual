import React from 'react';
import GoogleVisionCamera from '@/screens/Camera/googleVision';
import CameraScreen from '@/screens/Camera';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useState } from 'react';

export default function Camera() {
  const [useGoogleVision, setUseGoogleVision] = useState(true);
  
  return (
    <View style={styles.container}>
      {useGoogleVision ? <GoogleVisionCamera /> : <CameraScreen />}
      
      <TouchableOpacity 
        style={styles.modeSwitch}
        onPress={() => setUseGoogleVision(!useGoogleVision)}
      >
        <Text style={styles.modeSwitchText}>
          {useGoogleVision ? "Switch to TensorFlow.js" : "Switch to Google Vision"}
        </Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    position: 'relative'
  },
  modeSwitch: {
    position: 'absolute',
    top: 40,
    right: 10,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 16
  },
  modeSwitchText: {
    color: 'white',
    fontSize: 12
  }
});