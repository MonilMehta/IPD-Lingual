import React from 'react';
import { View, TouchableOpacity, Text, StyleSheet, Platform } from 'react-native';
import { FlipHorizontal, Upload, ChevronLeft } from 'lucide-react-native';

interface CameraControlsProps {
  onFlipCamera: () => void;
  onCapture: () => void;
  onUpload?: () => void;
  onBack: () => void;
  isProcessing: boolean;
}

export const CameraControls: React.FC<CameraControlsProps> = ({
  onFlipCamera,
  onCapture,
  onUpload,
  onBack,
  isProcessing
}) => {
  return (
    <View style={styles.container}>
      <TouchableOpacity 
        style={styles.backButton}
        onPress={onBack}
      >
        <ChevronLeft color="white" size={24} />
      </TouchableOpacity>

      <View style={styles.controlsContainer}>
        <TouchableOpacity 
          style={styles.controlButton}
          onPress={onFlipCamera}
        >
          <FlipHorizontal color="white" size={24} />
          <Text style={styles.controlText}>Flip</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={styles.captureButton}
          onPress={onCapture}
          disabled={isProcessing}
        >
          <View style={[
            styles.captureOuter,
            isProcessing && styles.captureProcessing
          ]}>
            <View style={styles.captureInner} />
          </View>
        </TouchableOpacity>

        {Platform.OS === 'web' && onUpload && (
          <TouchableOpacity 
            style={styles.controlButton}
            onPress={onUpload}
          >
            <Upload color="white" size={24} />
            <Text style={styles.controlText}>Upload</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#000',
    paddingHorizontal: 20,
    paddingVertical: 10,
  },
  backButton: {
    position: 'absolute',
    top: 10,
    left: 10,
    zIndex: 10,
  },
  controlsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    marginTop: 20,
  },
  controlButton: {
    alignItems: 'center',
  },
  controlText: {
    color: 'white',
    marginTop: 8,
    fontSize: 12,
  },
  captureButton: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  captureOuter: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: 'rgba(255,255,255,0.3)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  captureInner: {
    width: 54,
    height: 54,
    borderRadius: 27,
    backgroundColor: 'white',
  },
  captureProcessing: {
    borderWidth: 2,
    borderColor: '#FF6B00',
  },
});