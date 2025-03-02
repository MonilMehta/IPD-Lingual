import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';

interface MarkerProps {
  position: {
    x: number;
    y: number;
  };
  isSelected: boolean;
  label: string;
  onPress: () => void;
}

export const Marker: React.FC<MarkerProps> = ({ position, isSelected, label, onPress }) => {
  return (
    <TouchableOpacity
      style={[
        styles.markerContainer,
        {
          transform: [
            { translateX: position.x },
            { translateY: position.y }
          ]
        }
      ]}
      onPress={onPress}
    >
      <View style={[styles.marker, isSelected && styles.selectedMarker]}>
        <View style={styles.dot} />
      </View>
      {isSelected && (
        <View style={styles.labelContainer}>
          <Text style={styles.label}>{label}</Text>
        </View>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  markerContainer: {
    position: 'absolute',
    alignItems: 'center',
  },
  marker: {
    width: 60,
    height: 60,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  selectedMarker: {
    backgroundColor: 'rgba(255, 255, 255, 0.6)',
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#fff',
  },
  labelContainer: {
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    padding: 8,
    borderRadius: 4,
    marginTop: 4,
  },
  label: {
    color: '#fff',
    fontSize: 14,
  },
});