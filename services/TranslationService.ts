import AsyncStorage from '@react-native-async-storage/async-storage';
import { getToken } from './Auth'; // Adjust the import path as necessary
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

const API_BASE = 'https://lingual-yn5c.onrender.com/api/speech';

class TranslationService {
  private static supportedLanguages: SupportedLanguages = {};
  private static languageSettings: LanguageSettings = {
    language1: null,
    language2: null
  };


  static async getSupportedLanguagesFromAPI(): Promise<SupportedLanguages> {
    // Remove API call, return static mapping
    const codes = ["en", "hi", "es", "fr", "de", "it", "pt", "ru"];
    const languageNames: Record<string, string> = {
      en: 'English',
      hi: 'Hindi',
      es: 'Spanish',
      fr: 'French',
      de: 'German',
      it: 'Italian',
      pt: 'Portuguese',
      ru: 'Russian'
    };
    const supported: SupportedLanguages = {};
    for (const code of codes) {
      supported[code] = { name: languageNames[code] || code, code };
    }
    this.supportedLanguages = supported;
    return supported;
  }

  static async processConversationAudioAPI(audioUri: string, lang1: string, lang2: string, format: string = 'mp3') {
    const token = await getToken();
    console.log('[processConversationAudioAPI] Token:', token);
    const formData = new FormData();
    // Use the file extension from the uri if possible
    let fileName = 'audio.mp3';
    if (audioUri && audioUri.includes('/')) {
      const parts = audioUri.split('/');
      fileName = parts[parts.length - 1] || fileName;
    }
    // @ts-ignore
    const fileObj = { uri: audioUri, name: fileName, type: 'audio/mp3' };
    formData.append('audio', fileObj);
    formData.append('lang1', lang1);
    formData.append('lang2', lang2);
    formData.append('format', 'mp3');

    // Log FormData keys and file info for debugging
    try {
      // @ts-ignore
      const keys = (formData as any)._parts.map((part: any[]) => part[0]);
      // @ts-ignore
      const values = (formData as any)._parts.map((part: any[]) => part[1]);
      console.log('[processConversationAudioAPI] FormData keys:', keys);
      console.log('[processConversationAudioAPI] File object:', fileObj);
      console.log('[processConversationAudioAPI] lang1:', lang1, 'lang2:', lang2, 'format:', 'mp3');
    } catch (err) {
      console.warn('[processConversationAudioAPI] Could not log FormData keys:', err);
    }

    try {
      const res = await fetch(`${API_BASE}`, {
        method: 'POST',
        body: formData,
        headers: {
          'Accept': 'application/json',
          ...(token ? { 'Authorization': `Bearer ${token}` } : {})
        },
      });
      if (!res.ok) {
        const errorText = await res.text();
        console.error('[processConversationAudioAPI] API error:', res.status, errorText);
        if (res.status === 401) {
          // Token expired, clear it
          await AsyncStorage.getItem('userToken');
          console.error('[processConversationAudioAPI] Token:', token, 'expired. Clearing it.');
        }
        throw new Error(`Failed to process audio: ${res.status} ${errorText}`);
      }
      const json = await res.json();
      console.log('[processConversationAudioAPI] API success:', json);
      return json;
    } catch (err) {
      console.error('[processConversationAudioAPI] Network or fetch error:', err);
      throw err;
    }
  }

  static setLanguages(language1: string, language2: string) {
    this.languageSettings = { language1, language2 };
  }

  static getSupportedLanguages(): SupportedLanguages {
    return this.supportedLanguages;
  }

  static getLanguageSettings(): LanguageSettings {
    return this.languageSettings;
  }
}

export {
  TranslationService,
  type TranslationResponse,
  type InitResponse,
  type SupportedLanguages,
  type LanguageInfo,
  type LanguageSettings
};