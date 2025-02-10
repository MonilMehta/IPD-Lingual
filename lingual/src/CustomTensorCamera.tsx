import React, { useState, useEffect } from "react";
import { StyleSheet, View, Text } from "react-native";
import { Camera } from "expo-camera";
import { cameraWithTensors } from "@tensorflow/tfjs-react-native";
import * as tf from '@tensorflow/tfjs';
import { bundleResourceIO } from '@tensorflow/tfjs-react-native';

const TEXTURE_SIZE = { width: 1080, height: 1920 };
const TENSOR_WIDTH = 152;
const CAMERA_RATIO = TEXTURE_SIZE.height / TEXTURE_SIZE.width;
const TENSOR_SIZE = {
  width: TENSOR_WIDTH,
  height: TENSOR_WIDTH * CAMERA_RATIO,
};

const YOLO_MODEL_PATH = '../assets/yolo11n_web_model/model.json';
const YOLO_MODEL_WEIGHTS = [
  '../assets/yolo11n_web_model/shard1.bin',
  '../assets/yolo11n_web_model/shard2.bin',
  '../assets/yolo11n_web_model/shard3.bin'
];

export function CustomTensorCamera({ style, width = TEXTURE_SIZE.width, ...props }: { style?: any, width?: number, [key: string]: any }) {
  const [model, setModel] = useState<tf.GraphModel | null>(null);
  const [detectedObjects, setDetectedObjects] = useState<any[]>([]);
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);

  useEffect(() => {
    (async () => {
      const { status } = await Camera.requestPermissionsAsync();
      setHasPermission(status === 'granted');
    })();
  }, []);

  useEffect(() => {
    const loadModel = async () => {
      try {
        await tf.ready();
        const model = await tf.loadGraphModel(bundleResourceIO(YOLO_MODEL_PATH, YOLO_MODEL_WEIGHTS));
        setModel(model);
        console.log('YOLO model loaded successfully');
      } catch (error) {
        console.error('Failed to load YOLO model:', error);
      }
    };

    loadModel();
  }, []);

  const handleInference = async (images: any) => {
    if (model) {
      const loop = async () => {
        const nextImageTensor = images.next().value;
        if (nextImageTensor) {
          const predictions = await model.executeAsync(nextImageTensor) as tf.Tensor[];
          setDetectedObjects(predictions);
          tf.dispose(nextImageTensor);
        }
        requestAnimationFrame(loop);
      };
      loop();
    }
  };

  if (hasPermission === null) {
    return <Text>Requesting for camera permission</Text>;
  }
  if (hasPermission === false) {
    return <Text>No access to camera</Text>;
  }

  const TensorCamera = cameraWithTensors(Camera);

  return (
    <View style={styles.container}>
      <TensorCamera
        {...props}
        style={[style, styles.camera]}
        type={Camera.Constants.Type.back}
        cameraTextureWidth={TEXTURE_SIZE.width}
        cameraTextureHeight={TEXTURE_SIZE.height}
        resizeWidth={TENSOR_SIZE.width}
        resizeHeight={TENSOR_SIZE.height}
        resizeDepth={3}
        useCustomShadersToResize={false}
        autorender={true}
        onReady={handleInference}
      />
      {detectedObjects.map((obj, index) => (
        <View key={index} style={[styles.boundingBox, { left: obj.bbox[0], top: obj.bbox[1], width: obj.bbox[2], height: obj.bbox[3] }]}>
          <Text style={styles.label}>{obj.class}</Text>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    position: 'relative',
  },
  camera: {
    flex: 1,
  },
  boundingBox: {
    position: 'absolute',
    borderWidth: 2,
    borderColor: 'red',
    zIndex: 1,
  },
  label: {
    color: 'red',
    backgroundColor: 'white',
    padding: 2,
  },
});