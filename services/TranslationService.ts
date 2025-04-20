import { SPEECH_WS_URL } from '../config/constants';

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
  private static connectionPromise: Promise<void> | null = null;
  private static connectionResolve: (() => void) | null = null;
  

  static async connect(): Promise<boolean> {
    // If already connected, return resolved promise
    if (this.isConnected && this.ws) {
      return Promise.resolve(true);
    }
    
    // If a connection is in progress, return the existing promise
    if (this.connectionPromise) {
      return this.connectionPromise.then(() => this.isConnected);
    }
    
    console.log('🔄 Starting new WebSocket connection attempt');
    
    // Create a new connection promise
    this.connectionPromise = new Promise<boolean>((resolve) => {
      try {
        this.ws = new WebSocket(SPEECH_WS_URL); // Use imported constant
        
        // Don't disconnect WebSocket when stopping recording
        let isClosingIntentionally = false;

        this.ws.onopen = () => {
          console.log('🔗 WebSocket connected to translation service');
          this.isConnected = true;
          
          // No need to send any message on initial connection
          // The server will automatically send initialization data
          
          this.processQueue();
          resolve(true);
        };

        this.ws.onclose = () => {
          if (!isClosingIntentionally) {
            console.log('WebSocket disconnected unexpectedly, attempting to reconnect...');
            this.isConnected = false;
            this.ws = null;
            this.connectionPromise = null;
            // Attempt to reconnect after a delay
            setTimeout(() => this.connect(), 5000);
          } else {
            console.log('WebSocket closed intentionally');
            this.isConnected = false;
            this.ws = null;
            this.connectionPromise = null;
          }
          resolve(false);
        };

        this.ws.onerror = (error) => {
          console.error('WebSocket error:', error);
          this.isConnected = false;
          // Reset connection promise on error
          this.connectionPromise = null;
          resolve(false);
        };

        // Keep onmessage handler implementation...
        this.ws.onmessage = (event: WebSocketMessage) => {
          try {
            const response = JSON.parse(event.data as string);
            console.log('📥 Received message type:', response.type);
            
            if (response.supportedLanguages) {
              console.log('🌍 Received languages:', Object.keys(response.supportedLanguages).length);
              
              // Create a mapping of language codes to human-readable names
              const languageNames: Record<string, string> = {
                'en': 'English',
                'fr': 'French',
                'es': 'Spanish',
                'de': 'German',
                'hi': 'Hindi',
                'zh': 'Chinese',
                'ja': 'Japanese',
                'ko': 'Korean',
                'ar': 'Arabic',
                'ru': 'Russian',
                'pt': 'Portuguese',
                'it': 'Italian',
                'nl': 'Dutch',
                'tr': 'Turkish',
                'pl': 'Polish',
                'sv': 'Swedish',
                'vi': 'Vietnamese',
                'th': 'Thai',
                'id': 'Indonesian'
              };
                
              // Process and fix language data
              const processedLanguages: SupportedLanguages = {};
              
              for (const [code, info] of Object.entries(response.supportedLanguages)) {
                const displayName = languageNames[code] || `Language (${code})`;
                
                if (typeof info === 'object') {
                  const langInfo = info as any;
                  processedLanguages[code] = {
                    name: langInfo.name || displayName,
                    code: langInfo.code || code
                  };
                } else {
                  // If the structure is unexpected, create a valid language info object
                  processedLanguages[code] = {
                    name: displayName,
                    code: code
                  };
                }
              }
              
              this.supportedLanguages = processedLanguages;
            }
            
            switch (response.type) {
              case 'initialization':
                console.log('🌍 Received initialization with supported languages');
                if (response.supportedFormats) this.supportedFormats = response.supportedFormats;
                if (response.maxAudioSize) this.maxAudioSize = response.maxAudioSize;
                
                // Restore language settings if they're in the response
                if (response.currentSettings) {
                  this.languageSettings = response.currentSettings;
                }
                
                if (this.onInitCallback) {
                  this.onInitCallback({
                    ...response,
                    supportedLanguages: this.supportedLanguages
                  });
                }
                
                // If we have languages set, make sure to send them after initialization
                if (this.languageSettings.language1 && this.languageSettings.language2) {
                  console.log('🔄 Sending language settings after initialization');
                  this.setLanguages(
                    this.languageSettings.language1,
                    this.languageSettings.language2
                  ).catch(error => {
                    console.error('❌ Failed to restore language settings after init:', error);
                  });
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
      } catch (error) {
        console.error('Error creating WebSocket connection:', error);
        this.connectionPromise = null;
        resolve(false);
      }
    });
    
    return this.connectionPromise;
  }

  static async setLanguages(language1: string, language2: string): Promise<boolean> {
    try {
      // Make sure we're connected first
      const isConnected = await this.connect();
      
      if (!isConnected || !this.ws) {
        console.error('❌ Cannot set languages - WebSocket not connected');
        return false;
      }

      // Fix the message format to match server expectations
      const message = {
        setLanguages: {
          language1,
          language2
        }
      };

      console.log('📤 Setting languages:', message);
      this.ws.send(JSON.stringify(message));
      
      // Update local language settings immediately
      this.languageSettings = {
        language1,
        language2
      };
      
      return true;
    } catch (error) {
      console.error('❌ Error in setLanguages:', error);
      return false;
    }
  }

  static async sendAudioData(audioUri: string): Promise<boolean> {
    try {
      console.log('📱 Starting to process audio file from URI:', audioUri);
      
      // Check connection first
      const isConnected = await this.connect();
      if (!isConnected) {
        console.warn('❌ WebSocket not connected, audio data discarded');
        return false;
      }

      if (!this.ws) {
        console.warn('❌ WebSocket instance is null');
        return false;
      }

      if (!this.languageSettings?.language1 || !this.languageSettings?.language2) {
        console.error('❌ Languages must be set before processing audio');
        return false;
      }

      // Read the file as base64
      const response = await fetch(audioUri);
      const blob = await response.blob();
      
      return new Promise((resolve) => {
        const reader = new FileReader();
        
        reader.onload = () => {
          try {
            const base64Audio = (reader.result as string).split(',')[1];
            
            console.log('📊 Audio data size:', Math.round(base64Audio.length / 1024), 'KB');
            console.log('🎵 Audio format: AAC');
            console.log('📤 Sending audio for translation...');

            // Fix the message format to match server expectations
            const message = {
              audio: base64Audio,
              format: 'aac'
            };
            
            this.ws?.send(JSON.stringify(message));
            console.log('✅ Audio data sent successfully');
            resolve(true);
          } catch (error) {
            console.error('❌ Error processing audio data:', error);
            resolve(false);
          }
        };
        
        reader.onerror = () => {
          console.error('❌ Error reading audio file');
          resolve(false);
        };
        
        reader.readAsDataURL(blob);
      });
    } catch (error) {
      console.error('❌ Error sending audio data:', error);
      return false;
    }
  }

  static async processConversationAudio(audioUri: string): Promise<boolean> {
    if (!this.isConnected || !this.ws) {
      console.error('❌ Cannot process audio - WebSocket not connected');
      return false;
    }
    
    if (!this.languageSettings?.language1 || !this.languageSettings?.language2) {
      console.error('❌ Cannot process audio - Languages not set');
      return false;
    }
    
    return await this.sendAudioData(audioUri);
  }

  static onInit(callback: (init: InitResponse) => void) {
    this.onInitCallback = callback;
    // If we already have supported languages, call the callback immediately
    if (Object.keys(this.supportedLanguages).length > 0) {
      // Make sure all languages have proper name and code
      const processedLanguages: SupportedLanguages = {};
      
      for (const [code, info] of Object.entries(this.supportedLanguages)) {
        processedLanguages[code] = {
          name: info.name || `Language (${code})`,
          code: info.code || code
        };
      }
      
      this.supportedLanguages = processedLanguages;
      
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