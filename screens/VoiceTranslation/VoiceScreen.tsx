import React, { useState, useEffect } from 'react';
import { View, StyleSheet, TouchableOpacity, Text, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Voice, { SpeechResultsEvent } from '@react-native-voice/voice';
import { Mic, ChevronLeft } from 'lucide-react-native';
import { WaveAnimation } from './WaveAnimation';
import { TranslationResult } from './TranslationResult';
import { LanguageSelector } from './LanguageSelector';

export default function VoiceScreen({ navigation }) {
  const [isRecording, setIsRecording] = useState(false);
  const [hasPermission, setHasPermission] = useState(false);
  const [results, setResults] = useState<string[]>([]);
  const [translation, setTranslation] = useState('');
  const [fromLanguage, setFromLanguage] = useState('English');
  const [toLanguage, setToLanguage] = useState('Spanish');

  useEffect(() => {
    // Initialize voice recognition
    Voice.onSpeechResults = onSpeechResults;
    Voice.onSpeechError = onSpeechError;

    // Check for permissions
    checkPermission();

    return () => {
      Voice.destroy().then(Voice.removeAllListeners);
    };
  }, []);

  const checkPermission = async () => {
    // Implementation will vary by platform
    // This is a simplified version
    try {
      if (Platform.OS !== 'web') {
        // For mobile platforms, implement proper permission check
        setHasPermission(true);
      } else {
        // For web, check if browser supports speech recognition
        setHasPermission('webkitSpeechRecognition' in window);
      }
    } catch (error) {
      console.error('Error checking permission:', error);
      setHasPermission(false);
    }
  };

  const onSpeechResults = (e: SpeechResultsEvent) => {
    if (e.value) {
      setResults(e.value);
      // Mock translation - replace with actual translation API call
      mockTranslate(e.value[0]);
    }
  };

  const onSpeechError = (e: any) => {
    console.error('Speech recognition error:', e);
    stopRecording();
  };

  const mockTranslate = (text: string) => {
    // Mock translation - replace with actual API call
    const translations = {
      'hello': 'hola',
      'how are you': 'cómo estás',
      'good morning': 'buenos días',
      // Add more mock translations as needed
    };

    setTimeout(() => {
      setTranslation(translations[text.toLowerCase()] || 'Translation not found');
    }, 500);
  };

  const startRecording = async () => {
    try {
      await Voice.start('en-US');
      setIsRecording(true);
    } catch (e) {
      console.error('Error starting recording:', e);
    }
  };

  const stopRecording = async () => {
    try {
      await Voice.stop();
      setIsRecording(false);
    } catch (e) {
      console.error('Error stopping recording:', e);
    }
  };

  const handleCopy = () => {
    if (translation) {
      // Implement copy to clipboard
      console.log('Copying:', translation);
    }
  };

  const handleSpeak = () => {
    if (translation) {
      // Implement text-to-speech
      console.log('Speaking:', translation);
    }
  };

  if (!hasPermission) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.content}>
          <Text style={styles.message}>
            Microphone permission is required for voice translation
          </Text>
          <TouchableOpacity
            style={styles.permissionButton}
            onPress={checkPermission}
          >
            <Text style={styles.permissionButtonText}>Grant Permission</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <ChevronLeft size={24} color="#333" />
        </TouchableOpacity>
        <Text style={styles.title}>Voice Translation</Text>
      </View>

      <View style={styles.content}>
        <LanguageSelector
          fromLanguage={fromLanguage}
          toLanguage={toLanguage}
          onSelectFrom={() => {/* Implement language selection */}}
          onSelectTo={() => {/* Implement language selection */}}
        />

        <WaveAnimation isRecording={isRecording} />

        <TouchableOpacity
          style={[styles.recordButton, isRecording && styles.recordingButton]}
          onPress={isRecording ? stopRecording : startRecording}
        >
          <Mic size={32} color="white" />
        </TouchableOpacity>

        <Text style={styles.hint}>
          {isRecording ? 'Tap to stop' : 'Tap to start speaking'}
        </Text>

        {results.length > 0 && translation && (
          <View style={styles.resultContainer}>
            <TranslationResult
              originalText={results[0]}
              translatedText={translation}
              onCopy={handleCopy}
              onSpeak={handleSpeak}
            />
          </View>
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  backButton: {
    padding: 8,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginLeft: 16,
  },
  content: {
    flex: 1,
    padding: 20,
  },
  recordButton: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#FF6B00',
    justifyContent: 'center',
    alignItems: 'center',
    alignSelf: 'center',
    marginTop: 32,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  recordingButton: {
    backgroundColor: '#DC2626',
  },
  hint: {
    textAlign: 'center',
    color: '#666',
    marginTop: 16,
    fontSize: 14,
  },
  resultContainer: {
    marginTop: 32,
  },
  message: {
    textAlign: 'center',
    color: '#666',
    marginBottom: 20,
  },
  permissionButton: {
    backgroundColor: '#FF6B00',
    padding: 12,
    borderRadius: 8,
    alignSelf: 'center',
  },
  permissionButtonText: {
    color: 'white',
    fontWeight: '600',
  },
});