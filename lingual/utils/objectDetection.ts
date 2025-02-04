import * as tf from '@tensorflow/tfjs';
import '@tensorflow/tfjs-react-native';
import * as FileSystem from 'expo-file-system';
import { bundleResourceIO, decodeJpeg } from '@tensorflow/tfjs-react-native';
import { DetectedObject } from './types';

// Import labels and translations from existing file

import { getTranslation } from '@/assets/models/labels';

const COCO_LABELS = [
  'person', 'bicycle', 'car', 'motorcycle', 'airplane', 'bus', 'train', 'truck', 
  'boat', 'traffic light', 'fire hydrant', 'stop sign', 'parking meter', 'bench',
  'bird', 'cat', 'dog', 'horse', 'sheep', 'cow', 'elephant', 'bear', 'zebra',
  'giraffe', 'backpack', 'umbrella', 'handbag', 'tie', 'suitcase', 'frisbee',
  'skis', 'snowboard', 'sports ball', 'kite', 'baseball bat', 'baseball glove',
  'skateboard', 'surfboard', 'tennis racket', 'bottle', 'wine glass', 'cup',
  'fork', 'knife', 'spoon', 'bowl', 'banana', 'apple', 'sandwich', 'orange',
  'broccoli', 'carrot', 'hot dog', 'pizza', 'donut', 'cake', 'chair', 'couch',
  'potted plant', 'bed', 'dining table', 'toilet', 'tv', 'laptop', 'mouse',
  'remote', 'keyboard', 'cell phone', 'microwave', 'oven', 'toaster', 'sink',
  'refrigerator', 'book', 'clock', 'vase', 'scissors', 'teddy bear', 'hair drier',
  'toothbrush'
];
export class ObjectDetector {
  private model?: tf.GraphModel;

  private async loadModel() {
    await tf.ready();
    return tf.loadGraphModel(bundleResourceIO(
      require('../assets/models/model.json'),
      [
        require('../assets/models/group1-shard1of4.bin'),
        require('../assets/models/group1-shard2of4.bin'),
        require('../assets/models/group1-shard3of4.bin'),
        require('../assets/models/group1-shard4of4.bin'),
      ]
    ));
  }

  async detect(uri: string): Promise<DetectedObject[]> {
    try {
      // Load model if needed
      if (!this.model) {
        this.model = await this.loadModel();
      }

      // Load and preprocess image
      const imgB64 = await FileSystem.readAsStringAsync(uri, { encoding: FileSystem.EncodingType.Base64 });
      const imgTensor = decodeJpeg(new Uint8Array(tf.util.encodeString(imgB64, 'base64').buffer));
      const processed = tf.image.resizeBilinear(imgTensor, [640, 640]).div(255).expandDims(0);

      // Run inference
      const output = this.model.execute(processed) as tf.Tensor;
      const [boxes, scores, classes] = await Promise.all([
        output.squeeze([0]).array() as Promise<number[][]>,
        output.max(1).array() as Promise<number[]>,
        output.argMax(1).array() as Promise<number[]>
      ]);

      tf.dispose([output, processed, imgTensor]);

      // Process results
      return boxes.map((box, i) => ({
        id: `${i}-${Date.now()}`,
        name: COCO_LABELS[classes[i]] || 'unknown',
        translation: getTranslation(COCO_LABELS[classes[i]]),
        confidence: scores[i],
        position: { x: box[0], y: box[1] },
        boundingBox: {
          x1: box[0] - box[2]/2,
          y1: box[1] - box[3]/2,
          x2: box[0] + box[2]/2,
          y2: box[1] + box[3]/2
        }
      })).filter(obj => obj.confidence > 0.5);
    } catch (error) {
      console.error('Detection error:', error);
      return [];
    }
  }
}