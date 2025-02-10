import React, { useState, useRef } from 'react';
import { 
  StyleSheet, 
  Text, 
  TouchableOpacity, 
  View, 
  Platform, 
  Dimensions,
  Animated,
  Image,
  StatusBar
} from 'react-native';
import { Camera, CameraType } from 'expo-camera/legacy';
import { 
  Upload, 
  Camera as CameraIcon, 
  X, 
  Save, 
  Info,
  ChevronLeft,
  Settings,
  Languages
} from 'lucide-react-native';

const SCREEN_WIDTH = Dimensions.get('window').width;
const SCREEN_HEIGHT = Dimensions.get('window').height;
const CAMERA_HEIGHT = Platform.OS === 'web' ? SCREEN_WIDTH * (3/4) : SCREEN_HEIGHT * 0.85;

// Test zones for object detection simulation
const TEST_ZONES = [
  {
    id: '1',
    name: 'Coffee Cup',
    translation: 'Taza de café',
    description: 'A ceramic cup used for hot beverages',
    position: { x: SCREEN_WIDTH * 0.3, y: CAMERA_HEIGHT * 0.3 },
  },
  {
    id: '2',
    name: 'Book',
    translation: 'Libro',
    description: 'A hardcover book on the table',
    position: { x: SCREEN_WIDTH * 0.7, y: CAMERA_HEIGHT * 0.4 },
  },
  {
    id: '3',
    name: 'Chair',
    translation: 'Silla',
    description: 'A wooden chair',
    position: { x: SCREEN_WIDTH * 0.5, y: CAMERA_HEIGHT * 0.6 },
  },
  {
    id: '4',
    name: 'Window',
    translation: 'Ventana',
    description: 'A large window with natural light',
    position: { x: SCREEN_WIDTH * 0.8, y: CAMERA_HEIGHT * 0.2 },
  }
];

interface DetectedObject {
  id: string;
  name: string;
  translation: string;
  description: string;
  position: { x: number; y: number };
}

