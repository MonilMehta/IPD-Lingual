import { Platform } from 'react-native';

// Configuration constants
export const WS_URL = 'wss://ee84-14-139-125-227.ngrok-free.app ';

export interface Detection {
  box: number[];
  label: string;
  translated?: string;
  confidence: number;
  center?: number[];
}

export interface CameraDimensions {
  width: number;
  height: number;
}

export interface WebSocketCallbacks {
  onOpen?: (ws: WebSocket) => void;
  onMessage?: (data: any) => void;
  onDetections?: (detections: Detection[]) => void;
  onError?: (error: any) => void;
  onClose?: (event: CloseEvent) => void;
  onStatusChange?: (status: 'connected' | 'connecting' | 'disconnected' | 'error') => void;
}

export function setupWebSocket(
  username: string,
  language: string,
  cameraDimensions: CameraDimensions,
  callbacks: WebSocketCallbacks,
  debugMode: boolean = false
): WebSocket {
  try {
    callbacks.onStatusChange?.('connecting');
    console.log(`Attempting to connect to: ${WS_URL}`);
      
    // Create new WebSocket connection
    const ws = new WebSocket(WS_URL);
      
    ws.onopen = () => {
      console.log('WebSocket connection established');
      callbacks.onStatusChange?.('connected');
      callbacks.onOpen?.(ws);
        
      // Send start message with username
      if (username) {
        const startMsg = JSON.stringify({
          type: 'start',
          username
        });
        console.log('Sending start message:', startMsg);
        ws.send(startMsg);
          
        // Set language preference
        ws.send(JSON.stringify({
          type: 'set_language',
          language
        }));
      } else {
        console.warn('No username available');
      }
    };
      
    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        callbacks.onMessage?.(data);
          
        if (data.type === 'detection' && Array.isArray(data.results)) {
          // Validate and filter invalid detections
          const validDetections = data.results.filter((det: Detection) => {
            return (
              Array.isArray(det.box) && 
              det.box.length === 4 &&
              !det.box.some((coord: number) => isNaN(coord)) &&
              det.box[2] > det.box[0] && 
              det.box[3] > det.box[1]
            );
          });
            
          // Convert server coordinates to center points for markers
          const adjustedDetections = validDetections.map((det: Detection) => {
            // Calculate scaling factor between server processing size and actual camera view
            const scaleX = cameraDimensions.width / 640;
            const scaleY = cameraDimensions.height / 480;
              
            // Calculate center point of detection
            const centerX = ((det.box[0] + det.box[2]) / 2) * scaleX;
            const centerY = ((det.box[1] + det.box[3]) / 2) * scaleY;
              
            return {
              ...det,
              center: [centerX, centerY]
            };
          });
            
          console.log('Received detections:', adjustedDetections.length);
          if (debugMode) {
            console.log('Detection details:', JSON.stringify(adjustedDetections));
          }
            
          callbacks.onDetections?.(adjustedDetections);
        }
      } catch (e: unknown) {
        const errorMessage = e instanceof Error ? e.message : 'Unknown error';
        console.error('Error parsing WebSocket message:', errorMessage);
      }
    };
      
    ws.onerror = (error) => {
      console.error('WebSocket error:', error);
      callbacks.onStatusChange?.('error');
      callbacks.onError?.(error);
    };
      
    ws.onclose = (event) => {
      console.log(`WebSocket connection closed with code ${event.code}, reason: ${event.reason}`);
      callbacks.onStatusChange?.('disconnected');
      callbacks.onClose?.(event);
    };

    return ws;
      
  } catch (error) {
    console.error('Error setting up WebSocket:', error);
    callbacks.onStatusChange?.('error');
    throw error;
  }
}

