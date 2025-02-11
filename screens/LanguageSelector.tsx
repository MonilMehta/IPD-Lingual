import * as React from 'react';
import { useState, useEffect } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Globe } from 'lucide-react-native';
import { Picker } from '@react-native-picker/picker';
import { getLanguage, setLanguage } from './LanguageStorage';

const LANGUAGES = [
  { code: 'es', name: 'Spanish' },
  { code: 'fr', name: 'French' },
  { code: 'de', name: 'German' },
  { code: 'it', name: 'Italian' },
  { code: 'pt', name: 'Portuguese' },
  { code: 'ja', name: 'Japanese' },
  { code: 'ko', name: 'Korean' },
  { code: 'zh', name: 'Chinese' },
];

export function LanguageSelector() {
  const [selectedLanguage, setSelectedLanguage] = useState('es');

  useEffect(() => {
    // Load saved language on component mount
    const loadSavedLanguage = async () => {
      const saved = await getLanguage();
      if (saved) {
        setSelectedLanguage(saved);
      }
    };
    loadSavedLanguage();
  }, []);

  const handleLanguageChange = async (value: string) => {
    setSelectedLanguage(value);
    await setLanguage(value);
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Globe size={20} color="#FF6B00" style={styles.icon} />
        <Text style={styles.label}>Learning Language</Text>
      </View>
      <View style={styles.pickerContainer}>
        <Picker
          selectedValue={selectedLanguage}
          onValueChange={handleLanguageChange}
          style={styles.picker}
        >
          {LANGUAGES.map(lang => (
            <Picker.Item 
              key={lang.code}
              label={lang.name}
              value={lang.code}
            />
          ))}
        </Picker>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 10,
    elevation: 4,
    marginHorizontal: 8,
    marginBottom: 20,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 12,
  },
  icon: {
    marginRight: 8,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  pickerContainer: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 8,
    backgroundColor: '#F9FAFB',
    paddingLeft: 10,
  },
  picker: {
    height: 50,
    width: '100%',
    color: '#333',
  },
});
