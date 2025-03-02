export interface Detection {
  box: [number, number, number, number];
  class: string;
  translated: string;
  confidence: number;
}

export interface WebSocketMessage {
  type: 'start' | 'frame' | 'detection' | 'set_language' | 'stop' | 'status' | 'error';
  data?: string;
  results?: Detection[];
  message?: string;
  language?: string;
  username?: string;
}

export type ConnectionStatus = 'connected' | 'connecting' | 'disconnected' | 'error';

export interface CameraScreenProps {
  navigation: any; // We'll keep this as any for now since it's from react-navigation
} 