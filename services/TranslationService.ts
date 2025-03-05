// import { WebSocket } from 'ws';

interface LanguageInfo {
  name: string;
  code: string;
}

interface SupportedLanguages {
  [key: string]: LanguageInfo;
}

interface InitResponse {
  type: string;
  message: string;
  status: string;
  supportedLanguages: SupportedLanguages;
  currentSettings: {
    language1: string | null;
    language2: string | null;
  };
  supportedFormats: string[];
  maxAudioSize: string;
}

interface LanguageSettings {
  language1: string | null;
  language2: string | null;
}

interface TranslationResponse {
  type: string;
  person: string;
  original: {
    text: string;
    language: string;
  };
  translated: {
    text: string;
    language: string;
  };
  audio: string;
  languageSettings: LanguageSettings;
}

interface ConfigResponse {
  type: string;
  status: string;
  message: string;
  languageSettings: LanguageSettings;
}

interface WebSocketMessage {
  data: string | Blob;
}

class TranslationService {
  private static ws: WebSocket | null = null;
  private static isConnected: boolean = false;
  private static messageQueue: { audio: string; format: string }[] = [];
  private static onMessageCallback: ((response: TranslationResponse) => void) | null = null;
  private static onConfigCallback: ((config: ConfigResponse) => void) | null = null;
  private static onInitCallback: ((init: InitResponse) => void) | null = null;
  private static supportedLanguages: SupportedLanguages = {};
  private static supportedFormats: string[] = ['aac'];
  private static maxAudioSize: string = '20MB';
  private static languageSettings: LanguageSettings = {
    language1: null,
    language2: null
  };
  

  static connect() {
    if (this.ws) return;

    this.ws = new WebSocket('wss://3800-49-36-113-134.ngrok-free.app');
    
    // Don't disconnect WebSocket when stopping recording
    let isClosingIntentionally = false;

    this.ws.onopen = () => {
      console.log('🔗 WebSocket connected to translation service');
      this.isConnected = true;
      
      // If we have languages set, send them immediately
      if (this.languageSettings.language1 && this.languageSettings.language2) {
        console.log('🔄 Restoring language settings...');
        this.setLanguages(
          this.languageSettings.language1,
          this.languageSettings.language2
        ).catch(error => {
          console.error('❌ Failed to restore language settings:', error);
        });
      }
      
      this.processQueue();
    };

    this.ws.onclose = () => {
      if (!isClosingIntentionally) {
        console.log('WebSocket disconnected unexpectedly, attempting to reconnect...');
        this.isConnected = false;
        this.ws = null;
        // Attempt to reconnect after 5 seconds
        setTimeout(() => this.connect(), 5000);
      } else {
        console.log('WebSocket closed intentionally');
        this.isConnected = false;
        this.ws = null;
      }
    };

    this.ws.onerror = (error) => {
      console.error('WebSocket error:', error);
    };

    this.ws.onmessage = (event: WebSocketMessage) => {
      try {
        const response = JSON.parse(event.data as string);
        console.log('📥 Received message:', response.type);
        
        switch (response.type) {
          case 'init':
            console.log('🌍 Received initialization with supported languages');
            this.supportedLanguages = response.supportedLanguages;
            this.supportedFormats = response.supportedFormats;
            this.maxAudioSize = response.maxAudioSize;
            if (this.onInitCallback) {
              this.onInitCallback(response);
            }
            break;
          case 'translation':
          case 'message':
            console.log(`🗣️ Language detected: ${response.original.language}`);
            if (response.translated) {
              console.log(`🔄 Translated to: ${response.translated.language}`);
            }
            if (response.languageSettings) {
              this.languageSettings = response.languageSettings;
            }
            if (this.onMessageCallback) {
              this.onMessageCallback(response);
            }
            break;
          case 'config':
            console.log('⚙️ Received configuration update');
            if (response.languageSettings) {
              this.languageSettings = response.languageSettings;
            }
            if (this.onConfigCallback) {
              this.onConfigCallback(response);
            }
            break;
          case 'error':
            console.error('❌ Server error:', response.message);
            break;
        }
      } catch (error) {
        console.error('Error parsing WebSocket message:', error);
      }
    };
  }