export default function CameraScreen({ navigation }) {
  const [facing, setFacing] = useState(CameraType.back);
  const [permission, requestPermission] = Camera.useCameraPermissions();
  const [detectedObjects, setDetectedObjects] = useState<DetectedObject[]>(TEST_ZONES);
  const [selectedObject, setSelectedObject] = useState<DetectedObject | null>(null);
  const [imageUri, setImageUri] = useState<string | null>(null);
  const [showGrid, setShowGrid] = useState(true);
  
  const bottomSheetAnim = useRef(new Animated.Value(0)).current;

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
    setSelectedObject(null);
  };

  const handleFileUpload = async () => {
    if (Platform.OS === 'web') {
      const input = document.createElement('input');
      input.type = 'file';
      input.accept = 'image/*';
      input.onchange = async (e: any) => {
        const file = e.target.files[0];
        const reader = new FileReader();
        reader.onload = (event) => {
          setImageUri(event.target?.result as string);
          setDetectedObjects(TEST_ZONES);
        };
        reader.readAsDataURL(file);
      };
      input.click();
    }
  };

  const handleObjectPress = (object: DetectedObject) => {
    setSelectedObject(object);
    showBottomSheet();
  };

  const saveTranslation = () => {
    // Implement save functionality
    console.log('Saving translation:', selectedObject);
    hideBottomSheet();
  };

  if (!permission) {
    return <View />;
  }

  if (!permission.granted) {
    return (
      <View style={styles.container}>
        <Text style={styles.message}>We need your permission to show the camera</Text>
        <TouchableOpacity 
          style={styles.permissionButton} 
          onPress={requestPermission}
        >
          <Text style={styles.permissionButtonText}>Grant Permission</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const renderOverlay = () => (
    <View style={styles.overlay}>
      <View style={styles.topBar}>
        <TouchableOpacity 
          style={styles.topBarButton} 
          onPress={() => navigation.goBack()}
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
            onPress={() => navigation.navigate('Settings')}
          >
            <Settings size={24} color="white" />
          </TouchableOpacity>
        </View>
      </View>

      {showGrid && (
        <View style={styles.grid}>
          {detectedObjects.map((obj) => (
            <TouchableOpacity
              key={obj.id}
              style={[styles.marker, { left: obj.position.x, top: obj.position.y }]}
              onPress={() => handleObjectPress(obj)}
            >
              <View style={styles.markerDot} />
              <Text style={styles.markerText}>{obj.translation}</Text>
            </TouchableOpacity>
          ))}
        </View>
      )}
    </View>
  );

  const renderCamera = () => (
    <Camera 
      style={styles.camera} 
      type={facing}
    >
      {renderOverlay()}
    </Camera>
  );

  const renderImagePreview = () => (
    <View style={styles.imagePreviewContainer}>
      <Image source={{ uri: imageUri }} style={styles.imagePreview} />
      <TouchableOpacity 
        style={styles.closeButton}
        onPress={() => setImageUri(null)}
      >
        <X size={24} color="white" />
      </TouchableOpacity>
      {renderOverlay()}
    </View>
  );

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />
      <View style={styles.cameraContainer}>
        {imageUri ? renderImagePreview() : renderCamera()}
      </View>

      <View style={styles.controls}>
        <TouchableOpacity 
          style={styles.controlButton}
          onPress={() => setFacing(
            current => current === CameraType.back ? CameraType.front : CameraType.back
          )}
        >
          <CameraIcon size={24} color="white" />
          <Text style={styles.controlText}>Flip</Text>
        </TouchableOpacity>

        {Platform.OS === 'web' && (
          <TouchableOpacity 
            style={styles.controlButton}
            onPress={handleFileUpload}
          >
            <Upload size={24} color="white" />
            <Text style={styles.controlText}>Upload</Text>
          </TouchableOpacity>
        )}
      </View>

      <Animated.View 
        style={[
          styles.bottomSheet,
          {
            transform: [{
              translateY: bottomSheetAnim.interpolate({
                inputRange: [0, 1],
                outputRange: [300, 0],
              }),
            }],
          },
        ]}
      >
        {selectedObject && (
          <View style={styles.bottomSheetContent}>
            <View style={styles.bottomSheetHeader}>
              <Text style={styles.bottomSheetTitle}>{selectedObject.name}</Text>
              <TouchableOpacity onPress={hideBottomSheet}>
                <X size={24} color="#333" />
              </TouchableOpacity>
            </View>
            
            <View style={styles.translationContainer}>
              <Text style={styles.translationText}>{selectedObject.translation}</Text>
              <Text style={styles.descriptionText}>{selectedObject.description}</Text>
            </View>

            <View style={styles.bottomSheetActions}>
              <TouchableOpacity 
                style={styles.actionButton}
                onPress={() => saveTranslation()}
              >
                <Save size={20} color="#FF6B00" />
                <Text style={styles.actionButtonText}>Save</Text>
              </TouchableOpacity>

              <TouchableOpacity 
                style={styles.actionButton}
                onPress={() => {/* Handle more info */}}
              >
                <Info size={20} color="#FF6B00" />
                <Text style={styles.actionButtonText}>More Info</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  cameraContainer: {
    width: SCREEN_WIDTH,
    height: CAMERA_HEIGHT,
    overflow: 'hidden',
    backgroundColor: '#000',
  },
  camera: {
    width: '100%',
    height: '100%',
  },
  imagePreviewContainer: {
    width: '100%',
    height: '100%',
    position: 'relative',
  },
  imagePreview: {
    width: '100%',
    height: '100%',
    resizeMode: 'contain',
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.2)',
  },
  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    paddingTop: Platform.OS === 'ios' ? 50 : 20,
  },
  topBarButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 8,
  },
  topBarRight: {
    flexDirection: 'row',
  },
  grid: {
    flex: 1,
    position: 'relative',
  },
  controls: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#000',
  },
  controlButton: {
    alignItems: 'center',
    marginHorizontal: 20,
  },
  controlText: {
    color: 'white',
    marginTop: 8,
    fontSize: 12,
  },
  marker: {
    position: 'absolute',
    alignItems: 'center',
  },
  markerDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#FF6B00',
    borderWidth: 2,
    borderColor: 'white',
  },
  markerText: {
    color: 'white',
    backgroundColor: 'rgba(0,0,0,0.7)',
    padding: 4,
    borderRadius: 4,
    fontSize: 12,
    marginTop: 4,
  },
  bottomSheet: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'white',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: -2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  bottomSheetContent: {
    minHeight: 200,
  },
  bottomSheetHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  bottomSheetTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
  },
  translationContainer: {
    marginBottom: 20,
  },
  translationText: {
    fontSize: 20,
    color: '#FF6B00',
    marginBottom: 8,
  },
  descriptionText: {
    fontSize: 16,
    color: '#666',
    lineHeight: 24,
  },
  bottomSheetActions: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: 20,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 8,
    backgroundColor: '#F8F9FA',
  },
  actionButtonText: {
    marginLeft: 8,
    color: '#FF6B00',
    fontWeight: '600',
  },
  message: {
    color: 'white',
    textAlign: 'center',
    marginBottom: 20,
  },
  permissionButton: {
    backgroundColor: '#FF6B00',
    padding: 12,
    borderRadius: 8,
  },
  permissionButtonText: {
    color: 'white',
    textAlign: 'center',
    fontWeight: '600',
  },
  closeButton: {
    position: 'absolute',
    top: 20,
    right: 20,
    backgroundColor: 'rgba(0,0,0,0.5)',
    padding: 8,
    borderRadius: 20,
  },
});