import React from 'react';
import { View, TouchableOpacity, Text, StyleSheet, Dimensions } from 'react-native';
import { DetectedObject } from '@/utils/types';

const SCREEN_WIDTH = Dimensions.get('window').width;
const CAMERA_HEIGHT = Dimensions.get('window').height * 0.85;

interface ObjectOverlayProps {
  detectedObjects: DetectedObject[];
  onObjectPress: (object: DetectedObject) => void;
}

export const ObjectOverlay: React.FC<ObjectOverlayProps> = ({ 
  detectedObjects, 
  onObjectPress 
}) => {
  const cameraAspect = 3/4;
  const screenAspect = SCREEN_WIDTH / CAMERA_HEIGHT;
  const scaleFactor = screenAspect > cameraAspect 
    ? CAMERA_HEIGHT / 640 
    : SCREEN_WIDTH / 640;

  return (
    <View style={styles.overlay}>
      {detectedObjects.map((obj) => {
        if (!obj.boundingBox) return null;
        
        const left = obj.boundingBox.x1 * scaleFactor;
        const top = obj.boundingBox.y1 * scaleFactor;
        const width = (obj.boundingBox.x2 - obj.boundingBox.x1) * scaleFactor;
        const height = (obj.boundingBox.y2 - obj.boundingBox.y1) * scaleFactor;

        return (
          <TouchableOpacity
            key={obj.id}
            onPress={() => onObjectPress(obj)}
            style={[
              styles.objectBox,
              {
                left,
                top,
                width,
                height,
              }
            ]}
          >
            <View style={styles.boxLabel}>
              <Text style={styles.boxText}>
                {obj.translation} ({(obj.confidence * 100).toFixed(0)}%)
              </Text>
            </View>
          </TouchableOpacity>
        );
      })}
    </View>
  );
};

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.2)',
  },
  objectBox: {
    position: 'absolute',
    borderWidth: 2,
    borderColor: '#FF6B00',
    backgroundColor: 'rgba(255, 107, 0, 0.2)',
  },
  boxLabel: {
    position: 'absolute',
    top: -20,
    left: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    padding: 4,
    borderRadius: 4,
  },
  boxText: {
    color: 'white',
    fontSize: 12,
  },
});