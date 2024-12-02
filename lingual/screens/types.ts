export interface DetectedObject {
    id: string;
    name: string;
    translation: string;
    description: string;
    position: {
      x: number;
      y: number;
    };
    phrases?: string[];
  }