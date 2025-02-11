import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import * as tf from "@tensorflow/tfjs";
import "@tensorflow/tfjs-react-native";
import * as cocossd from "@tensorflow-models/coco-ssd";
import * as FileSystem from 'expo-file-system';
import { cameraWithTensors } from "@tensorflow/tfjs-react-native";

const TensorCamera = cameraWithTensors(CameraView);

export function Camera() {
  const [cameraFacing, setCameraFacing] = useState('back');
  const [permission, requestPermission] = useCameraPermissions();
  const [model, setModel] = useState(null);
  const [isModelLoaded, setIsModelLoaded] = useState(false);
  const [isTfLoaded, setIsTfLoaded] = useState(false);
  const [predictions, setPredictions] = useState([]);

  useEffect(() => {
    (async () => {
      if (!permission?.granted) {
        const { status } = await requestPermission();
        if (status !== 'granted') return;
      }
      try {
        await tf.ready();
        console.log("tf ready");
        setIsTfLoaded(true);
        const loadedCoco = await cocossd.load();
        console.log("coco loaded");
        setModel(loadedCoco);
        setIsModelLoaded(true);
      } catch (err) {
        console.log(`Error loading the model: ${err}`);
      }
    })();
  }, [permission, requestPermission]);

  const handleCameraStream = async (images, updatePreview, gl) => {
    const loop = async () => {
      if (!model) return;
      
      const nextImageTensor = images.next().value;
      if (!nextImageTensor) return;

      try {
        const predictions = await model.detect(nextImageTensor);
        setPredictions(predictions);

        if (predictions.length > 0) {
          try {
            const fileUri = `${FileSystem.documentDirectory}predictions.json`;
            await FileSystem.writeAsStringAsync(fileUri, JSON.stringify(predictions));
          } catch (error) {
            console.error('Error saving predictions:', error);
          }
        }
      } catch (error) {
        console.error('Error processing image:', error);
      } finally {
        tf.dispose([nextImageTensor]);
      }

      requestAnimationFrame(loop);
    };
    loop();
  };

  function toggleCameraFacing() {
    setCameraFacing(current => (current === 'back' ? 'front' : 'back'));
  }

  const displayBoxes = (predictions) => {
    if (!predictions?.length) return null;

    return predictions.map((prediction, index) => {
      if (prediction.score > 0.66) {
        return (
          <ObjectBox
            key={index}
            class={prediction.class}
            score={prediction.score}
            marginLeft={Math.round(prediction.bbox[0]) * 3}
            marginTop={Math.round(prediction.bbox[1]) * 3}
            width={Math.round(prediction.bbox[2]) * 3}
            height={Math.round(prediction.bbox[3]) * 3}
          />
        );
      }
      return null;
    });
  };

  if (!permission) {
    return (
      <View style={styles.container}>
        <Text>Requesting camera permission...</Text>
      </View>
    );
  }

  if (!permission.granted) {
    return (
      <View style={styles.container}>
        <Text>Camera permission is required</Text>
        <TouchableOpacity style={styles.button} onPress={requestPermission}>
          <Text style={styles.text}>Grant Permission</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.modelStatus}>
        <Text style={styles.modelStatusText}>
          {!isModelLoaded ? (isTfLoaded ? "Tf Loaded, " : "Loading Tf...") : ""}
          {isModelLoaded ? "Model ready!" : "Loading Model..."}
        </Text>
      </View>
      
      {isModelLoaded ? (
        <>
          <TensorCamera
            style={styles.camera}
            facing={cameraFacing}
            zoom={0.0005}
            cameraTextureHeight={1200}
            cameraTextureWidth={900}
            resizeHeight={200}
            resizeWidth={152}
            resizeDepth={3}
            onReady={handleCameraStream}
            autorender={true}
            useCustomShadersToResize={false}
          />
          <View style={styles.boxes}>{displayBoxes(predictions)}</View>
          <View style={styles.buttonContainer}>
            <TouchableOpacity style={styles.button} onPress={toggleCameraFacing}>
              <Text style={styles.text}>Flip Camera</Text>
            </TouchableOpacity>
          </View>
        </>
      ) : (
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Camera Loading...</Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
  },
  camera: {
    flex: 8,
  },
  modelStatus: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#fff",
  },
  modelStatusText: {
    fontSize: 16,
  },
  buttonContainer: {
    flex: 1,
    flexDirection: "row",
    backgroundColor: "transparent",
    margin: 64,
  },
  button: {
    flex: 1,
    alignSelf: "flex-end",
    alignItems: "center",
    backgroundColor: "#4CAF50",
    padding: 12,
    borderRadius: 8,
  },
  text: {
    fontSize: 14,
    fontWeight: "bold",
    color: "white",
  },
  boxes: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  loadingContainer: {
    flex: 8,
    justifyContent: "center",
    alignItems: "center"
  },
  loadingText: {
    fontSize: 30
  }
});