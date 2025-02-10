import React, { useEffect, useState, useCallback } from 'react';
import { StyleSheet, View, Dimensions, Text, Platform } from 'react-native';
import { CustomTensorCamera } from '../src/CustomTensorCamera';
import { LoadingView } from '../src/LoadingView';
import { ObjectMarker } from '../screens/Camera/ObjectMarker';
import * as FileSystem from 'expo-file-system';
import { Asset } from 'expo-asset';
import * as tf from '@tensorflow/tfjs';
import { bundleResourceIO } from '@tensorflow/tfjs-react-native';

const SCREEN_WIDTH = Dimensions.get('window').width;
const SCREEN_HEIGHT = Dimensions.get('window').height;
const CAMERA_HEIGHT = SCREEN_HEIGHT * 0.85;

const translationMap: { [key: string]: string } = {
  person: 'persona',
  book: 'libro',
  chair: 'silla',
  window: 'ventana'
};

function getRandomPosition() {
  return {
    x: Math.random() * (SCREEN_WIDTH - 50),
    y: Math.random() * (CAMERA_HEIGHT - 50),
  };
}

export function ModelView() {
  // For web, show a message instead of running object detection
  if (Platform.OS === 'web') {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
        <Text>Object detection is available only on mobile devices.</Text>
      </View>
    );
  }

  const [model, setModel] = useState<any>(null);
  const [detectedObjects, setDetectedObjects] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadModel = async () => {
      try {
        console.log('Starting model download...');
        
        const modelJSON = require('../assets/yolo11n_web_model/model.json');
        const shard1 = require('../assets/yolo11n_web_model/shard1.bin');
        const shard2 = require('../assets/yolo11n_web_model/shard2.bin');
        const shard3 = require('../assets/yolo11n_web_model/shard3.bin');

        const loadedModel = await tf.loadLayersModel(
          bundleResourceIO(modelJSON, [shard1, shard2, shard3])
        );

        console.log('Model loaded successfully');
        setModel(loadedModel);
        setIsLoading(false);
      } catch (error) {
        console.error('Failed to load YOLO model:', error);
        if (error instanceof Error) {
          console.error('Error details:', error.message);
          console.error('Error stack:', error.stack);
        }
        setIsLoading(false);
      }
    };

    loadModel();
  }, []);

  const onReady = useCallback((images: IterableIterator<any>) => {
    const loop = async () => {
      const nextImageTensor = images.next().value;
      
      if (!nextImageTensor || !model) return;

      try {
        const predictions = model.predict(nextImageTensor);
        
        const objects = predictions.map((pred: any, index: number) => ({
          id: index.toString(),
          name: pred.class,
          translation: translationMap[pred.class] || pred.class,
          description: `Confidence: ${(pred.score * 100).toFixed(1)}%`,
          position: {
            x: pred.bbox[0] * SCREEN_WIDTH,
            y: pred.bbox[1] * CAMERA_HEIGHT
          }
        }));

        setDetectedObjects(objects);
      } catch (error) {
        console.error('Prediction error:', error);
      }

      requestAnimationFrame(loop);
    };

    loop();
  }, [model]);

  if (isLoading) {
    return <LoadingView />;
  }

  return (
    <View style={styles.container}>
      <CustomTensorCamera
        style={styles.camera}
        onReady={onReady}
      />
      {detectedObjects.map(obj => (
        <ObjectMarker
          key={obj.id}
          position={obj.position}
          name={obj.name}
          translation={obj.translation}
          description={obj.description}
        />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'black',
  },
  camera: {
    width: SCREEN_WIDTH,
    height: CAMERA_HEIGHT,
  },
});
