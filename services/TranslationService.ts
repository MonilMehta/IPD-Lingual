import * as FileSystem from 'expo-file-system';
import { Platform } from 'react-native';

interface ConversationResponse {
  speaker: string;
  text: string;
  language: string;
  translated_text?: string;
}

const API_URL = 'http://your-flask-backend-url.com'; // Update with your actual Flask backend URL

export class TranslationService {
  /**
   * Process audio file for conversation translation
   * @param audioUri URI of the recorded audio file
   */
  static async processConversationAudio(audioUri: string): Promise<ConversationResponse | null> {
    try {
      // Create form data with the audio file
      const formData = new FormData();
      
      // Get file info
      const fileInfo = await FileSystem.getInfoAsync(audioUri);
      if (!fileInfo.exists) {
        throw new Error('Audio file does not exist');
      }
      
      // Add audio file to form data
      formData.append('audio', {
        uri: Platform.OS === 'ios' ? audioUri.replace('file://', '') : audioUri,
        name: 'audio.m4a',
        type: 'audio/m4a'
      } as any);

      // Send to backend
      const response = await fetch(`${API_URL}/api/conversation/process`, {
        method: 'POST',
        body: formData,
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'multipart/form-data',
        },
      });

      if (!response.ok) {
        throw new Error(`Server responded with ${response.status}`);
      }

      const data = await response.json();
      return data;
      
    } catch (error) {
      console.error('Failed to process audio:', error);
      return null;
    }
  }
  
  /**
   * For testing/development without a backend
   */
  static async mockProcessConversationAudio(audioUri: string): Promise<ConversationResponse> {
    // For development and testing when backend is not available
    await new Promise(resolve => setTimeout(resolve, 1500)); // Simulate network delay
    
    // Randomly determine if this is Person 1 or Person 2
    const speakerNum = Math.random() > 0.5 ? 1 : 2;
    const speaker = `Person ${speakerNum}`;
    
    // Mock different languages for different speakers
    const language = speakerNum === 1 ? 'Spanish' : 'English';
    
    // Mock detected text based on speaker
    let text = '';
    if (speakerNum === 1) {
      const spanishPhrases = [
        "Hola, ¿cómo estás?",
        "Me gustaría pedir un café, por favor.",
        "¿Cuánto cuesta esto?",
        "¿Dónde está el baño?",
        "Gracias por tu ayuda."
      ];
      text = spanishPhrases[Math.floor(Math.random() * spanishPhrases.length)];
    } else {
      const englishPhrases = [
        "Hello, how are you?",
        "I would like to order a coffee, please.",
        "How much does this cost?",
        "Where is the bathroom?",
        "Thank you for your help."
      ];
      text = englishPhrases[Math.floor(Math.random() * englishPhrases.length)];
    }
    
    return {
      speaker,
      text,
      language
    };
  }
}
