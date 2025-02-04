import React from 'react';
import { View, Text, StyleSheet, Dimensions } from 'react-native';

interface Detection {
  id: string;
  name: string;
  translation?: string;
  confidence: number;
  boundingBox: {
    x1: number;
    y1: number;
    x2: number;
    y2: number;
  };
}

interface Props {
  detections: Detection[];
  imageSize: {
    width: number;
    height: number;
  };
}

export const BoundingBox: React.FC<Props> = ({ detections, imageSize }) => {
  const getConfidenceColor = (confidence: number): string => {
    if (confidence > 0.7) return '#00FF00';
    if (confidence > 0.5) return '#FFFF00';
    return '#FF0000';
  };

  return (
    <>
      {detections.map((detection) => {
        const { x1, y1, x2, y2 } = detection.boundingBox;
        
        // Convert normalized coordinates to pixel values
        const left = x1 * imageSize.width;
        const top = y1 * imageSize.height;
        const width = (x2 - x1) * imageSize.width;
        const height = (y2 - y1) * imageSize.height;

        return (
          <View
            key={detection.id}
            style={[
              styles.boundingBox,
              {
                left,
                top,
                width,
                height,
                borderColor: getConfidenceColor(detection.confidence),
              },
            ]}
          >
            <View style={styles.labelContainer}>
              <Text style={styles.label}>
                {detection.translation || detection.name}
                {' '}
                {Math.round(detection.confidence * 100)}%
              </Text>
            </View>
          </View>
        );
      })}
    </>
  );
};

const styles = StyleSheet.create({
  boundingBox: {
    position: 'absolute',
    borderWidth: 2,
    backgroundColor: 'transparent',
  },
  labelContainer: {
    position: 'absolute',
    top: -24,
    left: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    padding: 4,
    borderRadius: 4,
  },
  label: {
    color: 'white',
    fontSize: 12,
    fontWeight: 'bold',
  },
});