import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  Platform,
  ActivityIndicator,
  Alert // Added Alert
} from 'react-native';
import { ChevronLeft, Languages, Settings, X, Save, Camera as CameraIcon, BookOpen } from 'lucide-react-native'; // Added BookOpen
import { API_URL } from '../../config/constants'; // Import API_URL
import * as SecureStore from 'expo-secure-store'; // Needed for username

// Interfaces from index.tsx (should be moved to a shared types file ideally)
interface ApiDetectionObject {
  box: number[];
  class: number;
  confidence: number;
  label: string; // Translated label
  label_en: string; // English label
  center?: number[];
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

interface Detection extends ApiDetectionObject {}

interface PhraseApiResponse {
    original_word: string;
    sentence1: string;
    sentence2: string;
}

// --- Inline Marker Component for Web ---
interface WebMarkerProps {
  position: { x: number; y: number };
  isSelected: boolean;
  label: string; // Translated label
  label_en: string; // English label
  onPress: () => void;
}

const WebMarker: React.FC<WebMarkerProps> = ({ position, isSelected, label, label_en, onPress }) => {
  // Basic marker styling, adjust as needed
  const markerStyle: React.CSSProperties = {
    position: 'absolute',
    left: position.x - 8, // Center the dot
    top: position.y - 8,
    width: 16,
    height: 16,
    borderRadius: '50%',
    backgroundColor: isSelected ? 'rgba(255, 107, 0, 0.9)' : 'rgba(255, 255, 255, 0.7)',
    border: '2px solid white',
    cursor: 'pointer',
    transform: isSelected ? 'scale(1.2)' : 'scale(1)',
    transition: 'transform 0.1s ease-in-out, background-color 0.1s ease-in-out',
    zIndex: isSelected ? 10 : 1,
  };

  const labelStyle: React.CSSProperties = {
    position: 'absolute',
    top: '100%', // Position below the marker
    left: '50%',
    transform: 'translateX(-50%)',
    marginTop: '5px',
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    color: 'white',
    padding: '4px 8px',
    borderRadius: '4px',
    fontSize: '12px',
    whiteSpace: 'nowrap', // Prevent wrapping
    zIndex: 11,
  };

  return (
    // Use div for web elements
    <div style={markerStyle} onClick={onPress} title={label_en}>
      {isSelected && (
        <div style={labelStyle}>
          {label} ({label_en})
        </div>
      )}
    </div>
  );
};
// --- End Inline Marker Component ---

const THEME_COLOR = '#FF6B00';
const POLLING_INTERVAL = 10000; // Poll every 10 seconds
const MAX_QUEUE_SIZE = 1; // Manage concurrent requests

export function WebCamera({ navigation }: any) {
  // Removed WebSocket state: isConnected, socketRef
  // Removed streaming state: isStreaming, streamIntervalRef
  const [isDetecting, setIsDetecting] = useState(false); // Replaces isStreaming
  const [isProcessing, setIsProcessing] = useState(false);
  const [messages, setMessages] = useState<string[]>([]); // Keep for debug
  const [detections, setDetections] = useState<Detection[]>([]); // Use Detection type
  const [selectedDetection, setSelectedDetection] = useState<Detection | null>(null);
  const [showDebug, setShowDebug] = useState(false);
  const [permissionState, setPermissionState] = useState<'prompt'|'granted'|'denied'>('prompt');
  const [username, setUsername] = useState('web-user'); // Default username for web
  const [language, setLanguage] = useState('hi'); // Default language
  const [lastError, setLastError] = useState<string | null>(null);

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const pollIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const [queueSize, setQueueSize] = useState(0);
  const lastCaptureTime = useRef(0);

  // Check permissions and load username on mount
  useEffect(() => {
    checkCameraPermissions();
    // Load username (similar to native, maybe abstract this)
    (async () => {
      try {
        // SecureStore might not work reliably on web, consider alternatives if needed
        const userData = await SecureStore.getItemAsync('userData');
        if (userData) {
          const parsedData = JSON.parse(userData);
          setUsername(parsedData.username || 'web-user');
        } else {
          setUsername('web-user');
        }
      } catch (err) {
        console.error('Error retrieving user data on web:', err);
        setUsername('web-user');
      }
    })();

    return () => {
      stopPollingDetection(); // Cleanup polling on unmount
      stopVideoStream(); // Stop video stream
    };
  }, []);

  // Start/Stop polling based on isDetecting state
  useEffect(() => {
    if (isDetecting && permissionState === 'granted') {
      startPollingDetection();
    } else {
      stopPollingDetection();
    }
    // No return cleanup needed here as it's handled in the main unmount effect
  }, [isDetecting, permissionState]);

  // ... (keep checkCameraPermissions, requestCameraPermission) ...
  const checkCameraPermissions = async () => {
    try {
      // Check if we can access permission state
      if (navigator?.permissions) {
        const result = await navigator.permissions.query({ name: 'camera' as PermissionName });
        setPermissionState(result.state as 'prompt'|'granted'|'denied');
        
        // Listen for permission changes
        result.addEventListener('change', () => {
          setPermissionState(result.state as 'prompt'|'granted'|'denied');
        });
      } else {
        // Fall back to checking media devices
        if (navigator?.mediaDevices?.enumerateDevices) {
          navigator.mediaDevices.enumerateDevices()
            .then(devices => {
              const hasCamera = devices.some(device => device.kind === 'videoinput');
              if (hasCamera) {
                setPermissionState('prompt'); // We can't be sure, but at least there's a camera
              }
            })
            .catch(() => {
              setPermissionState('prompt'); // Default to prompt if we can't check
            });
        }
      }
    } catch (error) {
      console.error("Error checking camera permissions:", error);
      setPermissionState('prompt');
    }
  };

  const requestCameraPermission = async () => {
    // ... existing implementation ...
    // Ensure startVideoStream is called after permission is granted
    try {
      if (!navigator?.mediaDevices?.getUserMedia) {
        addMessage("❌ Camera API not supported in this browser");
        return;
      }

      const stream = await navigator.mediaDevices.getUserMedia({ video: { width: 640, height: 480 } });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        setPermissionState('granted');
        addMessage("✅ Camera permission granted and stream started");
        // Don't automatically start detection polling here, let the button handle it
      } else {
         addMessage("❌ Video element not ready");
         stream.getTracks().forEach(track => track.stop()); // Stop stream if video element isn't ready
      }
    } catch (error) {
      console.error("Camera permission/stream error:", error);
      setPermissionState('denied');
      addMessage(`❌ Camera error: ${error}`);
    }
  };

