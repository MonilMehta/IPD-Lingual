import React, { useState, useEffect } from 'react';
import { View, Text, Button, Image, StyleSheet, ScrollView } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import * as tf from '@tensorflow/tfjs';
import '@tensorflow/tfjs-react-native';
import { bundleResourceIO } from '@tensorflow/tfjs-react-native';

export default function TestModelScreen() {
  const [model, setModel] = useState<any>(null);
  const [imageUri, setImageUri] = useState<string | null>(null);
  const [predictions, setPredictions] = useState<any>(null);
  const [loading, setLoading] = useState<boolean>(false);

  // Load model on mount
  useEffect(() => {
    (async () => {
      await tf.ready();
      try {
        // Adjust paths if needed
        const modelJSON = require('../assets/yolo11n_web_model/model.json');
        const shard1 = require('../assets/yolo11n_web_model/shard1.bin');
        const shard2 = require('../assets/yolo11n_web_model/shard2.bin');
        const shard3 = require('../assets/yolo11n_web_model/shard3.bin');
        const loadedModel = await tf.loadLayersModel(
          bundleResourceIO(modelJSON, [shard1, shard2, shard3])
        );
        setModel(loadedModel);
        console.log('Test model loaded successfully');
      } catch (error) {
        console.error('Failed to load model:', error);
      }
    })();
  }, []);

  // Pick image from gallery
  const pickImage = async () => {
    const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permissionResult.granted) {
      alert("Permission to access gallery is required!");
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ImagePicker.MediaTypeOptions.Images });
    if (!result.cancelled) {
      setImageUri(result.uri);
      setPredictions(null);
    }
  };

  // Run detection on the selected image
  const detectImage = async () => {
    if (!imageUri || !model) return;
    setLoading(true);
    try {
      // Fetch the image data
      const response = await fetch(imageUri);
      const imageData = await response.arrayBuffer();
      // Decode image into tensor; tf.decodeJpeg is provided by tfjs-react-native
      const imageTensor = tf.decodeJpeg(new Uint8Array(imageData), 3);
      // Resize and add batch dimension as expected by the model; adjust size if needed!
      const resized = tf.image.resizeBilinear(imageTensor, [640, 640]).expandDims(0);
      // Run prediction
      const prediction = model.predict(resized);
      // For demo purposes, simply store the raw prediction result.
      setPredictions(prediction);
      tf.dispose([imageTensor, resized]);
    } catch (error) {
      console.error('Detection error:', error);
    }
    setLoading(false);
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.header}>Test Model Screen</Text>
      <Button title="Pick Image" onPress={pickImage} />
      {imageUri && (
        <>
          <Image source={{ uri: imageUri }} style={styles.image} />
          <Button title="Detect Objects" onPress={detectImage} disabled={loading} />
        </>
      )}
      {loading && <Text>Detecting...</Text>}
      {predictions && (
        <View style={styles.predictionContainer}>
          <Text>Prediction Result:</Text>
          <Text>{JSON.stringify(predictions, null, 2)}</Text>
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 16,
    alignItems: 'center',
  },
  header: {
    fontSize: 20,
    marginVertical: 16,
  },
  image: {
    width: 300,
    height: 300,
    marginVertical: 16,
  },
  predictionContainer: {
    marginTop: 16,
    padding: 8,
    backgroundColor: '#eee',
    width: '100%',
  },
});
