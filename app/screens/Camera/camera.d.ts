declare module 'expo-camera' {
  import { ViewProps } from 'react-native';
  import React from 'react';

  export type CameraType = 'front' | 'back';

  export interface CameraProps extends ViewProps {
    type: CameraType;
    ratio?: string;
    ref?: React.RefObject<any>;
  }

  export class Camera extends React.Component<CameraProps> {
    static Constants: {
      Type: {
        back: number;
        front: number;
      };
    };

    static requestCameraPermissionsAsync(): Promise<{ status: string }>;
    static requestMicrophonePermissionsAsync(): Promise<{ status: string }>;
    takePictureAsync(options?: { quality?: number; base64?: boolean }): Promise<{ uri: string; base64?: string }>;
    getSupportedRatiosAsync(): Promise<string[]>;
  }
} 