  // Renamed from startStreaming
  const startVideoStream = async () => {
    if (permissionState !== 'granted') {
      await requestCameraPermission();
    }
    // If permission is now granted, the video stream should already be active
    // from the requestCameraPermission function.
    // If it failed, permissionState will be 'denied' and polling won't start.
  };

  // Renamed from stopStreaming
  const stopVideoStream = () => {
    if (videoRef.current?.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      stream.getTracks().forEach(track => track.stop());
      videoRef.current.srcObject = null;
      addMessage("⏹️ Video stream stopped");
    }
  };

  // Removed connectWebSocket function

  // Replaces sendFrame - captures and sends via API
  const captureAndSendFrame = async () => {
    if (!canvasRef.current || !videoRef.current || isProcessing || permissionState !== 'granted') {
       console.log('Skipping capture:', { hasCanvas: !!canvasRef.current, hasVideo: !!videoRef.current, isProcessing, permissionState });
      return;
    }

    const currentTime = Date.now();
    if (currentTime - lastCaptureTime.current < POLLING_INTERVAL / 2) {
      console.log('Too soon for next capture');
      return;
    }

    if (queueSize >= MAX_QUEUE_SIZE) {
      console.log('Request queue full, skipping frame');
      return;
    }

    const context = canvasRef.current.getContext('2d');
    if (!context) {
      addMessage('❌ Canvas context not available');
      return;
    }

    try {
      addMessage('Capturing frame for API...');
      setIsProcessing(true);
      setQueueSize(prev => prev + 1);
      lastCaptureTime.current = currentTime;
      setLastError(null);

      context.drawImage(videoRef.current, 0, 0, 640, 480);
      // Get base64 data URL
      const dataURL = canvasRef.current.toDataURL('image/jpeg', 0.6); // Moderate quality/compression

      const requestBody = {
        image_data: dataURL,
        username: username,
        target_language: language,
        profile: "tourist" // Assuming 'tourist' profile
      };

      addMessage('Sending frame to API...');
      const response = await fetch(`${API_URL}/api/detect`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`API Error (${response.status}): ${errorText}`);
      }

      const data: DetectionApiResponse = await response.json();
      addMessage(`API Response: ${data.status}, Count: ${data.count}`);

      if (data.status === 'success' && Array.isArray(data.objects)) {
        const validDetections = data.objects.filter((det: ApiDetectionObject) => {
          return (
            Array.isArray(det.box) &&
            det.box.length === 4 &&
            !det.box.some((coord: number) => isNaN(coord)) &&
            det.box[2] > det.box[0] &&
            det.box[3] > det.box[1]
          );
        });

        // Adjust coordinates for display (relative to 640x480 video)
        const adjustedDetections = validDetections.map((det: ApiDetectionObject) => {
          // API coordinates seem to be based on the processed image size (e.g., 640x480)
          // Center calculation remains the same relative to that size.
          const centerX = (det.box[0] + det.box[2]) / 2;
          const centerY = (det.box[1] + det.box[3]) / 2;

          return {
            ...det,
            center: [centerX, centerY]
          };
        });

        if (showDebug) {
          addMessage(`Processed Detections: ${JSON.stringify(adjustedDetections)}`);
        }
        setDetections(adjustedDetections);

        if (data.completed_challenge) {
          // Use Alert for consistency with native
          Alert.alert("Challenge Complete!", "You've completed a detection challenge.");
        }

      } else if (data.status !== 'success') {
        addMessage(`API Status: ${data.message || data.status}`);
        setLastError(`API Status: ${data.message || data.status}`);
        setDetections([]);
      } else {
        setDetections([]);
      }

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error during detection';
      addMessage(`❌ Error: ${errorMessage}`);
      console.error('Error capturing or processing frame:', errorMessage);
      setLastError(`Detection Error: ${errorMessage}`);
      setDetections([]);
    } finally {
      setIsProcessing(false);
      setQueueSize(prev => Math.max(0, prev - 1));
    }
  };

  const startPollingDetection = () => {
    if (pollIntervalRef.current) {
      clearInterval(pollIntervalRef.current);
    }
    addMessage(`Starting polling every ${POLLING_INTERVAL / 1000} seconds`);
    captureAndSendFrame(); // Initial call
    pollIntervalRef.current = setInterval(captureAndSendFrame, POLLING_INTERVAL);
  };

  const stopPollingDetection = () => {
    if (pollIntervalRef.current) {
      addMessage('Stopping polling detection');
      clearInterval(pollIntervalRef.current);
      pollIntervalRef.current = null;
    }
    setIsProcessing(false);
    setQueueSize(0);
    setDetections([]); // Clear detections when stopping polling
  };

  const toggleDetection = async () => {
    if (!isDetecting) {
      // Ensure video stream is running before starting detection
      if (!videoRef.current?.srcObject) {
        await startVideoStream();
        // If permission was denied or stream failed, startVideoStream handles it,
        // and the useEffect for isDetecting won't start polling.
      }
      // Only set isDetecting if permission is granted
      if (permissionState === 'granted') {
         addMessage('▶️ Starting detection...');
         setIsDetecting(true); // This will trigger the useEffect to start polling
      } else {
          addMessage('⚠️ Cannot start detection without camera permission.');
      }
    } else {
      addMessage('⏹️ Stopping detection...');
      setIsDetecting(false); // This will trigger the useEffect to stop polling
      // Optionally stop the video stream as well, or keep it running
      // stopVideoStream();
    }
  };

  const addMessage = (message: string) => {
    setMessages(prev => [`[${new Date().toLocaleTimeString()}] ${message}`, ...prev.slice(0, 19)]);
  };

  const handleDetectionPress = (detection: Detection) => {
    setSelectedDetection(detection);
  };

  const closeSelectedDetection = () => {
    setSelectedDetection(null);
  };

  // --- New API Call Functions (similar to native) ---

  const handleSaveDetection = async (detection: Detection) => {
    if (!detection) return;
    addMessage(`Saving detection: ${detection.label_en}`);
    try {
      const response = await fetch(`${API_URL}/api/store_detection`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          username: username,
          label_en: detection.label_en,
          label_translated: detection.label,
          confidence: detection.confidence,
          box: detection.box,
          target_language: language,
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Save Error (${response.status}): ${errorText}`);
      }

      const result = await response.json();
      addMessage(`Save result: ${JSON.stringify(result)}`);
      Alert.alert('Saved', `${detection.label_en} (${detection.label}) saved successfully.`);
      closeSelectedDetection();

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error saving detection';
      addMessage(`❌ Save Failed: ${errorMessage}`);
      console.error('Error saving detection:', errorMessage);
      Alert.alert('Save Failed', `Could not save detection: ${errorMessage}`);
    }
  };

  const handleLearnMore = async (word: string) => {
    if (!word) return;
    addMessage(`Fetching phrases for: ${word} in ${language}`);
    try {
      const response = await fetch(`${API_URL}/api/phrase`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
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
      addMessage(`Phrase API response: ${JSON.stringify(data)}`);

      Alert.alert(
        `Learn about "${data.original_word}"`,
        `1. ${data.sentence1}\n\n2. ${data.sentence2}`,
        [{ text: 'OK' }]
      );

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error fetching phrases';
      addMessage(`❌ Learn More Failed: ${errorMessage}`);
      console.error('Error fetching phrases:', errorMessage);
      Alert.alert('Learn More Failed', `Could not fetch phrases: ${errorMessage}`);
    }
  };

  // --- Render Logic ---

  // Render camera permission UI
  if (permissionState === 'prompt' || permissionState === 'denied') {
    // ... (keep existing permission UI) ...
     return (
      <View style={styles.permissionContainer}>
        {/* ... Top bar ... */} 
        <View style={styles.permissionContent}>
          {/* ... Icon, Title, Text ... */}
          <TouchableOpacity
            style={styles.permissionButton}
            onPress={requestCameraPermission} // This now also starts the stream
          >
            <Text style={styles.permissionButtonText}>
              {permissionState === 'prompt' ? 'Enable Camera Access' : 'Try Again'}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  // Main camera view render
  return (
    <View style={styles.container}>
      {/* Top Bar */}
      <View style={styles.topBar}>
         {/* ... Back Button ... */} 
         <TouchableOpacity
            style={styles.topBarButton}
            onPress={() => navigation?.goBack?.()}
          >
            <ChevronLeft size={24} color="white" />
          </TouchableOpacity>
        <View style={styles.topBarRight}>
           {/* ... Language Button (optional) ... */} 
          <TouchableOpacity
            style={styles.topBarButton}
            onPress={() => setShowDebug(!showDebug)}
          >
            <Settings size={24} color="white" />
          </TouchableOpacity>
        </View>
      </View>

      {/* Status Indicator (Detecting/Idle) */}
      <View style={[
        styles.statusBar,
        {backgroundColor: isDetecting ? 'rgba(76, 217, 100, 0.8)' : 'rgba(100, 100, 100, 0.7)'}
      ]}>
        <Text style={styles.statusText}>
          {isDetecting ? 'Detecting...' : 'Idle'}
          {isProcessing ? ' (Processing)' : ''}
        </Text>
      </View>

      {/* Video Container */}
      <View style={styles.videoContainer}>
        <View style={styles.videoWrapper}>
          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted
            style={{
              width: 640,
              height: 480,
              backgroundColor: '#333',
              objectFit: 'cover',
              borderRadius: 12, // Match wrapper
            }}
          />
          <canvas
            ref={canvasRef}
            width={640}
            height={480}
            style={{display: 'none'}}
          />

          {/* Render Detection Markers using WebMarker */}
          {detections.map((detection, index) => (
            <WebMarker // Use the new inline component
              key={`${index}-${detection.label_en}`}
              position={{ x: detection.center?.[0] ?? 0, y: detection.center?.[1] ?? 0 }}
              isSelected={selectedDetection === detection}
              label={detection.label}
              label_en={detection.label_en}
              onPress={() => handleDetectionPress(detection)}
            />
          ))}

          {/* Processing indicator */}
          {isProcessing && (
             // ... existing processing indicator ...
            <View style={styles.processingIndicator}>
              <ActivityIndicator size="small" color="#fff" />
              <Text style={styles.processingText}>Processing...</Text>
            </View>
          )}
        </View>
      </View>

      {/* Controls */}
      <View style={styles.controls}>
        <TouchableOpacity
          style={[
            styles.detectionButton,
            isDetecting && styles.stopButton,
            // ... web shadow styles ...
          ]}
          onPress={toggleDetection} // Use the combined toggle function
          disabled={permissionState !== 'granted'} // Disable if no permission
        >
          <Text style={styles.detectionButtonText}>
            {isDetecting ? 'Stop Detection' : 'Start Detection'}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Debug Messages */}
      {showDebug && (
        <View style={styles.messages}>
          <Text style={styles.messagesHeader}>Debug Messages</Text>
          {messages.map((msg, i) => (
            <Text key={i} style={styles.message}>{msg}</Text>
          ))}
          {lastError && <Text style={[styles.message, {color: 'red'}]}>Error: {lastError}</Text>}
        </View>
      )}

      {/* Selected Detection Details (Bottom Sheet equivalent) */}
      {selectedDetection && (
        <View style={styles.detectionDetails}>
          <View style={styles.detectionDetailsHeader}>
            {/* Use English label as title */}
            <Text style={styles.detectionTitle}>{selectedDetection.label_en}</Text>
            <TouchableOpacity
              style={styles.closeButton}
              onPress={closeSelectedDetection}
            >
              <X size={24} color="#fff" />
            </TouchableOpacity>
          </View>

          <View style={styles.detectionContent}>
            {/* Display both labels */}
            <View style={styles.detectionItem}>
              <Text style={styles.detectionLabel}>Original (en):</Text>
              <Text style={styles.detectionText}>{selectedDetection.label_en}</Text>
            </View>
            <View style={styles.detectionItem}>
              <Text style={styles.detectionLabel}>Translation ({language}):</Text>
              <Text style={styles.detectionText}>{selectedDetection.label}</Text>
            </View>
            <View style={styles.detectionItem}>
              <Text style={styles.detectionLabel}>Confidence:</Text>
              <Text style={styles.detectionText}>{(selectedDetection.confidence * 100).toFixed(1)}%</Text>
            </View>

            {/* Action Buttons */}
            <View style={styles.actionButtonsContainer}> // Added container for layout
              <TouchableOpacity
                style={[styles.actionButton, styles.learnMoreButton]} // Use new styles
                onPress={() => handleLearnMore(selectedDetection.label_en)}
              >
                <BookOpen size={20} color="white" />
                <Text style={styles.actionButtonText}>Learn More</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.actionButton, styles.saveButton]} // Use new styles
                onPress={() => handleSaveDetection(selectedDetection)}
              >
                <Save size={20} color="white" />
                <Text style={styles.actionButtonText}>Save</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      )}
    </View>
  );
}

// Using StyleSheet.create for proper type checking
const styles = StyleSheet.create({
  // ... (Keep existing styles: container, permission*, topBar*, statusBar, statusText, video*, controls, detectionButton*, stopButton, detectionButtonText, messages*, message*, noMessages, processing*) ...
  container: {
    flex: 1,
    backgroundColor: '#f5f5f7',
  },
  permissionContainer: {
    flex: 1,
    backgroundColor: '#f5f5f7',
  },
  permissionContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  permissionTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 12,
  },
  permissionText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginBottom: 30,
    maxWidth: 400,
  },
  permissionButton: {
    backgroundColor: THEME_COLOR,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  permissionButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#333',
  },
  topBarButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0,0,0,0.3)',
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 8,
  },
  topBarRight: {
    flexDirection: 'row',
  },
   statusBar: {
    alignSelf: 'center',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 15,
    marginTop: 10, // Added margin top
    marginBottom: 10,
  },
  statusText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  videoContainer: {
    alignItems: 'center',
    marginVertical: 20,
  },
  videoWrapper: {
    position: 'relative',
    width: 640,
    height: 480,
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: '#333', // Background for the wrapper
     ...(Platform.OS === 'web' && { boxShadow: '0 4px 12px rgba(0,0,0,0.1)' })
  },
  controls: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 15,
    backgroundColor: '#f5f5f7',
  },
  detectionButton: {
    backgroundColor: THEME_COLOR,
    paddingVertical: 15,
    paddingHorizontal: 30,
    borderRadius: 30,
    alignItems: 'center',
    justifyContent: 'center',
     ...(Platform.OS === 'web' && { boxShadow: '0 2px 8px rgba(255,107,0,0.4)' })
  },
  stopButton: {
    backgroundColor: 'rgba(255, 59, 48, 0.9)',
     ...(Platform.OS === 'web' && { boxShadow: '0 2px 8px rgba(255,59,48,0.4)' })
  },
  detectionButtonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: '600',
  },
  messages: {
    backgroundColor: 'rgba(255,255,255,0.9)',
    padding: 15,
    borderRadius: 8,
    maxHeight: 200,
    margin: 15,
     ...(Platform.OS === 'web' && { boxShadow: '0 2px 8px rgba(0,0,0,0.1)', overflowY: 'scroll' })
  },
  messagesHeader: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
    paddingBottom: 8,
  },
  message: {
    color: '#555',
    fontSize: 12,
    marginBottom: 6,
     ...(Platform.OS === 'web' && { fontFamily: 'monospace' })
  },
  noMessages: {
    color: '#999',
    fontSize: 14,
    fontStyle: 'italic',
    textAlign: 'center',
    marginTop: 20,
  },
   processingIndicator: {
    position: 'absolute',
    top: 10,
    right: 10,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    padding: 8,
    borderRadius: 4,
    flexDirection: 'row',
    alignItems: 'center',
  },
  processingText: {
    color: '#fff',
    fontSize: 12,
    marginLeft: 5,
  },

  // Styles for Detection Details (Bottom Sheet equivalent)
  detectionDetails: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(51, 51, 51, 0.95)',
    padding: 20,
    paddingBottom: 30, // More padding at bottom
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    ...(Platform.OS === 'web' && { boxShadow: '0 -2px 10px rgba(0,0,0,0.2)' })
  },
  detectionDetailsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.1)',
    paddingBottom: 10,
  },
  detectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
  },
  closeButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  detectionContent: {
    // Removed marginBottom: 20
  },
  detectionItem: {
    flexDirection: 'row',
    marginBottom: 14,
    alignItems: 'center', // Align items vertically
  },
  detectionLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#aaa',
    width: 120, // Increased width for labels
  },
  detectionText: {
    fontSize: 16,
    color: '#fff',
    flex: 1,
  },
  // Container for action buttons
  actionButtonsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: 25, // Add margin above buttons
  },
  // Shared style for action buttons
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 25,
    minWidth: 140, // Ensure buttons have enough width
    justifyContent: 'center',
  },
  actionButtonText: {
    color: 'white',
    marginLeft: 8,
    fontSize: 14,
    fontWeight: 'bold',
  },
  // Specific styles for Save and Learn More buttons
  saveButton: {
     backgroundColor: THEME_COLOR,
  },
  learnMoreButton: {
     backgroundColor: '#007AFF', // Blue color
  },
});
