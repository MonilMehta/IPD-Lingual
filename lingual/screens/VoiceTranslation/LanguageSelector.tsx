import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { ChevronDown } from 'lucide-react-native';

interface LanguageSelectorProps {
  fromLanguage: string;
  toLanguage: string;
  onSelectFrom: () => void;
  onSelectTo: () => void;
}

export const LanguageSelector = ({
  fromLanguage,
  toLanguage,
  onSelectFrom,
  onSelectTo,
}: LanguageSelectorProps) => {
  return (
    <View style={styles.container}>
      <TouchableOpacity style={styles.languageButton} onPress={onSelectFrom}>
        <Text style={styles.languageText}>{fromLanguage}</Text>
        <ChevronDown size={20} color="#666" />
      </TouchableOpacity>

      <View style={styles.arrow}>
        <Text style={styles.arrowText}>→</Text>
      </View>

      <TouchableOpacity style={styles.languageButton} onPress={onSelectTo}>
        <Text style={styles.languageText}>{toLanguage}</Text>
        <ChevronDown size={20} color="#666" />
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    marginBottom: 32,
  },
  languageButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    gap: 8,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  languageText: {
    fontSize: 16,
    color: '#333',
    fontWeight: '500',
  },
  arrow: {
    padding: 8,
  },
  arrowText: {
    fontSize: 20,
    color: '#666',
  },
});