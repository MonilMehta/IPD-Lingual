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
      activeOpacity={0.8}
    >
      <View style={[styles.marker, isSelected && styles.selectedMarker]}>
        <Text style={styles.markerText}>●</Text>
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
    justifyContent: 'center',
  },
  marker: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#FF6B00',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#fff',
    shadowColor: '#FF6B00',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.4,
    shadowRadius: 6,
    elevation: 6,
  },
  selectedMarker: {
    borderColor: '#007AFF',
    borderWidth: 3,
  },
  markerText: {
    color: '#fff',
    fontSize: 20,
    fontWeight: 'bold',
    marginTop: -2,
  },
  labelContainer: {
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    paddingVertical: 6,
    paddingHorizontal: 14,
    borderRadius: 8,
    marginTop: 8,
    maxWidth: 120,
  },
  label: {
    color: '#fff',
    fontSize: 15,
    fontWeight: 'bold',
    textAlign: 'center',
  },
});