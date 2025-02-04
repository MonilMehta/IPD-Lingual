import React, { useRef, useState } from 'react';
import { View, StyleSheet, TouchableOpacity, Text, ActivityIndicator } from 'react-native';
import { Camera, CameraType } from 'expo-camera/legacy';
import { DetectedObject } from '@/utils/types';
import { ObjectMarker } from './ObjectMarker';
import { ObjectDetector } from '@/utils/objectDetection';
import * as Speech from 'expo-speech';

interface CameraViewProps {
  cameraType: CameraType;
  detectedObjects: DetectedObject[];
  onObjectPress: (object: DetectedObject) => void;
  onDetectedObjects: (objects: DetectedObject[]) => void;
}

export const CameraView: React.FC<CameraViewProps> = ({
  cameraType,
  detectedObjects,
  onObjectPress,
  onDetectedObjects,
}) => {
  const cameraRef = useRef<Camera>(null);
  const [isDetecting, setIsDetecting] = useState(false);
  const objectDetector = useRef(new ObjectDetector()).current;

  const handleDetectObjects = async () => {
    if (isDetecting || !cameraRef.current) return;

    try {
      setIsDetecting(true);
      
      const photo = await cameraRef.current.takePictureAsync({
        quality: 0.5,
        base64: true,
        skipProcessing: true,
      });

      const detectedObjects = await objectDetector.detect(photo.uri);
      onObjectPress(null); 
      onDetectedObjects(detectedObjects);
    } catch (error) {
      console.error('Error detecting objects:', error);
    } finally {
      setIsDetecting(false);
    }
  };

  const speakTranslated = (label: string) => {
    Speech.speak(label, {
      language: 'en', // or your chosen locale
    });
  };

  return (
    <View style={styles.cameraContainer}>
      <Camera 
        ref={cameraRef}
        style={styles.camera} 
        type={cameraType}
      >
        <View style={styles.overlay}>
          {detectedObjects.map((obj) => (
            <View key={obj.id}>
              <ObjectMarker object={obj} onPress={onObjectPress} />
              <TouchableOpacity
                style={styles.readButton}
                onPress={() => speakTranslated(obj.translation)}
              >
                <Text style={styles.readButtonText}>Read: {obj.translation}</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.saveButton}
                onPress={() => {/* Save to vocab logic here */}}
              >
                <Text style={styles.saveButtonText}>Save {obj.name}</Text>
              </TouchableOpacity>
            </View>
          ))}
          
          {isDetecting && (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color="#FF6B00" />
              <Text style={styles.loadingText}>Hold still, detecting objects...</Text>
            </View>
          )}
          
          <TouchableOpacity 
            style={styles.detectButton}
            onPress={handleDetectObjects}
            disabled={isDetecting}
          >
            <Text style={styles.detectButtonText}>
              {isDetecting ? 'Detecting...' : 'Detect Objects'}
            </Text>
          </TouchableOpacity>
        </View>
      </Camera>
    </View>
  );
};

const styles = StyleSheet.create({
  cameraContainer: {
    flex: 1,
  },
  camera: {
    flex: 1,
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
  },
  loadingContainer: {
    position: 'absolute',
    top: '50%',
    left: 0,
    right: 0,
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.7)',
    padding: 20,
  },
  loadingText: {
    color: 'white',
    marginTop: 10,
    fontSize: 16,
  },
  detectButton: {
    position: 'absolute',
    bottom: 30,
    alignSelf: 'center',
    backgroundColor: '#FF6B00',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 25,
  },
  detectButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  readButton: {
    position: 'absolute',
    left: 20,
    bottom: 60,
    backgroundColor: '#FF6B00',
    padding: 8,
    borderRadius: 8,
    marginTop: 4,
  },
  readButtonText: {
    color: '#FFF',
  },
  saveButton: {
    position: 'absolute',
    left: 20,
    bottom: 20,
    backgroundColor: '#0066FF',
    padding: 8,
    borderRadius: 8,
  },
  saveButtonText: {
    color: '#FFF',
  },
});


