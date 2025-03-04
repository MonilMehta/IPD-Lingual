import { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  SafeAreaView,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { ArrowLeftRight, X, Mic } from 'lucide-react-native';
import { Stack } from 'expo-router';

// Mock language options
const LANGUAGES = [
  { code: 'en', name: 'English' },
  { code: 'es', name: 'Spanish' },
  { code: 'fr', name: 'French' },
  { code: 'de', name: 'German' },
  { code: 'ja', name: 'Japanese' },
  { code: 'zh', name: 'Chinese' },
];

// Common phrases for suggestions
const COMMON_PHRASES = [
  "Hello",
  "Thank you",
  "Excuse me",
  "Where is...?",
  "How much?",
  "I don't understand",
  "Can you help me?",
  "Good morning",
];

export default function TextTranslateScreen() {
  const [sourceText, setSourceText] = useState('');
  const [translatedText, setTranslatedText] = useState('');
  const [sourceLanguage, setSourceLanguage] = useState(LANGUAGES[0]);
  const [targetLanguage, setTargetLanguage] = useState(LANGUAGES[1]);
  const [isTranslating, setIsTranslating] = useState(false);
  
  // Swap languages function
  const swapLanguages = () => {
    const temp = sourceLanguage;
    setSourceLanguage(targetLanguage);
    setTargetLanguage(temp);
    
    // Also swap text if there's translated content
    if (translatedText) {
      setSourceText(translatedText);
      setTranslatedText('');
    }
  };
  
  // Add phrase to input
  const addPhrase = (phrase) => {
    if (sourceText) {
      setSourceText(sourceText + ' ' + phrase);
    } else {
      setSourceText(phrase);
    }
  };
  
  // Clear input text
  const clearText = () => {
    setSourceText('');
    setTranslatedText('');
  };
  
  // Perform translation (mock implementation)
  const translateText = async () => {
    if (!sourceText.trim()) return;
    
    setIsTranslating(true);
    
    // Simulate API call with timeout
    setTimeout(() => {
      // Mock translation - in a real app, call translation API here
      setTranslatedText(`[${targetLanguage.name} translation of: "${sourceText}"]`);
      setIsTranslating(false);
    }, 1000);
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="dark" />
      <Stack.Screen 
        options={{
          headerShown: true,
          headerTitle: 'Text Translation',
          headerBackTitle: 'Home',
        }}
      />
      
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardAvoidView}
      >
        <ScrollView style={styles.scrollContainer}>
          {/* Language Selection */}
          <View style={styles.languageSelector}>
            <View style={styles.languageOption}>
              <Text style={styles.languageLabel}>From:</Text>
              <View style={styles.languageDropdown}>
                <Text style={styles.languageName}>{sourceLanguage.name}</Text>
              </View>
            </View>
            
            <TouchableOpacity style={styles.swapButton} onPress={swapLanguages}>
              <ArrowLeftRight size={20} color="#666" />
            </TouchableOpacity>
            
            <View style={styles.languageOption}>
              <Text style={styles.languageLabel}>To:</Text>
              <View style={styles.languageDropdown}>
                <Text style={styles.languageName}>{targetLanguage.name}</Text>
              </View>
            </View>
          </View>
          
          {/* Text Input Area */}
          <View style={styles.textInputContainer}>
            <TextInput
              style={styles.textInput}
              multiline
              placeholder="Enter text to translate"
              value={sourceText}
              onChangeText={setSourceText}
              textAlignVertical="top"
            />
            
            {sourceText ? (
              <TouchableOpacity style={styles.clearButton} onPress={clearText}>
                <X size={18} color="#666" />
              </TouchableOpacity>
            ) : null}
            
            <TouchableOpacity style={styles.micButton}>
              <Mic size={20} color="#9C27B0" />
            </TouchableOpacity>
          </View>
          
          {/* Phrase Suggestions */}
          <ScrollView 
            horizontal 
            showsHorizontalScrollIndicator={false}
            style={styles.phrasesContainer}
          >
            {COMMON_PHRASES.map((phrase, index) => (
              <TouchableOpacity 
                key={index} 
                style={styles.phraseChip}
                onPress={() => addPhrase(phrase)}
              >
                <Text style={styles.phraseText}>{phrase}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
          
          {/* Translate Button */}
          <TouchableOpacity 
            style={[
              styles.translateButton,
              !sourceText.trim() && styles.translateButtonDisabled
            ]} 
            onPress={translateText}
            disabled={!sourceText.trim() || isTranslating}
          >
            {isTranslating ? (
              <ActivityIndicator color="#fff" size="small" />
            ) : (
              <Text style={styles.translateButtonText}>Translate</Text>
            )}
          </TouchableOpacity>
          
          {/* Translation Result */}
          {translatedText ? (
            <View style={styles.translationResultContainer}>
              <Text style={styles.translationResultTitle}>Translation</Text>
              <View style={styles.translationTextContainer}>
                <Text style={styles.translationText}>{translatedText}</Text>
              </View>
            </View>
          ) : null}
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f9f9f9',
  },
  keyboardAvoidView: {
    flex: 1,
  },
  scrollContainer: {
    flex: 1,
    padding: 16,
  },
  languageSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  languageOption: {
    flex: 1,
  },
  languageLabel: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  languageDropdown: {
    backgroundColor: '#fff',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  languageName: {
    fontSize: 15,
    fontWeight: '500',
    color: '#333',
  },
  swapButton: {
    padding: 12,
    backgroundColor: '#f0f0f0',
    borderRadius: 20,
    marginHorizontal: 10,
    marginTop: 15,
  },
  textInputContainer: {
    position: 'relative',
    marginBottom: 16,
  },
  textInput: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 16,
    minHeight: 150,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    fontSize: 16,
    color: '#333',
  },
  clearButton: {
    position: 'absolute',
    top: 8,
    right: 8,
    padding: 4,
  },
  micButton: {
    position: 'absolute',
    bottom: 8,
    right: 8,
    padding: 8,
    backgroundColor: 'rgba(156, 39, 176, 0.1)',
    borderRadius: 20,
  },
  phrasesContainer: {
    flexDirection: 'row',
    marginBottom: 20,
  },
  phraseChip: {
    backgroundColor: 'rgba(156, 39, 176, 0.1)',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 16,
    marginRight: 8,
    borderWidth: 1,
    borderColor: 'rgba(156, 39, 176, 0.3)',
  },
  phraseText: {
    fontSize: 14,
    color: '#9C27B0',
    fontWeight: '500',
  },
  translateButton: {
    backgroundColor: '#9C27B0',
    borderRadius: 8,
    padding: 16,
    alignItems: 'center',
    marginBottom: 20,
  },
  translateButtonDisabled: {
    backgroundColor: '#d0d0d0',
  },
  translateButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  translationResultContainer: {
    marginBottom: 20,
  },
  translationResultTitle: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
  },
  translationTextContainer: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 16,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  translationText: {
    fontSize: 16,
    color: '#333',
    lineHeight: 24,
  },
});
