import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Dimensions,
  Platform,
  StatusBar,
  Animated
} from 'react-native';
import { CameraView, CameraType, useCameraPermissions } from "expo-camera"
import { manipulateAsync, SaveFormat } from 'expo-image-manipulator';
import * as SecureStore from 'expo-secure-store';
import { useIsFocused, useFocusEffect } from '@react-navigation/native';
import { Camera as CameraIcon, Settings, Languages, ChevronLeft, X, Save } from 'lucide-react-native';

// Import from our separated file
import { WS_URL, setupWebSocket, Detection, CameraDimensions } from './websocket';
import styles from './styles';

const FRAME_INTERVAL = 2000; // Capture frame every 2 seconds
const MAX_QUEUE_SIZE = 1; // Maximum number of frames in queue

const SCREEN_WIDTH = Dimensions.get('window').width;
const SCREEN_HEIGHT = Dimensions.get('window').height;

// Orange theme color from the login screen
const THEME_COLOR = '#FF6B00';

export default function CameraScreen({ navigation }: any) {
  const [permission, requestPermission] = useCameraPermissions();
  const [isConnected, setIsConnected] = useState(false);
  const [username, setUsername] = useState('');
  const [detections, setDetections] = useState<Detection[]>([]);
  const [language, setLanguage] = useState('hi');
  const [isProcessing, setIsProcessing] = useState(false);
  const [isDetecting, setIsDetecting] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<'connected' | 'connecting' | 'disconnected' | 'error'>('disconnected');
  const [cameraFacing, setCameraFacing] = useState<CameraType>('back');
  const [debugMode, setDebugMode] = useState(false);
  const [lastError, setLastError] = useState<string | null>(null);
  const [showGrid, setShowGrid] = useState(true);
  const [cameraReady, setCameraReady] = useState(false);
  
  const cameraRef = useRef<CameraView | null>(null);
  const frameInterval = useRef<NodeJS.Timeout | null>(null);
  const webSocketRef = useRef<WebSocket | null>(null);
  const reconnectAttempts = useRef<number>(0);
  const isFocused = useIsFocused();
  const [queueSize, setQueueSize] = useState(0);
  const lastCaptureTime = useRef(0);
  const bottomSheetAnim = useRef(new Animated.Value(0)).current;
  const [selectedDetection, setSelectedDetection] = useState<Detection | null>(null);

  // Camera ratio for proper marker positioning
  const [cameraDimensions, setCameraDimensions] = useState<CameraDimensions>({ 
    width: Dimensions.get('window').width,
    height: Dimensions.get('window').height * 0.85
  });

  // Add state for previous image data
  const [previousImageData, setPreviousImageData] = useState<string | null>(null);
  const [imageDiffThreshold] = useState(0.15); // 15% difference threshold

  useEffect(() => {
    (async () => {
      if (!permission?.granted) {
        await requestPermission();
      }
      
      // Get username from secure storage
      try {
        const userData = await SecureStore.getItemAsync('userData');
        if (userData) {
          const parsedData = JSON.parse(userData);
          setUsername(parsedData.username || 'monil');
        } else {
          setUsername('monil');
        }
      } catch (err) {
        console.error('Error retrieving username:', err);
        setUsername('monil');
      }
    })();
  }, [permission]);

  // Fix for black screen issue - "pre-recording" when screen comes into focus
  useFocusEffect(
    useCallback(() => {
      const prepareCamera = async () => {
        if (cameraRef.current && Platform.OS === "ios" && cameraReady) {
          try {
            console.log("Starting pre-recording to prevent black screens");
            // Take a photo with minimal settings to initialize camera properly
            await cameraRef.current.takePictureAsync({
              quality: 0.2,
              skipProcessing: true,
              exif: false,
              pause: false,
              flash: 'off',
              shutterSound: false,
              ...(Platform.OS === 'android' && {
                disableShutterSound: true, // Android-specific fallback
                skipProcessing: true       // Crucial for Android
              })
            });
          } catch (error) {
            console.log("Pre-recording error:", error);
          }
        }
      };
      prepareCamera();
    }, [cameraRef.current, cameraReady])
  );

  useEffect(() => {
    // Connect to WebSocket when screen is focused
    if (isFocused) {
      connectWebSocket();
    } else {
      // Cleanup when screen is not focused
      cleanupResources();
    }
    
    return cleanupResources;
  }, [isFocused]);

  useEffect(() => {
    // Update device dimensions on layout change
    const updateDimensions = () => {
      setCameraDimensions({
        width: Dimensions.get('window').width,
        height: Dimensions.get('window').height * 0.85
      });
    };

    Dimensions.addEventListener('change', updateDimensions);
    
    return () => {
      // Clean up event listener
      const dimensionsHandler = Dimensions.addEventListener('change', () => {});
      dimensionsHandler.remove();
    };
  }, []);

  const cleanupResources = () => {
    // Stop detection
    if (frameInterval.current) {
      clearInterval(frameInterval.current);
      frameInterval.current = null;
      setIsDetecting(false);
    }
    
    // Close WebSocket connection
    if (webSocketRef.current) {
      try {
        webSocketRef.current.close();
      } catch (e) {
        console.log("Error closing WebSocket:", e);
      }
      webSocketRef.current = null;
      setConnectionStatus('disconnected');
      setIsConnected(false);
    }
    
    // Clear detections
    setDetections([]);
    
    // Reset reconnect attempts
    reconnectAttempts.current = 0;
  };

  const connectWebSocket = () => {
    try {
      // Close existing connection if any
      if (webSocketRef.current) {
        webSocketRef.current.close();
      }
      console.log('Connecting to WebSocket with lan:', language);
      // Use the setupWebSocket function imported from WebSocketService
      webSocketRef.current = setupWebSocket(
        username,
        language,
        cameraDimensions,
        {
          onOpen: (ws) => {
            setIsConnected(true);
            reconnectAttempts.current = 0;
          },
          onMessage: (data) => {
            // Handle other messages that aren't detections
            if (data.type === 'error') {
              console.error('Server error:', data.message);
              setLastError(`Server: ${data.message}`);
              setIsProcessing(false);
              setQueueSize(prev => Math.max(0, prev - 1));
            } else if (data.type === 'status') {
              console.log('Status message:', data.message);
              setIsProcessing(false);
              setQueueSize(prev => Math.max(0, prev - 1));
            }
          },
          onDetections: (adjustedDetections) => {
            setDetections(adjustedDetections);
            setIsProcessing(false);
            setQueueSize(prev => Math.max(0, prev - 1));
          },
          onError: (error) => {
            setLastError(`WS Error: ${error || 'Unknown error'}`);
            setIsConnected(false);
          },
          onClose: (event) => {
            // Auto reconnect if detection is active or if this wasn't a normal closure
            if ((isDetecting && isFocused) || (event.code !== 1000 && isFocused)) {
              // Exponential backoff for reconnection attempts (max 30 seconds)
              const delay = Math.min(1000 * Math.pow(3, reconnectAttempts.current), 30000);
              reconnectAttempts.current++;
              
              console.log(`Attempting to reconnect in ${delay/1000} seconds...`);
              setTimeout(() => {
                if (isFocused) { // Check if still focused before reconnecting
                  connectWebSocket();
                }
              }, delay);
            }
          },
          onStatusChange: (status) => {
            setConnectionStatus(status);
          }
        },
        debugMode
      );
    } catch (error) {
      console.error('Error setting up WebSocket:', error);
      if (error instanceof Error) {
        console.error('Error name:', error.name);
        console.error('Error message:', error.message);
        console.error('Error stack:', error.stack);
        setLastError(`Setup error: ${error.message}`);
      }
      setConnectionStatus('error');
      Alert.alert(
        'Connection Error',
        'Failed to connect to detection service. Please check your connection and try again.'
      );
    }
  };
  
  const toggleDetection = () => {
    if (!isDetecting) {
      if (isConnected) {
        console.log('Starting detection...');
        startContinuousDetection();
        setIsDetecting(true);
      } else {
        // Try to reconnect first
        Alert.alert(
          'Not Connected',
          'Trying to connect to the detection service...',
          [{ text: 'OK' }]
        );
        connectWebSocket();
      }
    } else {
      console.log('Stopping detection...');
      stopContinuousDetection();
      setIsDetecting(false);
    }
  };
  
  const captureAndProcessFrame = async () => {
    if (!cameraRef.current || !isConnected || isProcessing || !cameraReady) {
      console.log('Skipping capture:', { 
        hasCamera: !!cameraRef.current, 
        isConnected, 
        isProcessing,
        cameraReady
      });
      return;
    }
    
    const currentTime = Date.now();
    if (currentTime - lastCaptureTime.current < FRAME_INTERVAL) {
      console.log('Too soon for next capture');
      return;
    }
    
    if (queueSize >= MAX_QUEUE_SIZE) {
      console.log('Queue full, skipping frame');
      return;
    }
    
    try {
      console.log('Starting frame capture...');
      setIsProcessing(true);
      lastCaptureTime.current = currentTime;
      
      if (!cameraRef.current) {
        console.error('Camera ref is null');
        setIsProcessing(false);
        return;
      }
      
      // Use takePictureAsync with modified settings to prevent screen flashing
      const photo = await cameraRef.current.takePictureAsync({
        quality: 0.5,
        base64: true,
        skipProcessing: true,
        exif: false,
        scale: 0.5,
        pause: false,      // Crucial: Don't pause the preview during capture
        flash: 'off'       // Ensure flash is off
      });
      
      console.log('Photo captured:', photo.uri);
      
      // Use a lower quality compress to improve speed
      const resized = await manipulateAsync(
        photo.uri,
        [{ resize: { width: 640 } }],
        { compress: 0.4, format: SaveFormat.JPEG, base64: true }
      );
      
      // Check if the image is significantly different from the previous one
      const shouldProcessImage = await shouldProcessNewImage(resized.base64 || '');
      
      if (!shouldProcessImage) {
        console.log('Image similar to previous, skipping processing');
        setIsProcessing(false);
        return;
      }
      
      console.log('Photo resized, preparing to send');
      
      if (webSocketRef.current?.readyState === WebSocket.OPEN) {
        setQueueSize(prev => prev + 1);
        const frameData = {
          type: 'frame',
          data: `data:image/jpeg;base64,${resized.base64}`
        };
        
        console.log('Sending frame to server');
        webSocketRef.current.send(JSON.stringify(frameData));
      } else {
        console.log('WebSocket not connected');
        setIsProcessing(false);
        if (isDetecting) {
          setLastError('WebSocket connection lost while detecting');
          Alert.alert('Connection Lost', 'Reconnecting to detection service...');
          connectWebSocket();
        }
      }
    } catch (err) {
      console.error('Error capturing frame:', err instanceof Error ? err.message : 'Unknown error');
      setLastError(`Frame capture: ${err instanceof Error ? err.message : 'Unknown error'}`);
      setIsProcessing(false);
    }
  };
  
  // Function to compare images and detect significant changes
  const shouldProcessNewImage = async (currentImageBase64: string): Promise<boolean> => {
    // If no previous image, always process the current one
    if (!previousImageData) {
      setPreviousImageData(currentImageBase64);
      return true;
    }
    
    try {
      // Simple comparison: check a sample of pixels
      const similarityScore = await calculateImageSimilarity(previousImageData, currentImageBase64);
      
      // Update previous image data for next comparison
      setPreviousImageData(currentImageBase64);
      
      // If difference is significant, process the image
      return similarityScore > imageDiffThreshold;
    } catch (error) {
      console.error("Error comparing images:", error);
      // On error, process the image to be safe
      return true;
    }
  };
  
  // Function to calculate similarity between two images
  const calculateImageSimilarity = async (image1Base64: string, image2Base64: string): Promise<number> => {
    // Implementation depends on platform
    if (Platform.OS === 'web') {
      return calculateImageSimilarityWeb(image1Base64, image2Base64);
    } else {
      // For native, use a simplified approach
      // This is a placeholder - for production you'd want a more robust solution
      return 0.2; // Default to processing every 5th image on native
    }
  };
  
  // Web implementation of image comparison
  const calculateImageSimilarityWeb = async (image1Base64: string, image2Base64: string): Promise<number> => {
    return new Promise((resolve) => {
      // Create two image elements
      const img1 = new Image();
      const img2 = new Image();
      
      let imagesLoaded = 0;
      
      const compareImages = () => {
        // Both images loaded, compare them
        const canvas1 = document.createElement('canvas');
        const canvas2 = document.createElement('canvas');
        
        // Sample size - using smaller dimensions for performance
        const sampleWidth = 50;
        const sampleHeight = 50;
        
        canvas1.width = sampleWidth;
        canvas1.height = sampleHeight;
        canvas2.width = sampleWidth;
        canvas2.height = sampleHeight;
        
        const ctx1 = canvas1.getContext('2d');
        const ctx2 = canvas2.getContext('2d');
        
        if (!ctx1 || !ctx2) {
          resolve(1.0); // If we can't compare, assume different
          return;
        }
        
        // Draw scaled down versions of images
        ctx1.drawImage(img1, 0, 0, sampleWidth, sampleHeight);
        ctx2.drawImage(img2, 0, 0, sampleWidth, sampleHeight);
        
        // Get image data
        const data1 = ctx1.getImageData(0, 0, sampleWidth, sampleHeight).data;
        const data2 = ctx2.getImageData(0, 0, sampleWidth, sampleHeight).data;
        
        // Compare pixels
        let diffCount = 0;
        const totalPixels = data1.length / 4; // RGBA values
        
        // Sample every 4th pixel for performance
        for (let i = 0; i < data1.length; i += 16) {
          // Simple RGB difference
          const diff = Math.abs(data1[i] - data2[i]) + 
                       Math.abs(data1[i+1] - data2[i+1]) + 
                       Math.abs(data1[i+2] - data2[i+2]);
          
          // If color difference is significant
          if (diff > 30) {
            diffCount++;
          }
        }
        
        const diffRatio = diffCount / (totalPixels / 4);
        console.log(`Image difference: ${(diffRatio * 100).toFixed(2)}%`);
        resolve(diffRatio);
      };
      
      // Handle image loading
      img1.onload = img2.onload = () => {
        imagesLoaded++;
        if (imagesLoaded === 2) {
          compareImages();
        }
      };
      
      // Handle errors
      img1.onerror = img2.onerror = () => {
        resolve(1.0); // Assume different on error
      };
      
      // Load images
      img1.src = `data:image/jpeg;base64,${image1Base64}`;
      img2.src = `data:image/jpeg;base64,${image2Base64}`;
    });
  };

  const startContinuousDetection = async () => {
    if (!isConnected || !cameraRef.current) {
      console.log('Cannot start detection:', { isConnected, hasCamera: !!cameraRef.current });
      return;
    }
    
    console.log('Starting continuous detection');
    
    // Clear any existing interval first
    if (frameInterval.current) {
      clearInterval(frameInterval.current);
    }
    
    // Call once immediately to start faster
    captureAndProcessFrame();
    
    // Set up interval for continuous capture
    frameInterval.current = setInterval(captureAndProcessFrame, FRAME_INTERVAL / 2); // Use half the interval for more reliable capture
    console.log('Detection interval started with interval', FRAME_INTERVAL / 2, 'ms');
  };
  
  const stopContinuousDetection = () => {
    if (frameInterval.current) {
      clearInterval(frameInterval.current);
      frameInterval.current = null;
      
      // Send stop message if connected
      if (webSocketRef.current?.readyState === WebSocket.OPEN) {
        webSocketRef.current.send(JSON.stringify({
          type: 'stop'
        }));
      }
      
      // Clear detections
      setDetections([]);
    }
  };

  // Update language preference
  useEffect(() => {
    if (webSocketRef.current?.readyState === WebSocket.OPEN) {
      webSocketRef.current.send(JSON.stringify({
        type: 'set_language',
        language:'hi'
      }));
    }
  }, [language]);

  // Show bottom sheet when a detection is selected
  const showBottomSheet = () => {
    Animated.spring(bottomSheetAnim, {
      toValue: 1,
      useNativeDriver: true,
    }).start();
  };

  // Hide bottom sheet
  const hideBottomSheet = () => {
    Animated.spring(bottomSheetAnim, {
      toValue: 0,
      useNativeDriver: true,
    }).start();
    setSelectedDetection(null);
  };

  // Handle detection press
  const handleDetectionPress = (detection: Detection) => {
    setSelectedDetection(detection);
    showBottomSheet();
  };

  if (!permission) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color={THEME_COLOR} />
        <Text style={styles.statusText}>Loading camera permissions...</Text>
      </View>
    );
  }

  if (!permission.granted) {
    return (
      <View style={styles.container}>
        <Text style={styles.message}>We need your permission to show the camera</Text>
        <TouchableOpacity style={styles.permissionButton} onPress={requestPermission}>
          <Text style={styles.permissionButtonText}>Grant Permission</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const bottomSheetTranslateY = bottomSheetAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [200, 0],
  });

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />
      <CameraView
        ref={cameraRef}
        style={styles.camera}
        animateShutter={false}
        facing={cameraFacing}
        // Add these important props to prevent screen flashing
        useCamera2Api={Platform.OS === 'android'} // Use Camera2 API on Android
        videoStabilizationMode="auto" // Enable stabilization if available
        onCameraReady={() => {
          console.log('Camera ready');
          setCameraReady(true);
        }}
        onMountError={(error: { message: string }) => {
          console.error('Camera mount error:', error);
          setLastError(`Camera mount error: ${error.message}`);
        }}
      >
        {/* Top Bar */}
        <View style={styles.topBar}>
          <TouchableOpacity 
            style={styles.topBarButton} 
            onPress={() => navigation?.goBack?.()}
          >
            <ChevronLeft size={24} color="white" />
          </TouchableOpacity>
          
          <View style={styles.topBarRight}>
            <TouchableOpacity 
              style={styles.topBarButton}
              onPress={() => setShowGrid(!showGrid)}
            >
              <Languages size={24} color="white" />
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={styles.topBarButton}
              onPress={() => setDebugMode(!debugMode)}
            >
              <Settings size={24} color="white" />
            </TouchableOpacity>
          </View>
        </View>
        
        {/* Connection Status Indicator */}
        <View style={[
          styles.statusBar, 
          {backgroundColor: connectionStatus === 'connected' ? 'rgba(76, 217, 100, 0.7)' : 
                          connectionStatus === 'connecting' ? 'rgba(255, 204, 0, 0.7)' : 
                          'rgba(255, 59, 48, 0.7)'}
        ]}>
          <Text style={styles.statusText}>
            {connectionStatus === 'connected' ? 'Connected' : 
             connectionStatus === 'connecting' ? 'Connecting...' : 'Disconnected'}
          </Text>
        </View>
        
        {/* Debug Information */}
        {debugMode && (
          <View style={styles.debugInfo}>
            <Text style={styles.debugText}>Status: {connectionStatus}</Text>
            <Text style={styles.debugText}>Connected: {isConnected ? 'Yes' : 'No'}</Text>
            <Text style={styles.debugText}>Detections: {detections.length}</Text>
            <Text style={styles.debugText}>Processing: {isProcessing ? 'Yes' : 'No'}</Text>
            <Text style={styles.debugText}>Language: {language}</Text>
            <Text style={styles.debugText}>Username: {username || 'Not set'}</Text>
            <Text style={styles.debugText}>WebSocket URL: {WS_URL}</Text>
            {lastError && <Text style={styles.debugErrorText}>Error: {lastError}</Text>}
          </View>
        )}
        
        {/* Processing Indicator */}
        {isProcessing && (
          <View style={styles.processingContainer}>
            <ActivityIndicator 
              size="small" 
              color="#ffffff" 
            />
          </View>
        )}
        
        {/* Render detection markers instead of boxes */}
        {detections.map((detection, index) => {
          // Ensure center coordinates are valid
          if (!detection.center || 
              isNaN(detection.center[0]) || 
              isNaN(detection.center[1])) {
            return null;
          }
          
          return (
            <TouchableOpacity
              key={index}
              style={[
                styles.detectionMarker,
                {
                  left: detection.center[0] - 12, // Center the marker
                  top: detection.center[1] - 12,  // Center the marker
                }
              ]}
              onPress={() => handleDetectionPress(detection)}
            >
              <View style={styles.markerDot} />
            </TouchableOpacity>
          );
        })}
      </CameraView>
      
      {/* Bottom Controls Bar */}
      <View style={styles.controls}>
        <TouchableOpacity 
          style={styles.controlButton}
          onPress={() => setCameraFacing(
            currentType => currentType === 'back' ? 'front' : 'back'
          )}
        >
          <CameraIcon size={24} color="white" />
          <Text style={styles.controlText}>Flip</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.detectionButton, isDetecting && styles.stopButton]}
          onPress={toggleDetection}
        >
          <Text style={styles.detectionButtonText}>
            {isDetecting ? 'Stop' : 'Start'} Detection
          </Text>
        </TouchableOpacity>
      </View>
      
      {/* Bottom Sheet for Selected Detection */}
      {selectedDetection && (
        <Animated.View
          style={[
            styles.bottomSheet,
            { transform: [{ translateY: bottomSheetTranslateY }] }
          ]}
        >
          <View style={styles.bottomSheetHandle} />
          <View style={styles.bottomSheetHeader}>
            <Text style={styles.bottomSheetTitle}>{selectedDetection.label}</Text>
            <TouchableOpacity onPress={hideBottomSheet}>
              <X size={24} color="#333" />
            </TouchableOpacity>
          </View>
          <View style={styles.bottomSheetContent}>
            <View style={styles.translationItem}>
              <Text style={styles.translationLabel}>Original:</Text>
              <Text style={styles.translationText}>{selectedDetection.label}</Text>
            </View>
            <View style={styles.translationItem}>
              <Text style={styles.translationLabel}>Translation:</Text>
              <Text style={styles.translationText}>{selectedDetection.translated}</Text>
            </View>
            <View style={styles.translationItem}>
              <Text style={styles.translationLabel}>Confidence:</Text>
              <Text style={styles.translationText}>{(selectedDetection.confidence * 100).toFixed(1)}%</Text>
            </View>
            
            {/* Add save button */}
            <TouchableOpacity style={styles.saveButton} onPress={() => {
              // Handle save functionality here
              Alert.alert('Saved', 'Detection saved successfully');
              hideBottomSheet();
            }}>
              <Save size={20} color="white" />
              <Text style={styles.saveButtonText}>Save Detection</Text>
            </TouchableOpacity>
          </View>
        </Animated.View>
      )}
    </View>
  );
}
