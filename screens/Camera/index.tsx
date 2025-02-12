import React, { useState, useEffect, useRef } from 'react';
import { View, Text, TouchableOpacity, ActivityIndicator, StyleSheet, Platform } from 'react-native';
import { Camera, CameraView, CameraType } from 'expo-camera';
import * as tf from "@tensorflow/tfjs";
import "@tensorflow/tfjs-react-native";
import * as cocossd from "@tensorflow-models/coco-ssd";
import { decodeJpeg } from '@tensorflow/tfjs-react-native';
import ObjectBox from './components/object-box';

export default function CameraScreen() {
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [model, setModel] = useState<cocossd.ObjectDetection | null>(null);
  const [isModelLoaded, setIsModelLoaded] = useState(false);
  const [predictions, setPredictions] = useState<cocossd.DetectedObject[]>([]);
  const [cameraFacing, setCameraFacing] = useState<CameraType>('back');
  const [isProcessing, setIsProcessing] = useState(false);
  const [isCameraReady, setIsCameraReady] = useState(false);
  const cameraRef = useRef<Camera>(null);
  const isComponentMounted = useRef(true);

  useEffect(() => {
    console.log('Component mounted');
    initializeApp();
    return () => {
      console.log('Component unmounting');
      isComponentMounted.current = false;
    };
  }, []);

  useEffect(() => {
    if (isModelLoaded && isCameraReady) {
      console.log('Both model and camera ready, starting detection loop');
      detectObjects();
    }
  }, [isModelLoaded, isCameraReady]);

  const initializeApp = async () => {
    try {
      console.log('Requesting camera permission');
      const { status } = await Camera.requestCameraPermissionsAsync();
      console.log('Camera permission status:', status);
      setHasPermission(status === 'granted');
      
      console.log('Initializing TensorFlow');
      await tf.ready();
      
      // Setting optimal configurations for React Native
      console.log('Configuring TensorFlow backend');
      await tf.setBackend('rn-webgl');
      tf.env().set('WEBGL_FORCE_F16_TEXTURES', false);
      tf.env().set('WEBGL_VERSION', 2);
      tf.env().set('WEBGL_CPU_FORWARD', true);
      tf.env().set('WEBGL_PACK', false);
      
      console.log('Loading COCO-SSD model with lite configuration');
      const loadedModel = await cocossd.load({
        base: 'lite_mobilenet_v2',
        modelUrl: undefined  // Forces using the lite version
      });
      console.log('Model loaded successfully');
      setModel(loadedModel);
      setIsModelLoaded(true);
    } catch (error) {
      console.error('Initialization error:', error);
    }
  };

  const detectObjects = async () => {
    if (!isComponentMounted.current) return;
    
    if (!isProcessing && cameraRef.current && model) {
      setIsProcessing(true);
      const startTime = Date.now();
      
      try {
        console.log('Capturing frame');
        const photo = await cameraRef.current.takePictureAsync({
          base64: true,
          quality: 0.3, // Reduced quality for better performance
          skipProcessing: true,
        });

        if (photo.base64 && isComponentMounted.current) {
          console.log('Converting frame to tensor');
          const imgBuffer = tf.util.encodeString(photo.base64, 'base64').buffer;
          const raw = new Uint8Array(imgBuffer);
          const imageTensor = decodeJpeg(raw);

          console.log('Running detection');
          // Using confidence threshold of 0.66 like the web version
          const detections = await model.detect(imageTensor as tf.Tensor3D);
          console.log('Raw detections:', detections);
          
          if (isComponentMounted.current) {
            const filteredDetections = detections.filter(detection => detection.score > 0.66);
            console.log('Filtered detections:', filteredDetections);
            setPredictions(filteredDetections);
          }
          
          tf.dispose(imageTensor);
        }
      } catch (error) {
        console.error('Detection error:', error);
      } finally {
        const processingTime = Date.now() - startTime;
        console.log(`Frame processed in ${processingTime}ms`);
        setIsProcessing(false);
        
        // Use requestAnimationFrame like the web version for better performance
        if (isComponentMounted.current) {
          requestAnimationFrame(detectObjects);
        }
      }
    } else {
      // If we can't process now, try again in the next frame
      requestAnimationFrame(detectObjects);
    }
  };

  const renderBoxes = () => {
    return predictions.map((prediction, index) => {
      console.log(`Rendering detection ${index}:`, prediction);
      return (
        <ObjectBox
          key={index}
          box={prediction.bbox}
          label={`${prediction.class} ${Math.round(prediction.score * 100)}%`}
          score={prediction.score}
        />
      );
    });
  };

  if (hasPermission === null) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color="#0000ff" />
      </View>
    );
  }

  if (hasPermission === false) {
    return (
      <View style={styles.container}>
        <Text style={styles.text}>No access to camera</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.cameraView}>
        <CameraView
          ref={cameraRef}
          style={styles.camera}
          facing={cameraFacing}
          onCameraReady={() => {
            console.log('Camera ready');
            setIsCameraReady(true);
          }}
        >
          <View style={styles.boxOverlay}>
            {renderBoxes()}
          </View>
        </CameraView>
        <TouchableOpacity 
          style={styles.button} 
          onPress={() => {
            console.log('Toggling camera');
            setCameraFacing(current => current === 'back' ? 'front' : 'back');
            setPredictions([]);
          }}
        >
          <Text style={styles.buttonText}>Flip Camera</Text>
        </TouchableOpacity>
      </View>
      {!isModelLoaded && (
        <View style={styles.modelLoading}>
          <ActivityIndicator size="large" color="#0000ff" />
          <Text style={styles.loadingText}>Loading TensorFlow model...</Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  camera: {
    flex: 1,
    width: '100%',
    height: '100%',
  },
  cameraView: {
    flex: 1,
    width: '100%',
    height: '80%',
    position: 'relative',
  },
  boxOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  button: {
    position: 'absolute',
    bottom: 20,
    alignSelf: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.7)',
    padding: 15,
    borderRadius: 10,
    zIndex: 2,
  },
  buttonText: {
    fontSize: 16,
    color: '#000',
  },
  text: {
    color: '#fff',
    fontSize: 16,
    textAlign: 'center',
  },
  modelLoading: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    color: '#fff',
    marginTop: 10,
  },
});