  static setLanguages(language1: string, language2: string): Promise<void> {
    return new Promise((resolve, reject) => {
      if (!this.isConnected || !this.ws) {
        console.log('🔄 WebSocket not connected, connecting first...');
        this.connect();
        reject(new Error('WebSocket not connected'));
        return;
      }

      try {
        // Format as specified in the API
        const message = {
          setLanguages: {
            language1,
            language2
          }
        };

        console.log('📤 Setting languages:', message);
        this.ws.send(JSON.stringify(message));
        resolve();
      } catch (error) {
        reject(error);
      }
    });
  }

  static async sendAudioData(audioUri: string): Promise<void> {
    try {
      console.log('📱 Starting to process audio file from URI:', audioUri);
      
      if (!this.isConnected) {
        console.warn('❌ WebSocket not connected, audio data discarded');
        return;
      }

      if (!this.ws) {
        console.warn('❌ WebSocket instance is null');
        console.log('🔄 Attempting to reconnect...');
        this.connect();
        return;
      }

      if (!this.languageSettings?.language1 || !this.languageSettings?.language2) {
        console.error('❌ Languages must be set before processing audio');
        throw new Error('Languages must be set before processing audio');
      }

      // Read the file as base64
      const response = await fetch(audioUri);
      const blob = await response.blob();
      const reader = new FileReader();
      
      reader.onload = () => {
        const base64Audio = (reader.result as string).split(',')[1];
        
        console.log('�� Audio data size:', Math.round(base64Audio.length / 1024), 'KB');
        console.log('🎵 Audio format: AAC');
        console.log('📤 Sending audio for translation...');

        const message = {
          audio: base64Audio,
          format: 'aac'
        };
        
        this.ws?.send(JSON.stringify(message));
        console.log('✅ Audio data sent successfully');
      };
      
      reader.readAsDataURL(blob);
    } catch (error) {
      console.error('❌ Error sending audio data:', error);
      throw error;
    }
  }

  static async processConversationAudio(audioUri: string): Promise<void> {
    await this.sendAudioData(audioUri);
  }

  static onInit(callback: (init: InitResponse) => void) {
    this.onInitCallback = callback;
    // If we already have supported languages, call the callback immediately
    if (Object.keys(this.supportedLanguages).length > 0) {
      callback({
        type: 'init',
        message: 'Connected to Speech Translation Service',
        status: 'ready',
        supportedLanguages: this.supportedLanguages,
        currentSettings: this.languageSettings || { language1: null, language2: null },
        supportedFormats: this.supportedFormats,
        maxAudioSize: this.maxAudioSize
      });
    }
  }

  static onTranslation(callback: (response: TranslationResponse) => void) {
    this.onMessageCallback = (response) => {
      if (response.person) {
        console.log(`🗣️ Person detected: ${response.person}`);
      }
      callback(response);
    };
  }

  static onConfig(callback: (config: ConfigResponse) => void) {
    this.onConfigCallback = callback;
  }

  static getSupportedLanguages(): SupportedLanguages {
    return this.supportedLanguages;
  }

  static getLanguageSettings(): LanguageSettings {
    return this.languageSettings;
  }

  static disconnect() {
    if (this.ws) {
      const isClosingIntentionally = true;
      this.ws.close();
      this.ws = null;
      this.isConnected = false;
      console.log('WebSocket disconnected intentionally');
    }
  }

  private static processQueue() {
    while (this.messageQueue.length > 0 && this.isConnected) {
      const message = this.messageQueue.shift();
      if (message) {
        this.ws?.send(JSON.stringify(message));
      }
    }
  }

  /**
   * Check if the service is currently connected
   * @returns boolean indicating if the WebSocket is connected
   */
  static getConnectionStatus(): boolean {
    return TranslationService.isConnected;
  }
}

export { 
  TranslationService, 
  type TranslationResponse, 
  type ConfigResponse, 
  type InitResponse,
  type SupportedLanguages,
  type LanguageInfo,
  type LanguageSettings 
}; 