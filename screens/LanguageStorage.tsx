import AsyncStorage from '@react-native-async-storage/async-storage';

const LANGUAGE_KEY = 'selected_language';

export const getLanguage = async (): Promise<string | null> => {
  try {
    const language = await AsyncStorage.getItem(LANGUAGE_KEY);
    return language || null;
  } catch (error) {
    console.error('Error getting language:', error);
    return null;
  }
};

export const setLanguage = async (language: string): Promise<void> => {
  try {
    await AsyncStorage.setItem(LANGUAGE_KEY, language);
  } catch (error) {
    console.error('Error setting language:', error);
  }
};