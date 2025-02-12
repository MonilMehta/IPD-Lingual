import React, { useState, useEffect, useRef } from 'react';
import { View, Text, TouchableOpacity, ActivityIndicator, StyleSheet, Platform } from 'react-native';
import { Camera, CameraView, CameraType } from 'expo-camera';
import { GLView } from 'expo-gl';
import * as tf from "@tensorflow/tfjs";
import "@tensorflow/tfjs-react-native";
import * as cocossd from "@tensorflow-models/coco-ssd";
import {  decode } from 'js-base64';
import { Marker } from './marker';
import { decodeJpeg } from '@tensorflow/tfjs-react-native';
import { Base64 } from 'js-base64';


export default function CameraScreen() {
  console.log('Rendering CameraScreen component');
  
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [model, setModel] = useState<cocossd.ObjectDetection | null>(null);
  const [isModelLoaded, setIsModelLoaded] = useState(false);
  const [isTfReady, setIsTfReady] = useState(false);
  const [predictions, setPredictions] = useState<cocossd.DetectedObject[]>([]);
  const [cameraFacing, setCameraFacing] = useState<CameraType>('back');
  const [isProcessing, setIsProcessing] = useState(false);
  const [selectedObject, setSelectedObject] = useState<number | null>(null);
  const [frameCount, setFrameCount] = useState(0);
  
  const cameraRef = useRef<Camera>(null);
  const glRef = useRef<WebGLRenderingContext | null>(null);
  const isComponentMounted = useRef(true);
  const processingTimeRef = useRef<number[]>([]);
  const modelRef = useRef<cocossd.ObjectDetection | null>(null);

  useEffect(() => {
    console.log('Model state vs ref:', {
      modelState: !!model,
      modelRef: !!modelRef.current,
      isModelLoaded
    });
  }, [model, isModelLoaded]);

  useEffect(() => {
    console.log('Component mounted, initializing...');
    initializeApp();
    
    return () => {
      console.log('Component unmounting, cleaning up...');
      isComponentMounted.current = false;
      if (glRef.current) {
        console.log('Clearing GL context');
        glRef.current = null;
      }
    };
  }, []);

  useEffect(() => {
    console.log('TF ready state changed:', isTfReady);
    if (isTfReady) {
      console.log('TensorFlow is ready, loading model...');
      loadModel();
    }
  }, [isTfReady]);

  useEffect(() => {
    if (processingTimeRef.current.length > 0) {
      const avgTime = processingTimeRef.current.reduce((a, b) => a + b, 0) / processingTimeRef.current.length;
      console.log(`Average processing time: ${avgTime.toFixed(2)}ms over ${processingTimeRef.current.length} frames`);
    }
  }, [frameCount]);

  const onGLContextCreate = async (gl: WebGLRenderingContext) => {
    console.log('GL Context creation started');
    glRef.current = gl;
    
    try {
      console.log('Initializing TensorFlow backend...');
      await tf.ready();
      console.log('Setting TF backend to rn-webgl');
      await tf.setBackend('rn-webgl');
      
      console.log('Configuring TensorFlow backend settings');
      tf.env().set('WEBGL_FORCE_F16_TEXTURES', false);
      tf.env().set('WEBGL_VERSION', 2);
      tf.env().set('WEBGL_CPU_FORWARD', true);
      tf.env().set('WEBGL_PACK', false);
      
      const backend = tf.getBackend();
      console.log('TensorFlow backend configured:', backend);
      setIsTfReady(true);
    } catch (error) {
      console.error('TF initialization error:', error);
    }
  };

  const initializeApp = async () => {
    try {
      console.log('Requesting camera permissions...');
      const { status } = await Camera.requestCameraPermissionsAsync();
      console.log('Camera permission status:', status);
      setHasPermission(status === 'granted');
    } catch (error) {
      console.error('Camera initialization error:', error);
    }
  };

  const loadModel = async () => {
    try {
      console.log('Starting COCO-SSD model loading...');
      const loadedModel = await cocossd.load({
        base: 'lite_mobilenet_v2',
        modelUrl: undefined
      });
      
      if (!loadedModel) {
        console.error('Model loading failed - model is null');
        return;
      }
      
      console.log('COCO-SSD model loaded successfully');
      modelRef.current = loadedModel;
      setModel(loadedModel);
      setIsModelLoaded(true);
      
      console.log('Model ref updated:', !!modelRef.current);
      console.log('Starting detection...');
      
      setTimeout(() => {
        if (isComponentMounted.current) {
          startDetection();
        }
      }, 100);
      
    } catch (error) {
      console.error('Model loading error:', error);
    }
  };

  const startDetection = () => {
    console.log('startDetection called');
    console.log('Model ref state:', !!modelRef.current);
    
    if (!cameraRef.current) {
      console.log('Camera ref not ready');
      return;
    }
    if (!glRef.current) {
      console.log('GL context not ready');
      return;
    }
    if (!modelRef.current) {
      console.log('Model ref not ready');
      return;
    }
    
    console.log('All prerequisites met, starting detection loop');
    requestAnimationFrame(processFrame);
  };

  const processFrame = async () => {
    if (!isComponentMounted.current) {
      console.log('Skipping: component not mounted');
      return;
    }

    if (!modelRef.current) {
      console.log('Skipping: model ref not ready');
      return;
    }

    if (isProcessing) {
      console.log('Skipping: already processing a frame');
      return;
    }

    setIsProcessing(true);
    const startTime = Date.now();
    
    try {
      console.log(`Processing frame ${frameCount + 1}`);
      
      if (!cameraRef.current) {
        console.log('Camera ref not available');
        return;
      }

      const photo = await cameraRef.current.takePictureAsync({
        quality: 0.5,
        base64: true,
        skipProcessing: true,
        exif: false
      });

      if (!photo?.base64) {
        console.log('No photo data captured');
        return;
      }

     // Create tensor directly from base64 image data
     const base64Data = photo.base64.replace(/^data:image\/\w+;base64,/, '');
     const uint8Array = Base64.toUint8Array(base64Data);
 
     // Create tensor from JPEG data
     const tensor = await tf.tidy(() => {
      // Use decodeJpeg to handle JPEG format
      const imageTensor = decodeJpeg(uint8Array);
      // Resize to the expected dimensions
      const resized = tf.image.resizeBilinear(imageTensor, [300, 300]);
      // Cast to int32 (and add the batch dimension)
      return tf.cast(resized, 'int32').expandDims(0);
    });
 
     console.log('Running object detection...');
     const detections = await modelRef.current.detect(tensor.squeeze() as tf.Tensor3D);
    console.log('Raw detections:', detections);
    
    if (isComponentMounted.current) {
      const filteredDetections = detections.filter(d => d.score > 0.66);
      console.log('Filtered detections:', filteredDetections);
      setPredictions(filteredDetections);
      setFrameCount(prev => prev + 1);
    }
    
    // Cleanup
    tf.dispose(tensor);
      
    } catch (error) {
      console.error('Frame processing error:', error);
    } finally {
      const processingTime = Date.now() - startTime;
      console.log(`Frame ${frameCount + 1} processed in ${processingTime}ms`);
      
      processingTimeRef.current.push(processingTime);
      if (processingTimeRef.current.length > 30) {
        processingTimeRef.current.shift();
      }
      
      setIsProcessing(false);
      
      if (isComponentMounted.current) {
        setTimeout(() => {
          requestAnimationFrame(processFrame);
        }, 100);
      }
    }
  };

  const handleMarkerPress = (index: number) => {
    console.log('Marker pressed:', index);
    setSelectedObject(selectedObject === index ? null : index);
  };

  const renderMarkers = () => {
    return predictions.map((prediction, index) => {
      console.log(`Rendering marker ${index}:`, prediction);
      return (
        <Marker
          key={index}
          position={{
            x: prediction.bbox[0],
            y: prediction.bbox[1]
          }}
          isSelected={selectedObject === index}
          label={prediction.class}
          onPress={() => handleMarkerPress(index)}
        />
      );
    });
  };

  if (hasPermission === null) {
    console.log('Rendering permission loading state');
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color="#0000ff" />
      </View>
    );
  }

  if (hasPermission === false) {
    console.log('Rendering permission denied state');
    return (
      <View style={styles.container}>
        <Text style={styles.text}>No access to camera</Text>
      </View>
    );
  }

  console.log('Rendering main camera view');
  return (
    <View style={styles.container}>
      <View style={styles.cameraView}>
        <CameraView
          ref={cameraRef}
          style={styles.camera}
          facing={cameraFacing}
          onCameraReady={() => {
            console.log('Camera ready event');
            console.log('Model ref state:', !!modelRef.current);
            if (modelRef.current && !isProcessing) {
              console.log('Starting detection from camera ready');
              startDetection();
            }
          }}
        >
          <GLView
            style={StyleSheet.absoluteFill}
            onContextCreate={onGLContextCreate}
          />
          <View style={styles.markersOverlay}>
            {renderMarkers()}
          </View>
        </CameraView>
        <TouchableOpacity 
          style={styles.button} 
          onPress={() => {
            console.log('Camera flip button pressed');
            setCameraFacing(current => current === 'back' ? 'front' : 'back');
            setPredictions([]);
          }}
        >
          <Text style={styles.buttonText}>Flip Camera</Text>
        </TouchableOpacity>
      </View>
      {(!isModelLoaded || !isTfReady) && (
        <View style={styles.modelLoading}>
          <ActivityIndicator size="large" color="#0000ff" />
          <Text style={styles.loadingText}>
            {!isTfReady ? 'Initializing TensorFlow...' : 'Loading Model...'}
          </Text>
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
  markersOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 1,
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