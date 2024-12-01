import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Copy, Speaker } from 'lucide-react-native';

interface TranslationResultProps {
  originalText: string;
  translatedText: string;
  onCopy: () => void;
  onSpeak: () => void;
}

export const TranslationResult = ({
  originalText,
  translatedText,
  onCopy,
  onSpeak,
}: TranslationResultProps) => {
  return (
    <View style={styles.container}>
      <View style={styles.textContainer}>
        <Text style={styles.label}>You said:</Text>
        <Text style={styles.text}>{originalText}</Text>
      </View>
      
      <View style={styles.textContainer}>
        <Text style={styles.label}>Translation:</Text>
        <Text style={styles.translatedText}>{translatedText}</Text>
        
        <View style={styles.actions}>
          <TouchableOpacity style={styles.actionButton} onPress={onCopy}>
            <Copy size={20} color="#FF6B00" />
            <Text style={styles.actionText}>Copy</Text>
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.actionButton} onPress={onSpeak}>
            <Speaker size={20} color="#FF6B00" />
            <Text style={styles.actionText}>Listen</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 20,
    backgroundColor: 'white',
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  textContainer: {
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
  },
  text: {
    fontSize: 18,
    color: '#333',
  },
  translatedText: {
    fontSize: 20,
    color: '#FF6B00',
    fontWeight: '600',
  },
  actions: {
    flexDirection: 'row',
    marginTop: 16,
    gap: 16,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 8,
    backgroundColor: '#F8F9FA',
    borderRadius: 8,
    gap: 8,
  },
  actionText: {
    color: '#FF6B00',
    fontWeight: '500',
  },
});