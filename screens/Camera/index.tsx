import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import {
  Text,
  View,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Dimensions,
  Platform,
  StatusBar,
  Animated,
  Image,
  StyleSheet,
  PanResponder
} from 'react-native';
import { CameraView, CameraType, useCameraPermissions } from 'expo-camera';
import { manipulateAsync, SaveFormat } from 'expo-image-manipulator';
import * as SecureStore from 'expo-secure-store';
import { useIsFocused, useFocusEffect } from '@react-navigation/native';
import { Camera as CameraIcon, Settings, Languages, ChevronLeft, X, Save, BookOpen } from 'lucide-react-native';
import axios from 'axios';
import { Badge, Modal, Portal, Switch, Card, Paragraph, Snackbar } from 'react-native-paper';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';
// Import API_URL from constants
import { API_URL } from '../../config/constants';
// Import styles and THEME_COLOR from styles.ts
import styles, { THEME_COLOR } from './styles';
import { Marker } from './marker';
import { getToken } from '@/services/Auth';
import * as Speech from 'expo-speech';
import { Ionicons } from '@expo/vector-icons';
import { showMessage } from 'react-native-flash-message';

// Define the structure for API detection results
interface ApiDetectionObject {
  box: [number, number, number, number]; // Updated: [x, y, width, height]
  class: number;
  confidence: number;
  label: string; // Translated label
  label_en: string; // English label
  centre: [number, number]; // Updated: Now mandatory [centerX, centerY] from API
}

