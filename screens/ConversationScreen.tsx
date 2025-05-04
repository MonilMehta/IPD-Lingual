import React, { useState, useEffect, useRef, useCallback } from 'react';
import { View, Text, ScrollView, TouchableOpacity, ActivityIndicator, SafeAreaView, StatusBar, Alert, Image } from 'react-native';
import { Audio } from 'expo-av';
import { Picker } from '@react-native-picker/picker';
import { MotiView } from 'moti';
import { Mic, MicOff, ArrowLeft, Languages } from 'lucide-react-native';
import { useNavigation } from 'expo-router';
import * as FileSystem from 'expo-file-system';
import * as Speech from 'expo-speech';
import { 
  TranslationService, 
  TranslationResponse, 
  SupportedLanguages,
  LanguageSettings 
} from '../services/TranslationService';
import { Ionicons } from '@expo/vector-icons';
import styles from '../styles/conversation_styles';
import { WaveAnimation, TypingIndicator, PulsingCircle, MemoizedUtterance, Utterance } from '../components/Conversation/ConversationUI';

// Mascot details
const MASCOT_NAME = 'Ollie';
const MASCOT_IMG = require('../assets/images/cat-thinking.png');
const FUN_MESSAGES = [
  `Ollie is thinking...`,
  `Ollie is chasing the words...`,
  `Ollie is purring up a translation!`,
  `Ollie is paw-sing for thought...`,
  `Ollie is meowing in two languages!`,
  `Ollie is on the case!`,
  `Ollie is making it bilingual!`,
  `Ollie is fetching your translation!`,
];

