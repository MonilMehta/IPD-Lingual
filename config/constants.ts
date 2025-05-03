// constants.js or constants.ts - Update with your ngrok URL

// Use the local IP for API and WebSocket URLs when running locally
export const API_URL = 'https://lingual-yn5c.onrender.com'; // Updated to local Flask server
export const SPEECH_WS_URL = 'ws://192.168.29.100:8766'; // Updated to local Speech WS
export const CAMERA_WS_URL = 'ws://192.168.29.100:8765'; // Updated to local Camera WS

export const SUPPORTED_LANGUAGES = [
  { code: 'en', name: 'English' },
  { code: 'es', name: 'Spanish' },
  { code: 'fr', name: 'French' },
  { code: 'de', name: 'German' },
  { code: 'hi', name: 'Hindi' },
  { code: 'ja', name: 'Japanese' },
  { code: 'ko', name: 'Korean' },
  { code: 'zh-cn', name: 'Chinese (Simplified)' },
  { code: 'ar', name: 'Arabic' },
  { code: 'ru', name: 'Russian' }
];