// Update Detection type - markerPosition is no longer needed as we use centre
interface Detection extends ApiDetectionObject {
  // markerPosition?: [number, number]; // Removed
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

// Mascot images
const mascotSmiling = require('../../assets/images/cat-smiling.png');
const mascotSleeping = require('../../assets/images/cat-sleeping.png');

// Memoize Marker to avoid unnecessary re-renders
const MemoizedMarker = React.memo(Marker);

export default function CameraScreen({ navigation }: any) {
  const [permission, requestPermission] = useCameraPermissions();
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
  const [ShowSaveSnackbar, setShowSaveSnackbar] = useState(false);
  const [learnMoreData, setLearnMoreData] = useState<PhraseApiResponse | null>(null);
  const [showMascotTip, setShowMascotTip] = useState(false);
  const router = useRouter();
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

  const pan = useRef(new Animated.Value(0)).current;
  const panResponder = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: (_, gestureState) => gestureState.dy > 10,
      onPanResponderMove: (_, gestureState) => {
        if (gestureState.dy > 0) {
          pan.setValue(gestureState.dy);
        }
      },
      onPanResponderRelease: (_, gestureState) => {
        if (gestureState.dy > 80) {
          hideBottomSheet();
          pan.setValue(0);
        } else {
          Animated.spring(pan, {
            toValue: 0,
            useNativeDriver: true,
          }).start();
        }
      },
    })
  ).current;

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
        // Retrieve the auth token
        const token =await getToken(); // Assuming 'jwtToken' is the key used during login
        if (token) {
          setAuthToken(token);
          console.log('Auth token loaded from SecureStore.');
        } else {
          console.log('No auth token found in SecureStore, using fallback.');
        }
        // Check if challenge notification was already shown
        const notified = await AsyncStorage.getItem('challengeNotified');
        setChallengeNotified(!!notified);
      } catch (err) {
        console.error('Error retrieving user data or token:', err);
        setUsername('monil');
        console.log('Using fallback token due to error.');
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
      (formData as any).append('image', {
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
            // Updated validation for [x, y, width, height] format and centre
            return (
              Array.isArray(det.box) &&
              det.box.length === 4 &&
              !det.box.some((coord: number) => isNaN(coord)) &&
              det.box[2] > 0 && // width > 0
              det.box[3] > 0 && // height > 0
              Array.isArray(det.centre) && // Ensure centre exists and is an array
              det.centre.length === 2 &&
              !det.centre.some((coord: number) => isNaN(coord))
            );
          });
  
          // Adjust coordinates using provided centre - No adjustment needed, just pass through
          // The scaling will happen during rendering
          const processedDetections: Detection[] = validDetections.map((det: ApiDetectionObject): Detection => {
            // Return the detection object with the original API data
            // No need for markerPosition anymore
            return {
              ...det,
            };
          });
  
          console.log('Processed detections:', processedDetections.length);
          if (debugMode) {
            console.log('Detection details:', JSON.stringify(processedDetections));
          }
  
          setDetections(processedDetections);
  
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

  // Memoize handlers to avoid unnecessary re-renders
  const handleDetectionPress = useCallback((detection: Detection) => {
    setSelectedDetection(detection);
    showBottomSheet();
  }, [showBottomSheet]);

  const handleSaveDetection = useCallback(async (detection: Detection) => {
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
          'Authorization': `Bearer ${authToken}`,
        },
        body: JSON.stringify({
          detections: [
            {
              data: `Object: ${detection.label_en}`,
              label: detection.label_en,
              translated_label: detection.label,
              confidence: detection.confidence,
            }
          ]
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Save Error (${response.status}): ${errorText}`);
      }

      const result = await response.json();
      console.log('Save result:', result);
      setShowChallengeSnackbar(false); // Hide any previous challenge snackbar
      showMessage({
        message: 'Detection saved!',
        description: 'Detection has been saved successfully.',
        type: 'success',
        icon: 'success',
        duration: 2000,
      });
      hideBottomSheet();

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error saving detection';
      console.error('Error saving detection:', errorMessage);
      showMessage({
        message: 'Save Failed',
        description: `Could not save detection: ${errorMessage}`,
        type: 'danger',
        icon: 'danger',
        duration: 2500,
      });
    }
  }, [authToken, hideBottomSheet, ShowSaveSnackbar]);

  const handleLearnMore = useCallback(async (word: string) => {
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
      showMessage({
        message: 'Learn More Failed',
        description: `Could not fetch phrases: ${errorMessage}`,
        type: 'danger',
        icon: 'danger',
        duration: 2500,
      });
    }
  }, [authToken, language]);

  // Helper to map language code to TTS-compatible code
  const getTTSLang = (lang: string) => {
    const map: Record<string, string> = {
      hi: 'hi-IN',
      en: 'en-US',
      kn: 'kn-IN',
      mr: 'mr-IN',
      gu: 'gu-IN',
      es: 'es-ES',
      fr: 'fr-FR',
      ru: 'ru-RU',
      zh: 'zh-CN',
      ja: 'ja-JP',
    };
    return map[lang] || 'en-US';
  };

  const handleSpeak = (text: string) => {
    if (!text) return;
    Speech.speak(text, {
      language: getTTSLang(language),
      rate: 0.95,
      pitch: 1.0,
    });
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

  // Helper: Render bounding box overlays for debugging
  const renderDebugBoxes = () => {
    if (!debugMode) return null;
    return detections.map((detection, idx) => {
      if (!Array.isArray(detection.box) || detection.box.length !== 4) return null;
      // API image size (should match what you send to API)
      const apiWidth = 1280;
      const apiHeight = 960;
      const [x, y, w, h] = detection.box; // Use new format [x, y, width, height]
      const scaleX = cameraDimensions.width / apiWidth;
      const scaleY = cameraDimensions.height / apiHeight;
      const left = x * scaleX;
      const top = y * scaleY;
      const width = w * scaleX;
      const height = h * scaleY;
      // Log for debugging
      console.log(`Detection #${idx}: box=`, detection.box, 'centre=', detection.centre, 'rect:', { left, top, width, height });
      return (
        <View
          key={`debug-box-${idx}`}
          style={{
            position: 'absolute',
            left,
            top,
            width,
            height,
            borderWidth: 2,
            borderColor: 'lime',
            borderRadius: 6,
            zIndex: 50,
          }}
          pointerEvents="none"
        />
      );
    });
  };

  // Memoize grid and debug box overlays
  const gridOverlay = useMemo(() => renderGrid(), [showGrid, cameraDimensions]);
  const debugBoxesOverlay = useMemo(() => renderDebugBoxes(), [debugMode, detections, cameraDimensions]);

  // --- Render Logic ---

  if (!permission) {
    return (
      <View style={[styles.container, { justifyContent: 'center', alignItems: 'center', backgroundColor: '#181818' }]}> 
        <Image source={mascotSleeping} style={{ width: 120, height: 120, marginBottom: 18 }} />
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
        <Image source={mascotSleeping} style={{ width: 120, height: 120, marginBottom: 18 }} />
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

  const bottomSheetTranslateY = Animated.add(
    bottomSheetAnim.interpolate({
      inputRange: [0, 1],
      outputRange: [300, 0], // Adjusted output range for potentially taller content
    }),
    pan
  );

 

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />
      {/* Subtle background gradient overlay */}
      <View style={{
        ...StyleSheet.absoluteFillObject,
        zIndex: 0,
        backgroundColor: 'transparent',
      }}>
        <View style={{ flex: 1, backgroundColor: 'rgba(255,107,0,0.08)' }} />
      </View>
      <CameraView
        ref={cameraRef}
        style={styles.camera}
        facing={cameraFacing}
        enableTorch={flashEnabled}
        onCameraReady={() => {
          setCameraReady(true);
        }}
        onMountError={(error: { message: string }) => {
          setLastError(`Camera mount error: ${error.message}`);
        }}
      >
        {/* Top Bar with Status Chip on Right */}
        <View style={[styles.topBar, { backgroundColor: 'transparent', borderRadius: 18, margin: 10, marginTop: Platform.OS === 'android' ? 30 : 40, shadowColor: '#000', shadowOpacity: 0.08, shadowRadius: 8 }]}> 
          <TouchableOpacity
            style={styles.topBarButton}
            onPress={() => router.back()}
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
        {gridOverlay}

        {/* Mascot floating button */}
        <TouchableOpacity
          style={{ position: 'absolute', bottom: 120, right: 24, zIndex: 20 }}
          onPress={() => setShowMascotTip(t => !t)}
          activeOpacity={0.8}
        >
          <Image source={mascotSmiling} style={{ width: 56, height: 56, borderRadius: 28, backgroundColor: '#fff', borderWidth: 2, borderColor: THEME_COLOR, shadowColor: '#000', shadowOpacity: 0.12, shadowRadius: 6 }} />
        </TouchableOpacity>
        {showMascotTip && (
          <View style={{ position: 'absolute', bottom: 190, right: 24, backgroundColor: '#fff', borderRadius: 16, padding: 14, maxWidth: 220, shadowColor: '#000', shadowOpacity: 0.10, shadowRadius: 8, borderWidth: 1, borderColor: '#eee', zIndex: 30 }}>
            <Text style={{ color: THEME_COLOR, fontWeight: 'bold', fontSize: 15, marginBottom: 4 }}>Hi there!</Text>
            <Text style={{ color: '#333', fontSize: 14 }}>Point the camera at an object and tap "Start Detection". I'll help you learn what you see!</Text>
          </View>
        )}

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

        {/* Render detection markers using MemoizedMarker component */}
        {detections.map((detection, index) => {
          // Scale the centre coordinates for marker positioning
          const apiWidth = 1280; // Assume API processes 1280x960 images
          const apiHeight = 960;
          const scaleX = cameraDimensions.width / apiWidth;
          const scaleY = cameraDimensions.height / apiHeight;
          let markerX = detection.centre[0] * scaleX;
          let markerY = detection.centre[1] * scaleY;
          markerX += 28; // Move marker 10 more pixels to the right

          // Adjust position based on marker size (assuming marker is 32x32)
          const markerOffsetX = 16;
          const markerOffsetY = 16;

          return (
            <MemoizedMarker
              key={`${index}-${detection.label_en}`}
              position={{ x: markerX - markerOffsetX, y: markerY - markerOffsetY }}
              isSelected={selectedDetection?.label_en === detection.label_en}
              label={detection.label_en}
              onPress={() => handleDetectionPress(detection)}
            />
          );
        })}

        {/* Render debug boxes overlay */}
        {debugBoxesOverlay}

        {/* Mascot in empty state (no detections, not processing, not detecting) */}
        {(!isProcessing && detections.length === 0 && !isDetecting) && (
          <View style={{ position: 'absolute', alignSelf: 'center', top: '35%', alignItems: 'center', zIndex: 10 }}>
            <Image source={mascotSmiling} style={{ width: 90, height: 90, marginBottom: 10 }} />
            <Text style={{ color: '#fff', fontSize: 17, fontWeight: '600', textAlign: 'center', textShadowColor: '#000', textShadowRadius: 4 }}>Ready to explore! Start detection to see what I find.</Text>
          </View>
        )}
      </CameraView>

      {/* Bottom Controls Bar (revamped) */}
      <View style={[styles.controls, { borderTopLeftRadius: 24, borderTopRightRadius: 24, backgroundColor: 'rgba(0,0,0,0.92)', shadowColor: '#000', shadowOpacity: 0.10, shadowRadius: 8 }]}> 
        <TouchableOpacity
          style={styles.controlButton}
          onPress={() => setCameraFacing(
            (currentType: CameraType) => currentType === 'back' ? 'front' : 'back'
          )}
        >
          <CameraIcon size={24} color="white" />
          <Text style={styles.controlText}>Flip</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.detectionButton,
            isDetecting && styles.stopButton,
            { elevation: 2, shadowColor: THEME_COLOR, shadowOpacity: 0.18, shadowRadius: 8, minWidth: 160, flexDirection: 'row', alignItems: 'center', justifyContent: 'center' }
          ]}
          onPress={toggleDetection}
          disabled={!cameraReady}
          activeOpacity={0.85}
        >
          <Image source={mascotSmiling} style={{ width: 28, height: 28, marginRight: 10 }} />
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
          {...panResponder.panHandlers}
        >
          <Card style={{ borderTopLeftRadius: 24, borderTopRightRadius: 24, elevation: 2, backgroundColor: '#fff', shadowColor: '#000', shadowOpacity: 0.08, shadowRadius: 8 }}>
            {/* Swipe down handle */}
            <View style={{ alignItems: 'center', paddingTop: 10, paddingBottom: 2 }}>
              <View style={{ width: 48, height: 6, borderRadius: 3, backgroundColor: '#ddd', marginBottom: 8 }} />
            </View>
            {/* Header: mascot, title, close */}
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginBottom: 8, paddingHorizontal: 16 }}>
              <Image source={mascotSmiling} style={{ width: 32, height: 32, marginRight: 10 }} />
              <Text style={[styles.bottomSheetTitle, { fontSize: 20, flex: 1, textAlign: 'center', color: THEME_COLOR }]} numberOfLines={1}>
                {selectedDetection.label_en}
              </Text>
              <TouchableOpacity onPress={hideBottomSheet} style={{ marginLeft: 10, alignSelf: 'flex-start' }}>
                <X size={26} color="#333" />
              </TouchableOpacity>
            </View>
            <Card.Content style={{ paddingTop: 0, paddingHorizontal: 16 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 16, backgroundColor: '#FFF6ED', borderRadius: 12, padding: 10 }}>
                <Badge style={{ backgroundColor: THEME_COLOR, marginRight: 14, width: 36, height: 36, borderRadius: 18, justifyContent: 'center', alignItems: 'center', fontSize: 18 }} size={36}>
                  {selectedDetection.label_en[0]}
                </Badge>
                <View>
                  <Text style={{ color: '#888', fontSize: 15, marginTop: 2 }}>Translation:</Text>
                  <Text style={{ color: '#333', fontSize: 18, fontWeight: '700' }}>{selectedDetection.label}</Text>
                </View>
              </View>
              {/* Divider */}
              <View style={{ height: 1, backgroundColor: '#eee', marginVertical: 10 }} />
              {/* Learn More Section */}
              {learnMoreData && learnMoreData.original_word === selectedDetection.label_en && (
                <View style={{ backgroundColor: '#eaf6ff', borderRadius: 8, padding: 14, marginBottom: 8 }}>
                <Text style={{ color: '#007AFF', fontWeight: 'bold', marginBottom: 8, fontSize: 16 }}>Learn More</Text>
                <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 6 }}>
                  <Text style={{ color: '#333', fontSize: 15, flex: 1 }}>{learnMoreData.sentence1}</Text>
                  <TouchableOpacity onPress={() => handleSpeak(learnMoreData.sentence1, language)}>
                    <Ionicons name="volume-high" size={22} color="#FF6B00" />
                  </TouchableOpacity>
                </View>
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                  <Text style={{ color: '#333', fontSize: 15, flex: 1 }}>{learnMoreData.sentence2}</Text>
                  <TouchableOpacity onPress={() => handleSpeak(learnMoreData.sentence2, language)}>
                    <Ionicons name="volume-high" size={22} color="#FF6B00" />
                  </TouchableOpacity>
                </View>
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