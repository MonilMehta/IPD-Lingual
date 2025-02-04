import React, { useState, useRef, useEffect } from 'react';
import { View, StyleSheet, Platform, Text, TouchableOpacity } from 'react-native';
import { Camera, CameraType, FlashMode } from 'expo-camera/legacy';
import * as Speech from 'expo-speech';
import { ObjectDetector } from '@/utils/objectDetection';
import { DetectedObject } from '@/utils/types';
import { CameraControls } from './Camera/CameraControls';
import { ObjectOverlay } from './Camera/ObjectOverlay';
import { BottomSheet } from './components/BottomSheet';

export default function CameraScreen({ navigation }) {
  const [facing, setFacing] = useState(CameraType.back);
  const [permission, requestPermission] = Camera.useCameraPermissions();
  const [detectedObjects, setDetectedObjects] = useState<DetectedObject[]>([]);
  const [selectedObject, setSelectedObject] = useState<DetectedObject | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isDetecting, setIsDetecting] = useState(false);
  const [flash, setFlash] = useState(FlashMode.off);
  
  const cameraRef = useRef<Camera>(null);
  const objectDetectorRef = useRef(new ObjectDetector());
  const detectionIntervalRef = useRef<NodeJS.Timeout | null>(null);

  const captureAndProcess = async () => {
    if (!cameraRef.current || isProcessing) return;
    
    try {
      setIsProcessing(true);
      
      const photo = await cameraRef.current.takePictureAsync({
        quality: 0.8,
        base64: true,
      });
      
      const detections = await objectDetectorRef.current.detect(photo.uri);
      setDetectedObjects(detections);
      
      if (detections.length > 0) {
        Speech.speak(detections[0].translation, { language: 'en' });
      }
    } catch (error) {
      console.error('Error capturing image:', error);
    } finally {
      setIsProcessing(false);
    }
  };

  const startDetection = () => {
    setIsDetecting(true);
    // Initial capture
    captureAndProcess();
    
    // Set interval for subsequent captures
    detectionIntervalRef.current = setInterval(captureAndProcess, 15000);
  };

  const stopDetection = () => {
    setIsDetecting(false);
    if (detectionIntervalRef.current) {
      clearInterval(detectionIntervalRef.current);
      detectionIntervalRef.current = null;
    }
  };

  useEffect(() => {
    return () => {
      if (detectionIntervalRef.current) {
        clearInterval(detectionIntervalRef.current);
      }
    };
  }, []);

  const handleObjectPress = (object: DetectedObject) => {
    setSelectedObject(object);
  };

  const handleBack = () => {
    navigation.goBack();
  };

  const handleFileUpload = async () => {
    if (Platform.OS === 'web') {
      const input = document.createElement('input');
      input.type = 'file';
      input.accept = 'image/*';
      input.onchange = async (e: any) => {
        const file = e.target.files[0];
        const reader = new FileReader();
        reader.onload = async (event) => {
          const uri = event.target?.result as string;
          // Process uploaded image
          const detections = await objectDetectorRef.current.detect(uri);
          setDetectedObjects(detections);
        };
        reader.readAsDataURL(file);
      };
      input.click();
    }
  };

  if (!permission) {
    return <View style={styles.container} />;
  }

  if (!permission.granted) {
    return (
      <View style={styles.container}>
        <Text style={styles.permissionText}>We need your permission to show the camera</Text>
        <TouchableOpacity 
          style={styles.permissionButton} 
          onPress={requestPermission}
        >
          <Text style={styles.permissionButtonText}>Grant Permission</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Camera
        ref={cameraRef}
        style={styles.camera}
        type={facing}
        flashMode={flash}
      >
        <ObjectOverlay 
          detectedObjects={detectedObjects} 
          onObjectPress={handleObjectPress} 
        />
      </Camera>

      <CameraControls 
        onFlipCamera={() => setFacing(
          current => current === CameraType.back ? CameraType.front : CameraType.back
        )}
        onCapture={isDetecting ? stopDetection : startDetection}
        onUpload={handleFileUpload}
        onBack={handleBack}
        isProcessing={isProcessing}
      />

      {selectedObject && (
        <BottomSheet
          visible={!!selectedObject}
          onClose={() => setSelectedObject(null)}
        >
          <View style={styles.bottomSheetContent}>
            <Text style={styles.objectName}>{selectedObject.name}</Text>
            <Text style={styles.objectTranslation}>{selectedObject.translation}</Text>
            <Text style={styles.objectDescription}>
              Detected with {(selectedObject.confidence * 100).toFixed(0)}% confidence
            </Text>
          </View>
        </BottomSheet>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'black',
  },
  camera: {
    flex: 1,
    width: '100%',
    height: '100%',
  },
  bottomSheetContent: {
    padding: 20,
  },
  objectName: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  objectTranslation: {
    fontSize: 18,
    color: '#666',
    marginBottom: 12,
  },
  objectDescription: {
    fontSize: 14,
    color: '#444',
  },
  permissionText: {
    color: 'white',
    textAlign: 'center',
    marginBottom: 20,
  },
  permissionButton: {
    backgroundColor: '#FF6B00',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    alignSelf: 'center',
  },
  permissionButtonText: {
    color: 'white',
    fontWeight: '600',
  },
});

