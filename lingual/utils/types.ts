export interface DetectedObject {
  id: string;
  name: string;
  translation: string;
  description: string;
  position: { x: number; y: number };
  confidence: number;
  boundingBox?: {
    x1: number;
    y1: number;
    x2: number;
    y2: number;
  };
}