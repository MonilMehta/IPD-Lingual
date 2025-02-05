import React from 'react';
import { View, StyleSheet, Platform, Dimensions } from 'react-native';
import { Camera } from 'expo-camera/legacy';
import { CameraType } from 'expo-camera/legacy';
import { DetectedObject } from '../types';
import { ObjectMarker } from './ObjectMarker';

const SCREEN_WIDTH = Dimensions.get('window').width;
const SCREEN_HEIGHT = Dimensions.get('window').height;
const CAMERA_HEIGHT = Platform.OS === 'web' ? SCREEN_WIDTH * (3/4) : SCREEN_HEIGHT * 0.85;

interface CameraViewProps {
  cameraType: CameraType;
  detectedObjects: DetectedObject[];
  onObjectPress: (object: DetectedObject) => void;
}

export const CameraView: React.FC<CameraViewProps> = ({
  cameraType,
  detectedObjects,
  onObjectPress,
}) => {
  return (
    <View style={styles.cameraContainer}>
      <Camera style={styles.camera} type={cameraType}>
        <View style={styles.overlay}>
          {detectedObjects.map((obj) => (
            <ObjectMarker
              key={obj.id}
              object={obj}
              onPress={onObjectPress}
            />
          ))}
        </View>
      </Camera>
    </View>
  );
};

const styles = StyleSheet.create({
  cameraContainer: {
    width: SCREEN_WIDTH,
    height: CAMERA_HEIGHT,
    overflow: 'hidden',
    backgroundColor: '#000',
  },
  camera: {
    width: '100%',
    height: '100%',
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.2)',
  },
});