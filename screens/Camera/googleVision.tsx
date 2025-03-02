import React, { useState, useEffect, useRef, useCallback } from 'react';
import { View, Text, TouchableOpacity, ActivityIndicator, StyleSheet, Image, Alert } from 'react-native';
import { CameraView, CameraType, Camera } from 'expo-camera';
import { manipulateAsync, SaveFormat } from 'expo-image-manipulator';
import { Base64 } from 'js-base64';
import { Marker } from './marker';

// Note: You would need to set up your Google Cloud Vision API key
// The key below is a placeholder and won't work - replace with your actual key
const VISION_API_KEY = 'YOUR_GOOGLE_CLOUD_VISION_API_KEY';

interface DetectionResult {
  name: string;
  score: number;
  boundingPoly?: {
    vertices: Array<{x: number, y: number}>;
  };
}

export default function GoogleVisionCamera() {
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [cameraReady, setCameraReady] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [detections, setDetections] = useState<DetectionResult[]>([]);
  const [cameraFacing, setCameraFacing] = useState<CameraType>('back');
  const [imageUri, setImageUri] = useState<string | null>(null);
  const [screenDimensions, setScreenDimensions] = useState({ width: 0, height: 0 });
  const [selectedObject, setSelectedObject] = useState<number | null>(null);
  const [translations, setTranslations] = useState<Record<string, string>>({});
  const [targetLanguage, setTargetLanguage] = useState('en');

  const cameraRef = useRef<CameraView>(null);
  const isComponentMounted = useRef(true);

  const languages = [
    { code: 'en', name: 'English' },
    { code: 'es', name: 'Spanish' },
    { code: 'fr', name: 'French' },
    { code: 'de', name: 'German' },
    { code: 'zh-CN', name: 'Chinese' },
    { code: 'ja', name: 'Japanese' },
    { code: 'ko', name: 'Korean' },
    { code: 'ru', name: 'Russian' }
  ];

  useEffect(() => {
    (async () => {
      const { status } = await Camera.requestCameraPermissionsAsync();
      setHasPermission(status === 'granted');
    })();

    return () => {
      isComponentMounted.current = false;
    };
  }, []);

  const onCameraViewLayout = (event: any) => {
    const { width, height } = event.nativeEvent.layout;
    setScreenDimensions({ width, height });
  };

  const captureAndDetect = async () => {
    if (isProcessing || !cameraReady) return;
    
    setIsProcessing(true);
    try {
      if (!cameraRef.current) return;

      // Take picture
      const photo = await cameraRef.current.takePictureAsync({
        quality: 0.8,
        base64: true,
      });

      setImageUri(photo.uri);

      // Resize image for faster upload
      const manipResult = await manipulateAsync(
        photo.uri,
        [{ resize: { width: 800, height: 600 } }],
        { format: SaveFormat.JPEG, base64: true }
      );

      if (!manipResult?.base64) return;

      // Call Google Cloud Vision API
      const results = await detectObjects(manipResult.base64);
      
      if (results && results.length > 0) {
        // Scale detection coordinates
        const scaledResults = results.map(detection => {
          if (!detection.boundingPoly?.vertices) {
            // If no bounding box, set a default centered box
            const defaultWidth = screenDimensions.width * 0.5;
            const defaultHeight = screenDimensions.height * 0.3;
            const x = (screenDimensions.width - defaultWidth) / 2;
            const y = (screenDimensions.height - defaultHeight) / 2;
            
            detection.boundingPoly = {
              vertices: [
                { x, y },
                { x: x + defaultWidth, y },
                { x: x + defaultWidth, y: y + defaultHeight },
                { x, y: y + defaultHeight }
              ]
            };
          } else {
            // Scale the bounding box
            const scaleX = screenDimensions.width / manipResult.width;
            const scaleY = screenDimensions.height / manipResult.height;
            
            detection.boundingPoly.vertices = detection.boundingPoly.vertices.map(vertex => ({
              x: vertex.x * scaleX,
              y: vertex.y * scaleY
            }));
          }
          return detection;
        });
        
        setDetections(scaledResults);
        
        // Fetch translations for detected objects
        const newTranslations = { ...translations };
        for (const detection of scaledResults) {
          if (!newTranslations[detection.name]) {
            const translation = await fetchTranslation(detection.name);
            if (translation) {
              newTranslations[detection.name] = translation;
            }
          }
        }
        setTranslations(newTranslations);
      }
    } catch (error) {
      console.error('Error detecting objects:', error);
      Alert.alert('Error', 'Failed to detect objects. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  const detectObjects = async (base64Image: string): Promise<DetectionResult[]> => {
    try {
      // Format the request for Google Cloud Vision API
      const body = JSON.stringify({
        requests: [
          {
            features: [
              { type: 'OBJECT_LOCALIZATION', maxResults: 5 },
              { type: 'LABEL_DETECTION', maxResults: 5 }
            ],
            image: {
              content: base64Image
            }
          }
        ]
      });

      // Make the API request
      const response = await fetch(
        `https://vision.googleapis.com/v1/images:annotate?key=${VISION_API_KEY}`,
        {
          method: 'POST',
          headers: {
            Accept: 'application/json',
            'Content-Type': 'application/json'
          },
          body
        }
      );

      const data = await response.json();
      
      if (data.error) {
        console.error('Google Vision API error:', data.error);
        return [];
      }

      // Parse object detection results
      const objects = data.responses[0]?.localizedObjectAnnotations || [];
      
      // If no objects with bounding boxes were found, use labels
      if (objects.length === 0) {
        const labels = data.responses[0]?.labelAnnotations || [];
        return labels.map(label => ({
          name: label.description,
          score: label.score
          // No boundingPoly for labels
        }));
      }
      
      return objects.map(obj => ({
        name: obj.name,
        score: obj.score,
        boundingPoly: obj.boundingPoly
      }));
    } catch (error) {
      console.error('Error calling Google Vision API:', error);
      return [];
    }
  };

  const fetchTranslation = async (text: string): Promise<string | null> => {
    try {
      const encodedText = encodeURIComponent(text);
      const response = await fetch(
        `https://translate.googleapis.com/translate_a/single?client=gtx&sl=auto&tl=${targetLanguage}&dt=t&q=${encodedText}`
      );
      const data = await response.json();
      if (data && data[0] && data[0][0]) {
        return data[0][0][0];
      }
      return null;
    } catch (error) {
      console.error('Translation error:', error);
      return null;
    }
  };

  const handleMarkerPress = (index: number) => {
    setSelectedObject(selectedObject === index ? null : index);
  };

  const renderMarkers = () => {
    return detections.map((detection, index) => {
      if (!detection.boundingPoly?.vertices || detection.boundingPoly.vertices.length < 1) {
        return null;
      }
      
      const translatedLabel = translations[detection.name] || detection.name;
      const label = `${detection.name}${translatedLabel !== detection.name ? ` (${translatedLabel})` : ''}`;
      
      // Use the first vertex as the marker position
      const position = {
        x: detection.boundingPoly.vertices[0].x,
        y: detection.boundingPoly.vertices[0].y
      };
      
      return (
        <Marker
          key={index}
          position={position}
          isSelected={selectedObject === index}
          label={label}
          onPress={() => handleMarkerPress(index)}
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
      <View 
        style={styles.cameraView}
        onLayout={onCameraViewLayout}
      >
        <CameraView
          ref={cameraRef}
          style={styles.camera}
          facing={cameraFacing}
          onCameraReady={() => setCameraReady(true)}
        >
          <View style={styles.markersOverlay}>
            {renderMarkers()}
          </View>
        </CameraView>
        
        <View style={styles.controlsContainer}>
          <View style={styles.buttonRow}>
            <TouchableOpacity 
              style={styles.button} 
              onPress={() => {
                setCameraFacing(current => current === 'back' ? 'front' : 'back');
                setDetections([]);
              }}
            >
              <Text style={styles.buttonText}>Flip Camera</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={[styles.button, styles.captureButton]} 
              onPress={captureAndDetect}
              disabled={isProcessing || !cameraReady}
            >
              <Text style={styles.buttonText}>
                {isProcessing ? 'Detecting...' : 'Detect Objects'}
              </Text>
            </TouchableOpacity>
          </View>
          
          <View style={styles.languageSelector}>
            <Text style={styles.languageLabel}>Target Language:</Text>
            <View style={styles.languageButtons}>
              {languages.map(lang => (
                <TouchableOpacity
                  key={lang.code}
                  style={[
                    styles.langButton,
                    targetLanguage === lang.code && styles.selectedLangButton
                  ]}
                  onPress={() => {
                    setTargetLanguage(lang.code);
                    setTranslations({}); // Clear translations when language changes
                  }}
                >
                  <Text 
                    style={[
                      styles.langButtonText,
                      targetLanguage === lang.code && styles.selectedLangButtonText
                    ]}
                  >
                    {lang.name}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </View>
      </View>
      
      {isProcessing && (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator size="large" color="#ffffff" />
          <Text style={styles.loadingText}>Detecting objects...</Text>
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
  controlsContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    padding: 10,
    zIndex: 2,
  },
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 10,
  },
  button: {
    backgroundColor: 'rgba(255, 255, 255, 0.7)',
    padding: 15,
    borderRadius: 10,
    flex: 1,
    marginHorizontal: 5,
    alignItems: 'center',
  },
  captureButton: {
    backgroundColor: 'rgba(0, 120, 255, 0.7)',
  },
  buttonText: {
    fontSize: 16,
    color: '#000',
    fontWeight: 'bold',
  },
  languageSelector: {
    marginTop: 10,
  },
  languageLabel: {
    color: '#fff',
    fontSize: 16,
    marginBottom: 5,
    textAlign: 'center',
  },
  languageButtons: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
  },
  langButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 20,
    margin: 5,
  },
  selectedLangButton: {
    backgroundColor: '#fff',
  },
  langButtonText: {
    color: '#ddd',
    fontSize: 14,
  },
  selectedLangButtonText: {
    color: '#000',
    fontWeight: 'bold',
  },
  text: {
    color: '#fff',
    fontSize: 16,
    textAlign: 'center',
  },
  loadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    color: '#fff',
    marginTop: 10,
    fontSize: 16,
  },
}); 