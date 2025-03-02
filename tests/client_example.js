// Example React Native code for the frontend

import React, { useState, useEffect, useRef } from 'react';
import { StyleSheet, Text, View, TouchableOpacity, ActivityIndicator } from 'react-native';
import { Camera } from 'expo-camera';
import { manipulateAsync, SaveFormat } from 'expo-image-manipulator';
import * as SecureStore from 'expo-secure-store';

const API_URL = 'http://your-backend-ip:5000';
let webSocket = null;

export default function CameraScreen() {
  const [hasPermission, setHasPermission] = useState(null);
  const [isConnected, setIsConnected] = useState(false);
  const [detections, setDetections] = useState([]);
  const [language, setLanguage] = useState('en');
  const [isProcessing, setIsProcessing] = useState(false);
  const cameraRef = useRef(null);
  const frameInterval = useRef(null);

  useEffect(() => {
    (async () => {
      // Ask for camera permission
      const { status } = await Camera.requestCameraPermissionsAsync();
      setHasPermission(status === 'granted');
      
      // Get user's preferred language
      const token = await SecureStore.getItemAsync('userToken');
      if (token) {
        try {
          const response = await fetch(`${API_URL}/current_language`, {
            headers: { 'Authorization': `Bearer ${token}` }
          });
          const data = await response.json();
          setLanguage(data.language_code);
        } catch (err) {
          console.error('Error fetching language preference:', err);
        }
      }
      
      // Get WebSocket URL
      if (token) {
        try {
          const response = await fetch(`${API_URL}/get_websocket_url`, {
            headers: { 'Authorization': `Bearer ${token}` }
          });
          const data = await response.json();
          setupWebSocket(data.websocket_url);
        } catch (err) {
          console.error('Error getting WebSocket URL:', err);
        }
      }
    })();
    
    return () => {
      // Cleanup
      if (webSocket) {
        webSocket.close();
      }
      if (frameInterval.current) {
        clearInterval(frameInterval.current);
      }
    };
  }, []);

  const setupWebSocket = (url) => {
    webSocket = new WebSocket(url);
    
    webSocket.onopen = () => {
      console.log('WebSocket connection established');
      setIsConnected(true);
      
      // Start detection
      webSocket.send(JSON.stringify({
        type: 'start',
        username: getUsernameFromToken()  // Implement this function to extract username
      }));
    };
    
    webSocket.onmessage = (event) => {
      const data = JSON.parse(event.data);
      
      if (data.type === 'detection') {
        setDetections(data.results);
        setIsProcessing(false);
      }
    };
    
    webSocket.onerror = (error) => {
      console.error('WebSocket error:', error);
      setIsConnected(false);
    };
    
    webSocket.onclose = () => {
      console.log('WebSocket connection closed');
      setIsConnected(false);
    };
  };
  
  const startContinuousDetection = async () => {
    if (!isConnected || !cameraRef.current) return;
    
    frameInterval.current = setInterval(async () => {
      if (isProcessing) return;
      
      try {
        setIsProcessing(true);
        const photo = await cameraRef.current.takePictureAsync({
          quality: 0.5,
          base64: true,
        });
        
        // Resize image to reduce bandwidth
        const resized = await manipulateAsync(
          photo.uri,
          [{ resize: { width: 640 } }],
          { compress: 0.7, format: SaveFormat.JPEG, base64: true }
        );
        
        // Send frame for processing
        if (webSocket && webSocket.readyState === WebSocket.OPEN) {
          webSocket.send(JSON.stringify({
            type: 'frame',
            data: `data:image/jpeg;base64,${resized.base64}`
          }));
        }
      } catch (err) {
        console.error('Error capturing frame:', err);
        setIsProcessing(false);
      }
    }, 500);  // Process 2 frames per second
  };
  
  const stopContinuousDetection = () => {
    if (frameInterval.current) {
      clearInterval(frameInterval.current);
      frameInterval.current = null;
      
      if (webSocket && webSocket.readyState === WebSocket.OPEN) {
        webSocket.send(JSON.stringify({
          type: 'stop'
        }));
      }
    }
  };

  if (hasPermission === null) {
    return <View style={styles.container}><Text>Requesting camera permission...</Text></View>;
  }
  if (hasPermission === false) {
    return <View style={styles.container}><Text>No access to camera</Text></View>;
  }

  return (
    <View style={styles.container}>
      <Camera 
        style={styles.camera} 
        ref={cameraRef}
        type={Camera.Constants.Type.back}
      >
        <View style={styles.buttonContainer}>
          {!frameInterval.current ? (
            <TouchableOpacity
              style={styles.button}
              onPress={startContinuousDetection}>
              <Text style={styles.text}>Start Detection</Text>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity
              style={[styles.button, styles.stopButton]}
              onPress={stopContinuousDetection}>
              <Text style={styles.text}>Stop Detection</Text>
            </TouchableOpacity>
          )}
        </View>
        
        {isProcessing && (
          <ActivityIndicator 
            style={styles.loadingIndicator} 
            size="large" 
            color="#ffffff" 
          />
        )}
        
        {/* Render detection boxes and translations */}
        {detections.map((detection, index) => (
          <View
            key={index}
            style={[
              styles.detectionBox,
              {
                left: detection.box[0],
                top: detection.box[1],
                width: detection.box[2] - detection.box[0],
                height: detection.box[3] - detection.box[1],
              },
            ]}>
            <Text style={styles.detectionLabel}>
              {detection.translated} ({Math.round(detection.confidence * 100)}%)
            </Text>
          </View>
        ))}
      </Camera>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  camera: {
    flex: 1,
  },
  buttonContainer: {
    position: 'absolute',
    bottom: 20,
    width: '100%',
    alignItems: 'center',
  },
  button: {
    backgroundColor: 'rgba(0, 120, 255, 0.7)',
    padding: 15,
    borderRadius: 10,
  },
  stopButton: {
    backgroundColor: 'rgba(255, 0, 0, 0.7)',
  },
  text: {
    color: 'white',
    fontSize: 18,
  },
  detectionBox: {
    position: 'absolute',
    borderWidth: 2,
    borderColor: '#00FF00',
    backgroundColor: 'transparent',
  },
  detectionLabel: {
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    color: '#FFFFFF',
    fontSize: 12,
    padding: 2,
    position: 'absolute',
    top: -20,
  },
  loadingIndicator: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    marginLeft: -25,
    marginTop: -25,
  }
});
