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
  Image,
  Modal,
  TouchableWithoutFeedback,
  FlatList,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { ArrowLeftRight, X, Mic } from 'lucide-react-native';
import { Stack } from 'expo-router';

// Supported languages
const LANGUAGES = [
  { code: 'en', name: 'English' },
  { code: 'hi', name: 'Hindi' },
  { code: 'es', name: 'Spanish' },
  { code: 'fr', name: 'French' },
  { code: 'de', name: 'German' },
  { code: 'it', name: 'Italian' },
  { code: 'pt', name: 'Portuguese' },
  { code: 'ru', name: 'Russian' },
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
  "How do I get to...?",
  "Where is the nearest...?",
  "What time is it?",
  "Can I have...?",
  "I need help",
  "Please speak slowly",
  "Do you speak English?",
  "Where can I find...?",
  "How far is...?",
  "Is it safe here?",
  "Can you show me on the map?",
];

function LanguageDropdown({ selected, onSelect, options }) {
  const [visible, setVisible] = useState(false);
  return (
    <View>
      <TouchableOpacity
        style={styles.customDropdown}
        onPress={() => setVisible(true)}
        activeOpacity={0.7}
      >
        <Text style={styles.customDropdownText}>{selected.name}</Text>
      </TouchableOpacity>
      <Modal
        visible={visible}
        transparent
        animationType="fade"
        onRequestClose={() => setVisible(false)}
      >
        <TouchableWithoutFeedback onPress={() => setVisible(false)}>
          <View style={styles.modalOverlay} />
        </TouchableWithoutFeedback>
        <View style={styles.modalDropdown}>
          <FlatList
            data={options}
            keyExtractor={item => item.code}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={styles.dropdownItem}
                onPress={() => {
                  onSelect(item);
                  setVisible(false);
                }}
              >
                <Text style={styles.dropdownItemText}>{item.name}</Text>
              </TouchableOpacity>
            )}
          />
        </View>
      </Modal>
    </View>
  );
}

export default function TextTranslateScreen() {
  const [sourceText, setSourceText] = useState('');
  const [translatedText, setTranslatedText] = useState('');
  const [sourceLanguage, setSourceLanguage] = useState(LANGUAGES[0]);
  const [targetLanguage, setTargetLanguage] = useState(LANGUAGES[1]);
  const [isTranslating, setIsTranslating] = useState(false);
  const [showPhraseScrollTip, setShowPhraseScrollTip] = useState(true);
  
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
    let newText = sourceText ? sourceText + ' ' + phrase : phrase;
    setSourceText(newText);
    setTranslatedText('');
  };
  
  // Clear input text
  const clearText = () => {
    setSourceText('');
    setTranslatedText('');
  };
  
  // Perform translation using Google Translate API
  const translateText = async (textToTranslate) => {
    const text = typeof textToTranslate === 'string' ? textToTranslate : String(textToTranslate ?? '');
    if (!text.trim()) return;
    setIsTranslating(true);
    try {
      const url = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=auto&tl=${targetLanguage.code}&dt=t&q=${encodeURIComponent(text)}`;
      const res = await fetch(url);
      const data = await res.json();
      // Always extract translation as string
      let result = '';
      if (Array.isArray(data) && Array.isArray(data[0]) && Array.isArray(data[0][0])) {
        result = data[0][0][0] || '';
      } else {
        result = 'Could not get translation.';
      }
      setTranslatedText(result);
    } catch (e) {
      setTranslatedText('Translation failed.');
    }
    setIsTranslating(false);
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
          {/* Add mascot image at the top */}
          <View style={{ alignItems: 'center', marginBottom: 16 }}>
            <Image
              source={require('../../assets/images/cat-smiling.png')}
              style={{ width: 80, height: 80, borderRadius: 40 }}
              resizeMode="contain"
            />
          </View>
          {/* Language Selection */}
          <View style={styles.languageSelector}>
            <View style={styles.languageOption}>
              <Text style={styles.languageLabel}>From:</Text>
              <View style={styles.languageDropdown}>
                <LanguageDropdown
                  selected={sourceLanguage}
                  onSelect={setSourceLanguage}
                  options={LANGUAGES}
                />
              </View>
            </View>
            
            <TouchableOpacity style={styles.swapButton} onPress={swapLanguages}>
              <ArrowLeftRight size={20} color="#666" />
            </TouchableOpacity>
            
            <View style={styles.languageOption}>
              <Text style={styles.languageLabel}>To:</Text>
              <View style={styles.languageDropdown}>
                <LanguageDropdown
                  selected={targetLanguage}
                  onSelect={setTargetLanguage}
                  options={LANGUAGES}
                />
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
              <Mic size={20} color="#FF6B00" />
            </TouchableOpacity>
          </View>
          
          {/* Phrase Suggestions */}
          <View style={styles.phrasesScrollWrapper}>
            <ScrollView 
              horizontal 
              showsHorizontalScrollIndicator={false}
              style={styles.phrasesContainer}
              onScroll={({ nativeEvent }) => {
                if (nativeEvent.contentOffset.x > 10) setShowPhraseScrollTip(false);
              }}
              scrollEventThrottle={16}
            >
              {COMMON_PHRASES.map((phrase, index) => (
                <TouchableOpacity 
                  key={index} 
                  style={styles.phraseChip}
                  onPress={() => addPhrase(phrase)}
                  activeOpacity={0.7}
                >
                  <Text style={styles.phraseText}>{phrase}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
            {showPhraseScrollTip && (
              <View style={styles.scrollTip}>
                <Text style={styles.scrollTipText}>⇠ scroll</Text>
              </View>
            )}
          </View>
          
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
    backgroundColor: 'rgba(255, 107, 0, 0.1)',
    borderRadius: 20,
  },
  phrasesScrollWrapper: {
    position: 'relative',
    marginBottom: 20,
  },
  phrasesContainer: {
    flexDirection: 'row',
    marginBottom: 20,
  },
  phraseChip: {
    backgroundColor: '#fff3e0',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 18,
    marginRight: 10,
    borderWidth: 1,
    borderColor: '#FF6B00',
    marginBottom: 8,
  },
  phraseText: {
    fontSize: 15,
    color: '#FF6B00',
    fontWeight: '600',
  },
  translateButton: {
    backgroundColor: '#FF6B00',
    borderRadius: 8,
    padding: 16,
    alignItems: 'center',
    marginBottom: 20,
  },
  translateButtonDisabled: {
    backgroundColor: '#ffd6b3',
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
  customDropdown: {
    backgroundColor: '#fff',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#FF6B00',
    paddingVertical: 10,
    paddingHorizontal: 16,
    minWidth: 120,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  customDropdownText: {
    color: '#FF6B00',
    fontWeight: '600',
    fontSize: 16,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.2)',
  },
  modalDropdown: {
    position: 'absolute',
    top: 120,
    left: 30,
    right: 30,
    backgroundColor: '#fff',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#FF6B00',
    maxHeight: 300,
    zIndex: 100,
    paddingVertical: 8,
  },
  dropdownItem: {
    paddingVertical: 12,
    paddingHorizontal: 20,
  },
  dropdownItemText: {
    fontSize: 16,
    color: '#FF6B00',
  },
  scrollTip: {
    position: 'absolute',
    right: 0,
    top: 0,
    backgroundColor: '#FF6B00',
    borderRadius: 10,
    paddingHorizontal: 8,
    paddingVertical: 2,
    zIndex: 10,
  },
  scrollTipText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
  },
});
