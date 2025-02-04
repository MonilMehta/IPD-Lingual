import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { DetectedObject } from '../../utils/types';

interface ObjectMarkerProps {
  object: DetectedObject;
  onPress: (object: DetectedObject) => void;
}

export const ObjectMarker: React.FC<ObjectMarkerProps> = ({ object, onPress }) => {
  return (
    <>
      {object.boundingBox && (
        <View
          style={[
            styles.boundingBox,
            {
              left: object.boundingBox.x1,
              top: object.boundingBox.y1,
              width: object.boundingBox.x2 - object.boundingBox.x1,
              height: object.boundingBox.y2 - object.boundingBox.y1,
            },
          ]}
        />
      )}
      <TouchableOpacity
        style={[styles.marker, { left: object.position.x, top: object.position.y }]}
        onPress={() => onPress(object)}
      >
        <View style={styles.markerDot} />
        <Text style={styles.markerText}>{object.translation || object.name}</Text>
      </TouchableOpacity>
    </>
  );
};
const styles = StyleSheet.create({
  boundingBox: {
    position: 'absolute',
    borderWidth: 2,
    borderColor: '#FF6B00',
    backgroundColor: 'rgba(255, 107, 0, 0.1)',
  },
  marker: {
    position: 'absolute',
    alignItems: 'center',
  },
  markerDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#FF6B00',
    borderWidth: 2,
    borderColor: 'white',
  },
  markerText: {
    color: 'white',
    backgroundColor: 'rgba(0,0,0,0.7)',
    padding: 4,
    borderRadius: 4,
    fontSize: 12,
    marginTop: 4,
  },
});