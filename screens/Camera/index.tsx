import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
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
import { CameraView, CameraType, useCameraPermissions } from "expo-camera";
import { manipulateAsync, SaveFormat } from 'expo-image-manipulator';
import * as SecureStore from 'expo-secure-store';
import { useIsFocused, useFocusEffect } from '@react-navigation/native';
import { Camera as CameraIcon, Settings, Languages, ChevronLeft, X, Save, BookOpen } from 'lucide-react-native';
import axios from 'axios';
import { Badge, Modal, Portal, Switch, Card, Paragraph, Snackbar } from 'react-native-paper';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Import API_URL from constants
import { API_URL } from '../../config/constants';
// Import styles and THEME_COLOR from styles.ts
import styles, { THEME_COLOR } from './styles';
import { Marker } from './marker';

// Define the structure for API detection results
interface ApiDetectionObject {
  box: number[];
  class: number;
  confidence: number;
  label: string; // Translated label
  label_en: string; // English label
  center?: number[]; // Keep center for marker positioning
}

interface DetectionApiResponse {
  completed_challenge: boolean;
  count: number;
  message: string | null;
  objects: ApiDetectionObject[];
  profile_used: string;
  status: string;
  target_language: string;
}

// Update Detection type to match API response structure
interface Detection extends ApiDetectionObject {}

// Define the structure for Phrase API response
interface PhraseApiResponse {
    original_word: string;
    sentence1: string;
    sentence2: string;
}


const POLLING_INTERVAL = 18000; // Poll every 10 seconds
const MAX_QUEUE_SIZE =2; // Keep this for managing concurrent requests

const SCREEN_WIDTH = Dimensions.get('window').width;
const SCREEN_HEIGHT = Dimensions.get('window').height;

// Fallback token provided by the user
const FALLBACK_TOKEN = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJmcmVzaCI6ZmFsc2UsImlhdCI6MTc0NjI3NjgxMiwianRpIjoiNzZkYzA5OTItZjRkMS00NWRjLWIxOWUtZTA2ZWMyZTc2NDA1IiwidHlwZSI6ImFjY2VzcyIsInN1YiI6Im1vbmlsIiwibmJmIjoxNzQ2Mjc2ODEyLCJjc3JmIjoiMmViYjJlNTItZTBlMS00NTFiLWJmYmYtZDFjYzI2OWVlNDFmIiwiZXhwIjoxNzQ2MzYzMjEyfQ.0nBVYytIMbGE6fa3P14TRQ6hLUFcjeqKVRQSjmZPhqg';

