import React, { useState, useRef, useEffect } from 'react';
import { StyleSheet, View, Text, TouchableOpacity, Platform, ActivityIndicator } from 'react-native';
import { ChevronLeft, Languages, Settings, X, Save, Camera as CameraIcon } from 'lucide-react-native';
import { Marker } from './marker';

const THEME_COLOR = '#FF6B00';
const ACCENT_COLOR = '#6366F1';
const WS_URL = 'wss://abdd-49-36-113-134.ngrok-free.app';

export function WebCamera({ navigation }: any) {
  const [isConnected, setIsConnected] = useState(false);
  const [isStreaming, setIsStreaming] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [messages, setMessages] = useState<string[]>([]);
  const [detections, setDetections] = useState<any[]>([]);
  const [selectedDetection, setSelectedDetection] = useState<any | null>(null);
  const [showDebug, setShowDebug] = useState(false);
  const [permissionState, setPermissionState] = useState<'prompt'|'granted'|'denied'>('prompt');
  
  const socketRef = useRef<WebSocket | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const streamIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Check for camera permissions on component mount
  useEffect(() => {
    checkCameraPermissions();
    return () => {
      stopStreaming();
      if (socketRef.current) {
        socketRef.current.close();
      }
    };
  }, []);

  // Add animation for spinner in web
  useEffect(() => {
    if (Platform.OS === 'web') {
      const existingStyle = document.getElementById('spinner-animation');
      if (!existingStyle) {
        const styleSheet = document.createElement('style');
        styleSheet.id = 'spinner-animation';
        styleSheet.textContent = `
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
        `;
        document.head.appendChild(styleSheet);
      }
      
      // Cleanup on unmount
      return () => {
        const styleElement = document.getElementById('spinner-animation');
        if (styleElement) {
          styleElement.remove();
        }
      };
    }
  }, []);

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
    try {
      if (!navigator?.mediaDevices?.getUserMedia) {
        addMessage("❌ Camera API not supported in this browser");
        return;
      }
      
      await navigator.mediaDevices.getUserMedia({ video: true })
        .then(() => {
          setPermissionState('granted');
          addMessage("✅ Camera permission granted");
        })
        .catch((err) => {
          console.error("Camera permission error:", err);
          setPermissionState('denied');
          addMessage("❌ Camera permission denied");
        });
    } catch (error) {
      console.error("Error requesting camera permission:", error);
      setPermissionState('denied');
      addMessage(`❌ Error requesting permission: ${error}`);
    }
  };

  const connectWebSocket = () => {
    try {
      addMessage('Connecting to WebSocket server...');
      socketRef.current = new WebSocket(WS_URL);
      
      socketRef.current.onopen = () => {
        addMessage('✅ Connected to server');
        setIsConnected(true);
        socketRef.current?.send(JSON.stringify({
          type: 'start',
          username: 'web-user'
        }));
      };

      socketRef.current.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          if (data.type === 'detection' && Array.isArray(data.results)) {
            addMessage(`Detected ${data.results.length} objects`);
            
            // Convert server coordinates to center points for markers
            const validDetections = data.results.filter((det: any) => {
              return (
                Array.isArray(det.box) && 
                det.box.length === 4 &&
                !det.box.some((coord: number) => isNaN(coord)) &&
                det.box[2] > det.box[0] && 
                det.box[3] > det.box[1]
              );
            });
            
            const adjustedDetections = validDetections.map((det: any) => {
              // Calculate center point of detection
              const centerX = (det.box[0] + det.box[2]) / 2;
              const centerY = (det.box[1] + det.box[3]) / 2;
              
              return {
                ...det,
                center: [centerX, centerY]
              };
            });
            
            setDetections(adjustedDetections);
            setIsProcessing(false);
          }
        } catch (e) {
          addMessage(`Error processing message: ${e}`);
          setIsProcessing(false);
        }
      };

      socketRef.current.onclose = () => {
        addMessage('❌ Disconnected from server');
        setIsConnected(false);
        setIsStreaming(false);
        setDetections([]);
      };

      socketRef.current.onerror = (error) => {
        addMessage(`WebSocket error: ${error}`);
      };

    } catch (error) {
      addMessage(`Connection error: ${error}`);
    }
  };

  const startStreaming = async () => {
    try {
      // Always request permission before starting stream
      if (permissionState !== 'granted') {
        await requestCameraPermission();
        // Exit if permission not granted after request
        if (permissionState === 'denied') return;
      }
      
      // Double-check permission state
      if (!navigator?.mediaDevices?.getUserMedia) {
        addMessage('❌ Camera access not available');
        return;
      }
      
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: 640, height: 480 }
      });
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        setPermissionState('granted'); // Set permission state directly since we got a stream
      }
      
      setIsStreaming(true);
      streamIntervalRef.current = setInterval(() => {
        sendFrame();
      }, 1000); // Send frame every second
      
    } catch (error) {
      addMessage(`Camera error: ${error}`);
    }
  };

  const stopStreaming = () => {
    if (streamIntervalRef.current) {
      clearInterval(streamIntervalRef.current);
      streamIntervalRef.current = null;
    }
    
    if (videoRef.current?.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      stream.getTracks().forEach(track => track.stop());
      videoRef.current.srcObject = null;
    }
    
    setIsStreaming(false);
    setDetections([]);
  };

  const sendFrame = () => {
    if (!canvasRef.current || !videoRef.current || !socketRef.current) return;
    
    const context = canvasRef.current.getContext('2d');
    if (!context) return;

    setIsProcessing(true);
    
    try {
      // Draw video frame to canvas without interrupting the video stream
      context.drawImage(videoRef.current, 0, 0, 640, 480);
      const dataURL = canvasRef.current.toDataURL('image/jpeg', 0.6);
      
      // Compare with previous frame if implemented
      // For now, always send the frame
      socketRef.current.send(JSON.stringify({
        type: 'frame',
        data: dataURL
      }));
    } catch (err) {
      console.error('Error capturing frame:', err);
      setIsProcessing(false);
    }
  };

  const addMessage = (message: string) => {
    setMessages(prev => [`[${new Date().toLocaleTimeString()}] ${message}`, ...prev.slice(0, 19)]);
  };

  const handleDetectionPress = (detection: any) => {
    setSelectedDetection(detection);
  };

  const closeSelectedDetection = () => {
    setSelectedDetection(null);
  };

  // Render camera permission UI if permission is not yet granted
  if (permissionState === 'prompt' || permissionState === 'denied') {
    return (
      <View style={styles.permissionContainer}>
        <View style={styles.topBar}>
          <TouchableOpacity 
            style={styles.topBarButton} 
            onPress={() => navigation?.goBack?.()}
          >
            <ChevronLeft size={24} color="white" />
          </TouchableOpacity>
        </View>
        
        <View style={styles.permissionContent}>
          <CameraIcon size={64} color={THEME_COLOR} style={{ marginBottom: 20 }} />
          <Text style={styles.permissionTitle}>
            {permissionState === 'prompt' ? 'Camera Access Required' : 'Camera Access Denied'}
          </Text>
          <Text style={styles.permissionText}>
            {permissionState === 'prompt' 
              ? 'This app needs access to your camera to detect objects.' 
              : 'Please enable camera access in your browser settings to use this feature.'}
          </Text>
          <TouchableOpacity 
            style={styles.permissionButton}
            onPress={requestCameraPermission}
          >
            <Text style={styles.permissionButtonText}>
              {permissionState === 'prompt' ? 'Enable Camera Access' : 'Try Again'}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
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
          >
            <Languages size={24} color="white" />
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.topBarButton}
            onPress={() => setShowDebug(!showDebug)}
          >
            <Settings size={24} color="white" />
          </TouchableOpacity>
        </View>
      </View>
      
      {/* Connection Status */}
      <View style={[
        styles.statusBar, 
        {backgroundColor: isConnected ? 'rgba(76, 217, 100, 0.8)' : 'rgba(255, 59, 48, 0.8)'}
      ]}>
        <Text style={styles.statusText}>
          {isConnected ? 'Connected' : 'Disconnected'}
        </Text>
      </View>

      {/* Video Container */}
      <View style={styles.videoContainer}>
        <View style={[
          styles.videoWrapper,
          Platform.OS === 'web' && { 
            boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
            overflow: 'hidden'
          }
        ]}>
          {/* Fixed using React Native's View as container and HTML video element handled properly */}
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
            }}
          />
          <canvas
            ref={canvasRef}
            width={640}
            height={480}
            style={{display: 'none'}}
          />
          
          {/* Render Detection Markers */}
          {detections.map((detection, index) => (
            <Marker
              key={index}
              position={{ x: detection.center[0], y: detection.center[1] }}
              isSelected={selectedDetection && selectedDetection === detection}
              label={detection.translated || detection.label}
              onPress={() => handleDetectionPress(detection)}
            />
          ))}
          
          {/* Processing indicator */}
          {isProcessing && (
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
            isStreaming && styles.stopButton,
            Platform.OS === 'web' && {
              boxShadow: isStreaming 
                ? '0 2px 8px rgba(255,59,48,0.4)' 
                : '0 2px 8px rgba(255,107,0,0.4)'
            }
          ]}
          onPress={() => {
            if (!isConnected && !isStreaming) {
              connectWebSocket();
            } else if (isConnected && !isStreaming) {
              startStreaming();
            } else {
              stopStreaming();
            }
          }}
        >
          <Text style={styles.detectionButtonText}>
            {!isConnected ? 'Connect' : !isStreaming ? 'Start Detection' : 'Stop Detection'}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Debug Messages */}
      {showDebug && (
        <View style={[
          styles.messages,
          Platform.OS === 'web' && { 
            boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
            overflow: 'scroll'
          }
        ]}>
          <Text style={styles.messagesHeader}>Debug Messages</Text>
          {messages.length > 0 ? (
            messages.map((msg, i) => (
              <Text key={i} style={[
                styles.message,
                Platform.OS === 'web' && { fontFamily: 'monospace' }
              ]}>
                {msg}
              </Text>
            ))
          ) : (
            <Text style={styles.noMessages}>No messages yet</Text>
          )}
        </View>
      )}

      {/* Selected Detection Details */}
      {selectedDetection && (
        <View style={[
          styles.detectionDetails,
          Platform.OS === 'web' && { boxShadow: '0 -2px 10px rgba(0,0,0,0.2)' }
        ]}>
          <View style={styles.detectionDetailsHeader}>
            <Text style={styles.detectionTitle}>{selectedDetection.label}</Text>
            <TouchableOpacity 
              style={styles.closeButton} 
              onPress={closeSelectedDetection}
            >
              <X size={24} color="#fff" />
            </TouchableOpacity>
          </View>
          
          <View style={styles.detectionContent}>
            <View style={styles.detectionItem}>
              <Text style={styles.detectionLabel}>Original:</Text>
              <Text style={styles.detectionText}>{selectedDetection.label}</Text>
            </View>
            <View style={styles.detectionItem}>
              <Text style={styles.detectionLabel}>Translation:</Text>
              <Text style={styles.detectionText}>{selectedDetection.translated || 'No translation'}</Text>
            </View>
            <View style={styles.detectionItem}>
              <Text style={styles.detectionLabel}>Confidence:</Text>
              <Text style={styles.detectionText}>{(selectedDetection.confidence * 100).toFixed(1)}%</Text>
            </View>
            
            <TouchableOpacity style={styles.saveButton} onPress={() => {
              addMessage(`Saved: ${selectedDetection.label}`);
              closeSelectedDetection();
            }}>
              <Save size={20} color="white" />
              <Text style={styles.saveButtonText}>Save Detection</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}
    </View>
  );
}

// Using StyleSheet.create for proper type checking
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f7', // Light gray background instead of black
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
    backgroundColor: '#333', // Darker top bar
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
  },
  stopButton: {
    backgroundColor: 'rgba(255, 59, 48, 0.9)',
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
  detectionDetails: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(51, 51, 51, 0.95)',
    padding: 20,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
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
    marginBottom: 20,
  },
  detectionItem: {
    flexDirection: 'row',
    marginBottom: 14,
  },
  detectionLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#aaa',
    width: 100,
  },
  detectionText: {
    fontSize: 16,
    color: '#fff',
    flex: 1,
  },
  saveButton: {
    flexDirection: 'row',
    backgroundColor: THEME_COLOR,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 8,
    marginTop: 20,
  },
  saveButtonText: {
    color: 'white',
    fontWeight: '600',
    fontSize: 16,
    marginLeft: 8,
  },
});
