import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';

const VOCABULARY_KEY = 'vocabulary_list';

interface LanguageStore {
  vocabulary: { word: string; translation: string }[];
  addVocabulary: (word: string, translation: string) => void;
  loadVocabulary: () => Promise<void>;
}

export const useLanguageStore = create<LanguageStore>((set) => ({
  vocabulary: [],
  addVocabulary: async (word, translation) => {
    try {
      set((state) => ({
        vocabulary: [...state.vocabulary, { word, translation }],
      }));
      const storedVocabulary = await AsyncStorage.getItem(VOCABULARY_KEY);
      const parsedVocabulary = storedVocabulary ? JSON.parse(storedVocabulary) : [];
      parsedVocabulary.push({ word, translation });
      await AsyncStorage.setItem(VOCABULARY_KEY, JSON.stringify(parsedVocabulary));
    } catch (error) {
      console.error('Error adding vocabulary:', error);
    }
  },
  loadVocabulary: async () => {
    try {
      const storedVocabulary = await AsyncStorage.getItem(VOCABULARY_KEY);
      if (storedVocabulary) {
        set({ vocabulary: JSON.parse(storedVocabulary) });
      }
    } catch (error) {
      console.error('Error loading vocabulary:', error);
    }
  },
}));