export default function CameraScreen({ navigation }: any) {
  const [permission, requestPermission] = useCameraPermissions();
  // Removed WebSocket related state: isConnected, connectionStatus, webSocketRef, reconnectAttempts
  const [username, setUsername] = useState('');
  const [detections, setDetections] = useState<Detection[]>([]);
  const [language, setLanguage] = useState('hi'); // Default language
  const [isProcessing, setIsProcessing] = useState(false);
  const [isDetecting, setIsDetecting] = useState(false);
  const [cameraFacing, setCameraFacing] = useState<CameraType>('back');
  const [debugMode, setDebugMode] = useState(false);
  const [lastError, setLastError] = useState<string | null>(null);
  const [showGrid, setShowGrid] = useState(true); // Keep this for UI toggle if needed
  const [cameraReady, setCameraReady] = useState(false);
  const [authToken, setAuthToken] = useState<string | null>(null); // State to hold the token
  const [showSettings, setShowSettings] = useState(false);
  const [flashEnabled, setFlashEnabled] = useState(false);
  const [challengeNotified, setChallengeNotified] = useState(false);
  const [showChallengeSnackbar, setShowChallengeSnackbar] = useState(false);
  const [learnMoreData, setLearnMoreData] = useState<PhraseApiResponse | null>(null);

  const cameraRef = useRef<CameraView | null>(null);
  const pollIntervalRef = useRef<NodeJS.Timeout | null>(null); // Changed from frameInterval
  const isFocused = useIsFocused();
  const [queueSize, setQueueSize] = useState(0); // Keep for request management
  const lastCaptureTime = useRef(0); // Keep for timing requests
  const bottomSheetAnim = useRef(new Animated.Value(0)).current;
  const [selectedDetection, setSelectedDetection] = useState<Detection | null>(null);

  const [cameraDimensions, setCameraDimensions] = useState<CameraDimensions>({
    width: Dimensions.get('window').width,
    height: Dimensions.get('window').height * 0.85
  });

  // Interface for CameraDimensions (if not already defined elsewhere)
  interface CameraDimensions {
    width: number;
    height: number;
  }

  useEffect(() => {
    (async () => {
      if (!permission?.granted) {
        await requestPermission();
      }

      try {
        const userData = await SecureStore.getItemAsync('userData');
        if (userData) {
          const parsedData = JSON.parse(userData);
          setUsername(parsedData.username || 'monil');
          // Optionally load saved language preference here
          // const savedLang = await SecureStore.getItemAsync('language');
          // if (savedLang) setLanguage(savedLang);
        } else {
          setUsername('monil'); // Default username
        }
        setAuthToken(FALLBACK_TOKEN); 
        // Retrieve the auth token
        // const token = await SecureStore.getItemAsync('jwtToken'); // Assuming 'jwtToken' is the key used during login
        // if (token) {
        //   setAuthToken(token);
        //   console.log('Auth token loaded from SecureStore.');
        // } else {
        //   console.log('No auth token found in SecureStore, using fallback.');
        //   setAuthToken(FALLBACK_TOKEN); // Use fallback if no token found
        // }
        // Check if challenge notification was already shown
        const notified = await AsyncStorage.getItem('challengeNotified');
        setChallengeNotified(!!notified);
      } catch (err) {
        console.error('Error retrieving user data or token:', err);
        setUsername('monil');
        console.log('Using fallback token due to error.');
        setAuthToken(FALLBACK_TOKEN); // Use fallback on error too
      }
    })();
  }, [permission]);

  useEffect(() => {
    // Start/Stop detection polling based on focus and isDetecting state
    if (isFocused && isDetecting) {
      startPollingDetection();
    } else {
      stopPollingDetection();
    }

    // Cleanup function
    return () => {
      stopPollingDetection();
    };
  }, [isFocused, isDetecting]); // Rerun effect when focus or detection state changes

  useEffect(() => {
    // Update device dimensions on layout change
    const updateDimensions = () => {
      setCameraDimensions({
        width: Dimensions.get('window').width,
        height: Dimensions.get('window').height * 0.85
      });
    };

    const dimensionsSubscription = Dimensions.addEventListener('change', updateDimensions);

    return () => {
      dimensionsSubscription.remove();
    };
  }, []);

  // Removed cleanupResources as WebSocket is gone. Cleanup is handled in useEffect.

  // Removed connectWebSocket function

  const toggleDetection = () => {
    setIsDetecting(prevState => !prevState); // Toggle detection state
    if (!isDetecting) {
      console.log('Starting detection polling...');
      // Polling will start via useEffect
    } else {
      console.log('Stopping detection polling...');
      // Polling will stop via useEffect
      setDetections([]); // Clear detections when stopping
    }
  };

  const captureAndSendFrame = async () => {
    if (!cameraRef.current || isProcessing || !cameraReady) {
      console.log('Skipping capture:', {
        hasCamera: !!cameraRef.current,
        isProcessing,
        cameraReady
      });
      return;
    }

    // --- New: Test GET request to /api/current_language with auth ---
    // try {
    //   const testResponse = await fetch(`${API_URL}/api/current_language`, {
    //     method: 'GET',
    //     headers: {
    //       'Authorization': `Bearer ${authToken}`,
    //     },
    //   });
    //   if (!testResponse.ok) {
    //     const errorText = await testResponse.text();
    //     console.error('GET /api/current_language failed:', testResponse.status, errorText);
    //     setLastError(`GET /api/current_language failed: ${testResponse.status}`);
    //     return;
    //   } else {
    //     const testData = await testResponse.json();
    //     console.log('GET /api/current_language success:', testData);
    //   }
    // } catch (err) {
    //   console.error('Network or fetch error on /api/current_language:', err);
    //   setLastError('Network error on /api/current_language');
    //   return;
    // }

    // Basic check to prevent rapid firing if interval logic fails
    const currentTime = Date.now();
    if (currentTime - lastCaptureTime.current < POLLING_INTERVAL / 2) { // Allow slightly faster than interval
      console.log('Too soon for next capture');
      return;
    }

    if (queueSize >= MAX_QUEUE_SIZE) {
      console.log('Request queue full, skipping frame');
      return;
    }

    if (!authToken) {
        console.warn('Auth token not available, skipping detection.');
        setLastError('Authentication token is missing.');
        setIsProcessing(false);
        setQueueSize(prev => Math.max(0, prev - 1)); // Decrement queue size even if skipped
        return;
    }

    try {
      console.log('Starting frame capture for API...');
      setIsProcessing(true);
      setQueueSize(prev => prev + 1);
      lastCaptureTime.current = currentTime;
      setLastError(null); // Clear previous error

      if (!cameraRef.current) {
        console.error('Camera ref is null');
        throw new Error('Camera reference not available.');
      }

      const photo = await cameraRef.current.takePictureAsync({
        quality: 0.5, // Moderate quality
        skipProcessing: true,
        scale: 0.5,
        base64: false, // No need for base64
      });

      console.log('Photo captured:', photo.uri);

      // Resize image before sending
      const resized = await manipulateAsync(
        photo.uri,
        [{ resize: { width: 640 } }], // Standard processing size
        { compress: 0.6, format: SaveFormat.JPEG } // No base64
      );

      console.log('Photo resized, preparing FormData...');

      // Get a filename from the resized image URI or use a default
      const filename = resized.uri.split('/').pop() || 'photo.jpg';

      // --- Create FormData payload ---
      const formData = new FormData();

      // Append the image file with the key 'image' using uri, name, type (React Native style)
      formData.append('image', {
        uri: resized.uri,
        name: filename,
        type: 'image/jpeg',
      });

      // Append other data as fields based on user request
      formData.append('profile', 'casual'); // Keep profile
      formData.append('target_language', language);
      formData.append('iou', '0.5'); // Placeholder value, adjust if needed
      formData.append('confidence', '0.4'); // Placeholder value, adjust if needed

      // Log FormData keys to verify fields are added
      try {
        console.log('FormData keys:', [...(formData as any)._parts.map((part: any[]) => part[0])]);
      } catch (logError) {
        console.warn('Could not log FormData keys directly.');
      }
      console.log('Sending FormData to API via fetch...');

      // --- Send FormData using fetch instead of Axios ---
      try {
        const response = await fetch(`${API_URL}/api/detect`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${authToken}`,
            // Do NOT set 'Content-Type' for FormData in fetch; let fetch set it automatically
          },
          body: formData,
        });
  
        if (!response.ok) {
          const errorText = await response.text();
          throw new Error(`API Error (${response.status}): ${errorText}`);
        }
  
        const data: DetectionApiResponse = await response.json();
        console.log('API Response received (fetch):', data.status, 'Count:', data.count);
  
        if (data.status === 'success' && Array.isArray(data.objects)) {
          // Validate and process detections
          console.log("Data : ", data);
          const validDetections = data.objects.filter((det: ApiDetectionObject) => {
            return (
              Array.isArray(det.box) &&
              det.box.length === 4 &&
              !det.box.some((coord: number) => isNaN(coord)) &&
              det.box[2] > det.box[0] && // width > 0
              det.box[3] > det.box[1]    // height > 0
            );
          });
  
          // Adjust coordinates and add center points
          const adjustedDetections = validDetections.map((det: ApiDetectionObject) => {
            // Calculate center of the box, add a small offset to the right
            const scaleX = cameraDimensions.width / 1280; // Your API's image width
            const scaleY = cameraDimensions.height / 960; // Your API's image height
            const x1 = det.box[0];
            const y1 = det.box[1];
            const x2 = det.box[2];
            const y2 = det.box[3];
            let centerX = ((x1 + x2) / 2) * scaleX;
            let centerY = ((y1 + y2) / 2) * scaleY;
            centerX += 18; // Move marker a bit to the right for better alignment
            return {
              ...det,
              markerPosition: [centerX, centerY]
            };
          });
  
          console.log('Processed detections:', adjustedDetections.length);
          if (debugMode) {
            console.log('Detection details:', JSON.stringify(adjustedDetections));
          }
  
          setDetections(adjustedDetections);
  
          // Handle challenge completion if needed
          if (data.completed_challenge && !challengeNotified) {
            setShowChallengeSnackbar(true);
            setChallengeNotified(true);
            await AsyncStorage.setItem('challengeNotified', 'true');
          }
  
        } else if (data.status !== 'success') {
          console.warn('API returned non-success status:', data.message || data.status);
          setLastError(`API Status: ${data.message || data.status}`);
          setDetections([]); // Clear detections on non-success
        } else {
           setDetections([]); // Clear detections if objects array is missing or not an array
        }
  
      } catch (err) {
        console.error('Error capturing or processing frame (fetch):', err);
        setLastError(`Detection Error: ${err instanceof Error ? err.message : String(err)}`);
        setDetections([]);
      } finally {
        setIsProcessing(false);
        setQueueSize(prev => Math.max(0, prev - 1));
      }
    } catch (err) {
      // Log the entire error object for more details
      console.error('Error capturing or processing frame (fetch):', err);

      // Axios error handling
      let errorMessage = 'Unknown error during detection';
      if (axios.isAxiosError(err)) {
        console.error('Axios error details:', {
          message: err.message,
          response: err.response?.data,
          status: err.response?.status,
          headers: err.response?.headers,
          config: err.config,
        });
        if (err.response) {
          // The request was made and the server responded with a status code
          // that falls out of the range of 2xx
          errorMessage = `API Error (${err.response.status}): ${JSON.stringify(err.response.data) || err.message}`;
        } else if (err.request) {
          // The request was made but no response was received
          errorMessage = 'Network request failed: No response received from server.';
        } else {
          // Something happened in setting up the request that triggered an Error
          errorMessage = `Request setup error: ${err.message}`;
        }
      } else if (err instanceof Error) {
        errorMessage = err.message;
      }

      setLastError(`Detection Error: ${errorMessage}`);
      setDetections([]); // Clear detections on error
    } finally {
      setIsProcessing(false);
      setQueueSize(prev => Math.max(0, prev - 1));
    }
  };

  const startPollingDetection = () => {
    if (pollIntervalRef.current) {
      clearInterval(pollIntervalRef.current); // Clear existing interval
    }
    console.log(`Starting polling every ${POLLING_INTERVAL / 1000} seconds`);
    // Call immediately first time
    captureAndSendFrame();
    // Set up interval
    pollIntervalRef.current = setInterval(captureAndSendFrame, POLLING_INTERVAL);
  };

  const stopPollingDetection = () => {
    if (pollIntervalRef.current) {
      console.log('Stopping polling detection');
      clearInterval(pollIntervalRef.current);
      pollIntervalRef.current = null;
    }
    setIsProcessing(false); // Ensure processing state is reset
    setQueueSize(0); // Reset queue
  };

  // Removed useEffect for language update via WebSocket

  // Bottom Sheet Animation Logic (Keep as is)
  const showBottomSheet = () => {
    Animated.spring(bottomSheetAnim, {
      toValue: 1,
      useNativeDriver: true,
    }).start();
  };

  const hideBottomSheet = () => {
    Animated.spring(bottomSheetAnim, {
      toValue: 0,
      useNativeDriver: true,
    }).start();
    setSelectedDetection(null);
  };

  const handleDetectionPress = (detection: Detection) => {
    setSelectedDetection(detection);
    showBottomSheet();
  };

  // --- New API Call Functions ---

  const handleSaveDetection = async (detection: Detection) => {
    if (!detection || !authToken) {
        if (!authToken) console.warn('Auth token not available for saving detection.');
        return;
    }
    console.log('Saving detection:', detection.label_en);
    try {
      const response = await fetch(`${API_URL}/api/store_detection`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`, // Add Authorization header
        },
        body: JSON.stringify({
          username: username,
          label_en: detection.label_en,
          label_translated: detection.label, // Assuming 'label' is the translated one
          confidence: detection.confidence,
          box: detection.box, // Send original box coordinates
          target_language: language,
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Save Error (${response.status}): ${errorText}`);
      }

      const result = await response.json();
      console.log('Save result:', result);
      Alert.alert('Saved', `${detection.label_en} (${detection.label}) saved successfully.`);
      hideBottomSheet();

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error saving detection';
      console.error('Error saving detection:', errorMessage);
      Alert.alert('Save Failed', `Could not save detection: ${errorMessage}`);
    }
  };

  const handleLearnMore = async (word: string) => {
    if (!word || !authToken) {
        if (!authToken) console.warn('Auth token not available for fetching phrases.');
        return;
    }
    console.log(`Fetching phrases for: ${word} in ${language}`);
    try {
      const response = await fetch(`${API_URL}/api/phrase`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`, // Add Authorization header
        },
        body: JSON.stringify({
          word: word,
          target_language: language,
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Phrase Error (${response.status}): ${errorText}`);
      }

      const data: PhraseApiResponse = await response.json();
      console.log('Phrase API response:', data);

      // Display the phrases in an alert
      setLearnMoreData(data); // Show in popup

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error fetching phrases';
      console.error('Error fetching phrases:', errorMessage);
      Alert.alert('Learn More Failed', `Could not fetch phrases: ${errorMessage}`);
    }
  };

  // Helper: Render grid overlay
  const renderGrid = () => {
    if (!showGrid) return null;
    const lines = [];
    const numLines = 2; // 2 vertical, 2 horizontal (rule of thirds)
    const w = cameraDimensions.width;
    const h = cameraDimensions.height;
    for (let i = 1; i <= numLines; i++) {
      // Vertical lines
      lines.push(
        <View key={`v-${i}`} style={{ position: 'absolute', left: (w * i) / (numLines + 1), top: 0, width: 1, height: h, backgroundColor: 'rgba(255,255,255,0.2)' }} />
      );
      // Horizontal lines
      lines.push(
        <View key={`h-${i}`} style={{ position: 'absolute', top: (h * i) / (numLines + 1), left: 0, width: w, height: 1, backgroundColor: 'rgba(255,255,255,0.2)' }} />
      );
    }
    return <View pointerEvents="none" style={{ position: 'absolute', left: 0, top: 0, width: w, height: h }}>{lines}</View>;
  };

  // --- Render Logic ---

  if (!permission) {
    return (
      <View style={[styles.container, { justifyContent: 'center', alignItems: 'center', backgroundColor: '#181818' }]}> 
        <View style={{ alignItems: 'center', marginBottom: 30 }}>
          <CameraIcon size={60} color="#FF6B00" />
        </View>
        <Text style={{ color: '#fff', fontSize: 20, fontWeight: 'bold', marginBottom: 10 }}>Camera Permission Needed</Text>
        <Text style={{ color: '#bbb', fontSize: 15, textAlign: 'center', marginBottom: 30, maxWidth: 280 }}>
          To use the camera features, please grant camera access to the app.
        </Text>
        <TouchableOpacity style={{ backgroundColor: '#FF6B00', borderRadius: 25, paddingVertical: 14, paddingHorizontal: 40 }} onPress={requestPermission}>
          <Text style={{ color: '#fff', fontWeight: 'bold', fontSize: 16 }}>Grant Permission</Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (!permission.granted) {
    return (
      <View style={[styles.container, { justifyContent: 'center', alignItems: 'center', backgroundColor: '#181818' }]}> 
        <View style={{ alignItems: 'center', marginBottom: 30 }}>
          <CameraIcon size={60} color="#FF6B00" />
        </View>
        <Text style={{ color: '#fff', fontSize: 20, fontWeight: 'bold', marginBottom: 10 }}>Camera Permission Needed</Text>
        <Text style={{ color: '#bbb', fontSize: 15, textAlign: 'center', marginBottom: 30, maxWidth: 280 }}>
          To use the camera features, please grant camera access to the app.
        </Text>
        <TouchableOpacity style={{ backgroundColor: '#FF6B00', borderRadius: 25, paddingVertical: 14, paddingHorizontal: 40 }} onPress={requestPermission}>
          <Text style={{ color: '#fff', fontWeight: 'bold', fontSize: 16 }}>Grant Permission</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const bottomSheetTranslateY = bottomSheetAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [300, 0], // Adjusted output range for potentially taller content
  });

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />
      <CameraView
        ref={cameraRef}
        style={styles.camera}
        animateShutter={false} // Ensure shutter animation is off
        facing={cameraFacing}
        flash={flashEnabled ? 'torch' : 'off'}
        onCameraReady={() => {
          console.log('Camera ready');
          setCameraReady(true);
        }}
        onMountError={(error: { message: string }) => {
          console.error('Camera mount error:', error);
          setLastError(`Camera mount error: ${error.message}`);
        }}
      >
        {/* Top Bar with Status Chip on Right */}
        <View style={styles.topBar}>
          <TouchableOpacity
            style={styles.topBarButton}
            onPress={() => navigation?.goBack?.()}
          >
            <ChevronLeft size={24} color="white" />
          </TouchableOpacity>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', marginRight: 8 }}>
              <Badge
                style={{ backgroundColor: isDetecting ? '#4CD964' : '#888', marginRight: 6 }}
                size={22}
              >
                {isDetecting ? 'ON' : 'OFF'}
              </Badge>
            </View>
            <TouchableOpacity
              style={styles.topBarButton}
              onPress={() => setShowSettings(true)}
            >
              <Settings size={24} color="white" />
            </TouchableOpacity>
          </View>
        </View>

        {/* Grid Overlay */}
        {renderGrid()}

        {/* Debug Information */}
        {debugMode && (
          <View style={[styles.debugInfo, { maxWidth: 220, top: 120, left: 20 }]}> 
            <Text style={styles.debugText}>Status: {isDetecting ? 'Detecting' : 'Idle'}</Text>
            <Text style={styles.debugText}>Processing: {isProcessing ? 'Yes' : 'No'}</Text>
            <Text style={styles.debugText}>Detections: {detections.length}</Text>
            <Text style={styles.debugText}>Lang: {language}</Text>
            <Text style={styles.debugText}>User: {username || 'Not set'}</Text>
            {lastError && <Text style={styles.debugErrorText}>Error: {lastError}</Text>}
          </View>
        )}

        {/* Processing Indicator (corner only) */}
        {isProcessing && queueSize > 0 && (
          <View style={styles.processingContainer}>
            <ActivityIndicator size="small" color="#ffffff" />
          </View>
        )}

        {/* Render detection markers using Marker component */}
        {detections.map((detection, index) => {
          if (!detection.markerPosition) return null;
          return (
            <Marker
              key={`${index}-${detection.label_en}`}
              position={{ x: detection.markerPosition[0] - 16, y: detection.markerPosition[1] - 16 }}
              isSelected={selectedDetection?.label_en === detection.label_en}
              label={detection.label_en}
              onPress={() => handleDetectionPress(detection)}
            />
          );
        })}
      </CameraView>

      {/* Bottom Controls Bar (Keep as is) */}
      <View style={styles.controls}>
        <TouchableOpacity
          style={styles.controlButton}
          onPress={() => setCameraFacing(
            (currentType: CameraType) => currentType === 'back' ? 'front' : 'back' // Added type annotation
          )}
        >
          <CameraIcon size={24} color="white" />
          <Text style={styles.controlText}>Flip</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.detectionButton, isDetecting && styles.stopButton]}
          onPress={toggleDetection}
          disabled={!cameraReady} // Disable button until camera is ready
        >
          <Text style={styles.detectionButtonText}>
            {isDetecting ? 'Stop' : 'Start'} Detection
          </Text>
        </TouchableOpacity>
      </View>

      {/* Settings Modal */}
      <Portal>
        <Modal visible={showSettings} onDismiss={() => setShowSettings(false)} contentContainerStyle={{ backgroundColor: 'white', margin: 30, borderRadius: 16, padding: 20 }}>
          <Text style={{ fontWeight: 'bold', fontSize: 18, marginBottom: 16 }}>Camera Settings</Text>
          <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 12 }}>
            <Text style={{ flex: 1 }}>Show Grid</Text>
            <Switch value={showGrid} onValueChange={setShowGrid} />
          </View>
          <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 12 }}>
            <Text style={{ flex: 1 }}>Flashlight</Text>
            <Switch value={flashEnabled} onValueChange={setFlashEnabled} />
          </View>
          <TouchableOpacity onPress={() => setShowSettings(false)} style={{ marginTop: 20, alignSelf: 'flex-end' }}>
            <Text style={{ color: '#FF6B00', fontWeight: 'bold' }}>Close</Text>
          </TouchableOpacity>
        </Modal>
      </Portal>

      {/* Challenge Complete Snackbar */}
      <Snackbar
        visible={showChallengeSnackbar}
        onDismiss={() => setShowChallengeSnackbar(false)}
        duration={3500}
        style={{ backgroundColor: '#4CD964', borderRadius: 12, margin: 16 }}
      >
        🎉 Challenge Complete! You've completed a detection challenge.
      </Snackbar>

      {/* Bottom Sheet for Selected Detection */}
      {selectedDetection && (
        <Animated.View
          style={[
            styles.bottomSheet,
            { transform: [{ translateY: bottomSheetTranslateY }], padding: 0, backgroundColor: '#f8f8f8' }
          ]}
        >
          <Card style={{ borderTopLeftRadius: 20, borderTopRightRadius: 20, elevation: 0, backgroundColor: '#fff' }}>
            <View style={styles.bottomSheetHandle} />
            <View style={[styles.bottomSheetHeader, { borderBottomWidth: 0, marginBottom: 0, paddingBottom: 0 }]}> 
              <Text style={[styles.bottomSheetTitle, { fontSize: 20 }]}>{selectedDetection.label_en}</Text>
              <TouchableOpacity onPress={hideBottomSheet}>
                <X size={24} color="#333" />
              </TouchableOpacity>
            </View>
            <Card.Content style={{ paddingTop: 0 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 12 }}>
                <Badge style={{ backgroundColor: '#FF6B00', marginRight: 12, width: 32, height: 32, borderRadius: 16, justifyContent: 'center', alignItems: 'center' }} size={32}>
                  {selectedDetection.label_en[0]}
                </Badge>
                <View>
                  <Text style={{ color: '#888', fontSize: 15, marginTop: 2 }}>Translation:</Text>
                  <Text style={{ color: '#333', fontSize: 17, fontWeight: '600' }}>{selectedDetection.label}</Text>
                </View>
              </View>
              {/* Divider */}
              <View style={{ height: 1, backgroundColor: '#eee', marginVertical: 10 }} />
              {/* Learn More Section */}
              {learnMoreData && learnMoreData.original_word === selectedDetection.label_en && (
                <View style={{ backgroundColor: '#eaf6ff', borderRadius: 8, padding: 14, marginBottom: 8 }}>
                  <Text style={{ color: '#007AFF', fontWeight: 'bold', marginBottom: 8, fontSize: 16 }}>Learn More</Text>
                  <Text style={{ color: '#333', fontSize: 15, marginBottom: 6 }}>{learnMoreData.sentence1}</Text>
                  <Text style={{ color: '#333', fontSize: 15 }}>{learnMoreData.sentence2}</Text>
                </View>
              )}
              <View style={{ flexDirection: 'row', gap: 12, marginTop: 18 }}>
                <TouchableOpacity
                  style={[styles.actionButton, styles.learnMoreButton, { flex: 1, justifyContent: 'center' }]}
                  onPress={() => handleLearnMore(selectedDetection.label_en)}
                >
                  <BookOpen size={20} color="white" />
                  <Text style={styles.actionButtonText}>Learn More</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.actionButton, styles.saveButton, { flex: 1, justifyContent: 'center' }]}
                  onPress={() => handleSaveDetection(selectedDetection)}
                >
                  <Save size={20} color="white" />
                  <Text style={styles.actionButtonText}>Save</Text>
                </TouchableOpacity>
              </View>
            </Card.Content>
          </Card>
        </Animated.View>
      )}
    </View>
  );
}