const ConversationScreen: React.FC = () => {
  const navigation = useNavigation();
  const [recording, setRecording] = useState<Audio.Recording | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [conversation, setConversation] = useState<Utterance[]>([]);
  const [supportedLanguages, setSupportedLanguages] = useState<SupportedLanguages>({});
  const [languageSettings, setLanguageSettings] = useState<LanguageSettings>({
    language1: null,
    language2: null
  });
  const [showLanguagePicker, setShowLanguagePicker] = useState(false);
  const [selectedLanguage1, setSelectedLanguage1] = useState<string>('');
  const [selectedLanguage2, setSelectedLanguage2] = useState<string>('');
  const [sound, setSound] = useState<Audio.Sound | null>(null);
  const scrollViewRef = useRef<ScrollView>(null);
  const recordingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const [isSettingLanguages, setIsSettingLanguages] = useState(false);
  const [isWaitingForResponse, setIsWaitingForResponse] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState<boolean>(false);
  const [speakingUtteranceId, setSpeakingUtteranceId] = useState<string | null>(null);
  const [funMessage, setFunMessage] = useState(FUN_MESSAGES[0]);

  useEffect(() => {
    (async () => {
      await Audio.requestPermissionsAsync();
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
        shouldDuckAndroid: true,
        playThroughEarpieceAndroid: false,
      });
      // Fetch supported languages from API
      try {
        const langs = await TranslationService.getSupportedLanguagesFromAPI();
        console.log('Fetched langs from API:', langs);
        setSupportedLanguages(langs);
        setShowLanguagePicker(true);
      } catch (e) {
        Alert.alert('Error', 'Failed to fetch supported languages');
      }
    })();
    return () => {
      stopRecording();
      if (sound) sound.unloadAsync();
    };
  }, []);

  useEffect(() => {
    if (scrollViewRef.current) {
      setTimeout(() => {
        scrollViewRef.current?.scrollToEnd({ animated: true });
      }, 100);
    }
  }, [conversation]);

  const processAndSchedule = async () => {
    if (!isRecording) return;
    
    try {
      console.log('🔄 Processing current recording segment...');
      await processCurrentRecording();
    } catch (error) {
      console.error('❌ Processing error:', error);
    } finally {
      if (isRecording) {
        console.log('⏱️ Scheduling next recording segment in 5 seconds...');
        recordingTimeoutRef.current = setTimeout(processAndSchedule, 5000);
      }
    }
  };

  const startRecording = async () => {
    try {
      console.log('🎤 Requesting audio permissions...');
      const permission = await Audio.requestPermissionsAsync();
      if (permission.status !== 'granted') {
        console.error('❌ Audio permission not granted');
        return;
      }
      console.log('✅ Audio permissions granted');

      console.log('⚙️ Configuring audio mode...');
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
        shouldDuckAndroid: true,
        playThroughEarpieceAndroid: false,
      });

      setIsRecording(true);
      await startNewRecordingSegment();
      processAndSchedule();
      console.log('✅ Recording cycle started');

    } catch (err) {
      console.error('❌ Failed to start recording:', err);
      setIsRecording(false);
    }
  };

  const startNewRecordingSegment = async () => {
    try {
      console.log('🎙️ Starting new recording segment...');
      const { recording: newRecording } = await Audio.Recording.createAsync({
        android: {
          extension: '.aac',
          outputFormat: Audio.AndroidOutputFormat.AAC_ADTS,
          audioEncoder: Audio.AndroidAudioEncoder.AAC,
          sampleRate: 16000,
          numberOfChannels: 1,
          bitRate: 16000,
        },
        ios: {
          extension: '.wav',
          outputFormat: Audio.IOSOutputFormat.LINEARPCM,
          audioQuality: Audio.IOSAudioQuality.HIGH,
          sampleRate: 16000,
          numberOfChannels: 1,
          bitRate: 16000,
          linearPCMBitDepth: 16,
          linearPCMIsBigEndian: false,
          linearPCMIsFloat: false,
        },
        web: {
          mimeType: 'audio/webm',
          bitsPerSecond: 16000,
        },
      });
      
      setRecording(newRecording);
      console.log('✅ Recording object created, recording started automatically');
      return true;
    } catch (error) {
      console.error('❌ Error starting new recording segment:', error);
      return false;
    }
  };

  const processCurrentRecording = async () => {
    if (!recording || isProcessing) return;
    setIsProcessing(true);
    // Pick a random fun message for mascot
    setFunMessage(FUN_MESSAGES[Math.floor(Math.random() * FUN_MESSAGES.length)]);
    try {
      const uri = recording.getURI();
      await recording.stopAndUnloadAsync();
      setRecording(null);
      if (uri && languageSettings.language1 && languageSettings.language2) {
        setIsWaitingForResponse(true);
        try {
          const response = await TranslationService.processConversationAudioAPI(
            uri,
            languageSettings.language1,
            languageSettings.language2,
            'aac'
          );
          setIsWaitingForResponse(false);
          setIsProcessing(false);
          if (
            response &&
            response.original &&
            response.translated &&
            typeof response.original.text === 'string' &&
            typeof response.translated.text === 'string'
          ) {
            setConversation(prev => [
              ...prev,
              {
                id: Date.now().toString(),
                text: response.original.text,
                language: response.original.language,
                translation: response.translated.text,
                audio: response.audio,
                person: response.person,
                timestamp: new Date(),
              },
            ]);
          } else {
            Alert.alert('Error', 'Invalid response from server. Please try again.');
          }
        } catch (err) {
          setIsWaitingForResponse(false);
          setIsProcessing(false);
          Alert.alert('Error', 'Failed to process audio.');
        }
        try {
          await FileSystem.deleteAsync(uri);
        } catch {}
      }
      if (isRecording) await startNewRecordingSegment();
    } catch (error) {
      setIsWaitingForResponse(false);
      setIsProcessing(false);
      if (isRecording) await startNewRecordingSegment();
    }
  };

  const stopRecording = async () => {
    console.log('⏹️ Stopping recording process...');
    setIsRecording(false);
    
    if (recordingTimeoutRef.current) {
      console.log('🔄 Clearing recording timeout');
      clearTimeout(recordingTimeoutRef.current);
      recordingTimeoutRef.current = null;
    }
    
    if (recording) {
      try {
        console.log('⏹️ Stopping final recording segment');
        const uri = recording.getURI();
        await recording.stopAndUnloadAsync();
        
        if (uri) {
          console.log('📤 Processing final segment...');
          setIsWaitingForResponse(true);  // Set waiting state explicitly
          setFunMessage(FUN_MESSAGES[Math.floor(Math.random() * FUN_MESSAGES.length)]);
          
          const response = await TranslationService.processConversationAudioAPI(
            uri,
            languageSettings.language1,
            languageSettings.language2,
            'aac'
          );
          setIsWaitingForResponse(false);
          if (
            response &&
            response.original &&
            response.translated &&
            typeof response.original.text === 'string' &&
            typeof response.translated.text === 'string'
          ) {
            setConversation(prev => [
              ...prev,
              {
                id: Date.now().toString(),
                text: response.original.text,
                language: response.original.language,
                translation: response.translated.text,
                audio: response.audio,
                person: response.person,
                timestamp: new Date(),
              },
            ]);
          } else {
            Alert.alert('Error', 'Invalid response from server. Please try again.');
          }
          
          try {
            await FileSystem.deleteAsync(uri);
            console.log('🗑️ Cleaned up final recording file');
          } catch (error) {
            console.warn('⚠️ Failed to cleanup final recording file:', error);
          }
        }
        
        setRecording(null);
        console.log('✅ Recording stopped successfully');
      } catch (error) {
        console.error('❌ Error stopping recording:', error);
        setIsWaitingForResponse(false);  // Reset on error
      }
    }
  };

  const toggleRecording = async () => {
    if (isRecording) {
      await stopRecording();
    } else {
      if (!languageSettings?.language1 || !languageSettings?.language2) {
        setShowLanguagePicker(true);
        return;
      }
      await startRecording();
    }
  };

  const playAudio = async (audio: string) => {
    try {
      if (sound) {
        await sound.unloadAsync();
      }
      
      const uri = `data:audio/aac;base64,${audio}`;
      const { sound: newSound } = await Audio.Sound.createAsync(
        { uri },
        { shouldPlay: true }
      );
      
      setSound(newSound);
      await newSound.playAsync();
    } catch (error) {
      console.error('Error playing audio:', error);
    }
  };

  // Text-to-speech functionality
  const speakText = async (text: string, utteranceId: string) => {
    try {
      if (isSpeaking && speakingUtteranceId === utteranceId) {
        // Stop if already speaking this utterance
        Speech.stop();
        setIsSpeaking(false);
        setSpeakingUtteranceId(null);
        return;
      }
      
      // Stop any current speech
      if (isSpeaking) {
        Speech.stop();
      }
      
      setIsSpeaking(true);
      setSpeakingUtteranceId(utteranceId);
      
      Speech.speak(text, {
        language: 'en', // Default language
        rate: 0.9,
        pitch: 1.0,
        onDone: () => {
          setIsSpeaking(false);
          setSpeakingUtteranceId(null);
        },
        onError: () => {
          setIsSpeaking(false);
          setSpeakingUtteranceId(null);
          Alert.alert("Speech Error", "Unable to play speech");
        },
      });
    } catch (error) {
      console.error('Text-to-speech error:', error);
      setIsSpeaking(false);
      setSpeakingUtteranceId(null);
    }
  };

  // Clean up speech on unmount
  useEffect(() => {
    return () => {
      if (isSpeaking) {
        Speech.stop();
      }
    };
  }, [isSpeaking]);

  const handleLanguageSelect = async () => {
    if (!selectedLanguage1 || !selectedLanguage2) {
      Alert.alert('Error', 'Please select both languages');
      return;
    }

    if (selectedLanguage1 === selectedLanguage2) {
      Alert.alert('Error', 'Please select different languages');
      return;
    }

    setIsSettingLanguages(true);
    try {
      TranslationService.setLanguages(selectedLanguage1, selectedLanguage2);
      setLanguageSettings({ language1: selectedLanguage1, language2: selectedLanguage2 });
      setShowLanguagePicker(false);
      setConversation([]);
    } finally {
      setIsSettingLanguages(false);
    }
  };

  const renderLanguagePicker = () => (
    <View style={styles.languagePickerContainer}>
      <View style={styles.languagePickerContent}>
        <Text style={styles.modalTitle}>Select Languages</Text>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginVertical: 16 }}>
          <View style={{ flex: 1 }}>
            <Text style={styles.pickerLabel}>Language 1:</Text>
            <View style={styles.languageGrid}>
              {Object.entries(supportedLanguages).map(([code, info]) => (
                <TouchableOpacity
                  key={code + '-1'}
                  style={[
                    styles.languageCard,
                    selectedLanguage1 === code && styles.selectedCard,
                  ]}
                  onPress={() => setSelectedLanguage1(code)}
                >
                  <Text style={styles.languageLabel}>{info.name}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
          <Image source={MASCOT_IMG} style={{ width: 60, height: 60, marginHorizontal: 12 }} />
          <View style={{ flex: 1 }}>
            <Text style={styles.pickerLabel}>Language 2:</Text>
            <View style={styles.languageGrid}>
              {Object.entries(supportedLanguages).map(([code, info]) => (
                <TouchableOpacity
                  key={code + '-2'}
                  style={[
                    styles.languageCard,
                    selectedLanguage2 === code && styles.selectedCard,
                  ]}
                  onPress={() => setSelectedLanguage2(code)}
                >
                  <Text style={styles.languageLabel}>{info.name}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </View>
        <View style={styles.pickerButtonContainer}>
          <TouchableOpacity 
            style={styles.pickerButton} 
            onPress={() => setShowLanguagePicker(false)}
          >
            <Text style={styles.pickerButtonText}>Cancel</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[
              styles.pickerButton, 
              styles.pickerButtonConfirm,
              (isSettingLanguages || !selectedLanguage1 || !selectedLanguage2) && styles.pickerButtonDisabled
            ]} 
            onPress={handleLanguageSelect}
            disabled={isSettingLanguages || !selectedLanguage1 || !selectedLanguage2}
          >
            {isSettingLanguages ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <Text style={styles.pickerButtonTextConfirm}>Confirm</Text>
            )}
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );

  const renderLanguageInfo = () => (
    <View style={[styles.languageInfoContainer, { alignItems: 'center', justifyContent: 'center' }]}> 
      <TouchableOpacity 
        style={styles.languageCard}
        onPress={() => {
          setSelectedLanguage1(languageSettings.language1 || '');
          setSelectedLanguage2(languageSettings.language2 || '');
          setShowLanguagePicker(true);
        }}
      >
        <Text style={styles.speakerLabel}>Language 1</Text>
        <Text style={styles.languageLabel}>
          {languageSettings?.language1 && supportedLanguages[languageSettings.language1] 
            ? supportedLanguages[languageSettings.language1].name 
            : 'Not Set'}
        </Text>
        <Text style={styles.tapToChange}>Tap to change</Text>
      </TouchableOpacity>
      <Image source={MASCOT_IMG} style={{ width: 48, height: 48, marginHorizontal: 18 }} />
      <TouchableOpacity 
        style={styles.languageCard}
        onPress={() => {
          setSelectedLanguage1(languageSettings.language1 || '');
          setSelectedLanguage2(languageSettings.language2 || '');
          setShowLanguagePicker(true);
        }}
      >
        <Text style={styles.speakerLabel}>Language 2</Text>
        <Text style={styles.languageLabel}>
          {languageSettings?.language2 && supportedLanguages[languageSettings.language2] 
            ? supportedLanguages[languageSettings.language2].name 
            : 'Not Set'}
        </Text>
        <Text style={styles.tapToChange}>Tap to change</Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#fff" />
      
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <ArrowLeft size={24} color="#333" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Bilingual Translation</Text>
        <TouchableOpacity 
          style={styles.languageButton}
          onPress={() => setShowLanguagePicker(true)}
        >
          <Languages size={24} color="#333" />
        </TouchableOpacity>
      </View>
      
      {renderLanguageInfo()}
      
      {/* Conversation Area */}
      <ScrollView
        ref={scrollViewRef}
        style={styles.conversationContainer}
        contentContainerStyle={styles.conversationContent}
      >
        {conversation.map((utterance) => (
          <MemoizedUtterance
            key={utterance.id}
            utterance={utterance}
            languageSettings={languageSettings}
            supportedLanguages={supportedLanguages}
            playAudio={playAudio}
            speakText={speakText}
            isSpeaking={isSpeaking}
            speakingUtteranceId={speakingUtteranceId}
          />
        ))}
        {isProcessing && (
          <View style={styles.processingContainer}>
            <ActivityIndicator size="small" color="#FF6B00" />
            <Text style={styles.processingText}>Processing...</Text>
          </View>
        )}
        {isWaitingForResponse && (
          <View style={styles.waitingContainer}>
            <Image source={MASCOT_IMG} style={{ width: 36, height: 36, marginRight: 10 }} />
            <TypingIndicator />
            <Text style={styles.waitingText}>{funMessage}</Text>
          </View>
        )}
      </ScrollView>
      
      {/* Recording Button or Wave Animation */}
      <View style={styles.controlsContainer}>
        <MotiView
          from={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: 'timing', duration: 300 }}
        >
          {isWaitingForResponse ? (
            <View style={styles.waveAnimationContainer}>
              <PulsingCircle color="rgba(255, 107, 0, 0.3)" />
              <TypingIndicator />
            </View>
          ) : (
            <TouchableOpacity
              style={[
                styles.recordButton,
                isRecording ? styles.recordingActive : {}
              ]}
              onPress={toggleRecording}
              disabled={isProcessing || isWaitingForResponse}
            >
              {isRecording ? (
                <MicOff size={32} color="#fff" />
              ) : (
                <Mic size={32} color="#fff" />
              )}
            </TouchableOpacity>
          )}
        </MotiView>
        <Text style={styles.recordingStatus}>
          {isRecording ? 'Recording...' : 
           isWaitingForResponse ? 'Getting translation...' :
           'Tap to start conversation'}
        </Text>
      </View>
      
      {/* Language Picker */}
      {showLanguagePicker && renderLanguagePicker()}
    </SafeAreaView>
  );
};

export default ConversationScreen;