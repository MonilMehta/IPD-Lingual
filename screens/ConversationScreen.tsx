import React, { useState, useEffect, useRef, useCallback } from 'react';
import { View, Text, ScrollView, TouchableOpacity, ActivityIndicator, SafeAreaView, StatusBar, Alert, AppState, AppStateStatus } from 'react-native';
import { Audio } from 'expo-av';
import { Picker } from '@react-native-picker/picker';
import { MotiView } from 'moti';
import { Mic, MicOff, ArrowLeft, Languages, Volume2, Volume } from 'lucide-react-native';
import { useNavigation } from 'expo-router';
import * as FileSystem from 'expo-file-system';
import * as Speech from 'expo-speech';
import { 
  TranslationService, 
  TranslationResponse, 
  ConfigResponse, 
  InitResponse,
  SupportedLanguages,
  LanguageSettings 
} from '../services/TranslationService';
import { Ionicons } from '@expo/vector-icons';
import styles from '../styles/conversation_styles';
import { WaveAnimation, TypingIndicator, PulsingCircle, MemoizedUtterance, Utterance } from '../components/Conversation/ConversationUI';

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
  const [appState, setAppState] = useState<AppStateStatus>(AppState.currentState);
  const [lastConnectionAttempt, setLastConnectionAttempt] = useState<number>(0);
  const connectionIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const [isConnected, setIsConnected] = useState<boolean>(false);
  const checkConnectionIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const [isWaitingForResponse, setIsWaitingForResponse] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState<boolean>(false);
  const [speakingUtteranceId, setSpeakingUtteranceId] = useState<string | null>(null);

  const createUtterance = useCallback((data: Partial<Utterance>): Utterance => ({
    id: Date.now().toString(),
    text: '',
    language: '',
    translation: null,
    audio: undefined,
    person: '1',
    timestamp: new Date(),
    ...data
  }), []);

  const connectWithThrottle = useCallback(async () => {
    const now = Date.now();
    if (now - lastConnectionAttempt > 10000) {
      console.log('Attempting to connect to translation service...');
      const success = await TranslationService.connect();
      setIsConnected(success);
      setLastConnectionAttempt(now);
    } else {
      console.log('Skipping connection attempt - too soon since last attempt');
    }
  }, [lastConnectionAttempt]);

  useEffect(() => {
    const subscription = AppState.addEventListener('change', nextAppState => {
      if (appState.match(/inactive|background/) && nextAppState === 'active') {
        connectWithThrottle();
      } else if (nextAppState.match(/inactive|background/)) {
        TranslationService.disconnect();
        if (connectionIntervalRef.current) {
          clearInterval(connectionIntervalRef.current);
          connectionIntervalRef.current = null;
        }
      }
      setAppState(nextAppState);
    });

    return () => {
      subscription.remove();
      TranslationService.disconnect();
      if (connectionIntervalRef.current) {
        clearInterval(connectionIntervalRef.current);
      }
    };
  }, [appState, connectWithThrottle]);

  useEffect(() => {
    connectWithThrottle();
    
    connectionIntervalRef.current = setInterval(() => {
      if (!TranslationService.getConnectionStatus()) {
        connectWithThrottle();
      }
    }, 10000);

    return () => {
      if (connectionIntervalRef.current) {
        clearInterval(connectionIntervalRef.current);
      }
      TranslationService.disconnect();
    };
  }, [connectWithThrottle]);

  useEffect(() => {
    (async () => {
      await Audio.requestPermissionsAsync();
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
        shouldDuckAndroid: true,
        playThroughEarpieceAndroid: false,
      });

      TranslationService.onInit((init: InitResponse) => {
        console.log('🌍 Received supported languages:', Object.keys(init.supportedLanguages).length);
        setSupportedLanguages(init.supportedLanguages);
        
        if (init.currentSettings?.language1 && init.currentSettings?.language2) {
          setLanguageSettings(init.currentSettings);
          setSelectedLanguage1(init.currentSettings.language1);
          setSelectedLanguage2(init.currentSettings.language2);
        } else {
          setShowLanguagePicker(true);
        }
      });

      TranslationService.onTranslation((response: TranslationResponse) => {
        if (response.languageSettings) {
          setLanguageSettings(response.languageSettings);
        }
        
        const utterance: Utterance = {
          id: Date.now().toString(),
          text: response.original.text,
          language: response.original.language,
          translation: response.translated.text,
          audio: response.audio,
          person: response.person,
          timestamp: new Date()
        };
        
        setConversation(prev => [...prev, utterance]);
      });

      TranslationService.onConfig((config: ConfigResponse) => {
        if (config.languageSettings) {
          setLanguageSettings(config.languageSettings);
        }
      });
    })();

    return () => {
      stopRecording();
      TranslationService.disconnect();
      if (sound) {
        sound.unloadAsync();
      }
    };
  }, [createUtterance]);

  useEffect(() => {
    if (scrollViewRef.current) {
      setTimeout(() => {
        scrollViewRef.current?.scrollToEnd({ animated: true });
      }, 100);
    }
  }, [conversation]);

  useEffect(() => {
    const checkConnection = async () => {
      const status = TranslationService.getConnectionStatus();
      setIsConnected(status);
    };
    
    // Check initially
    checkConnection();
    
    // Setup interval to check connection status
    checkConnectionIntervalRef.current = setInterval(checkConnection, 3000);
    
    return () => {
      if (checkConnectionIntervalRef.current) {
        clearInterval(checkConnectionIntervalRef.current);
      }
    };
  }, []);

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
    if (!recording || isProcessing) {
      console.log('⚠️ Skipping process - recording:', !!recording, 'isProcessing:', isProcessing);
      return;
    }
    
    setIsProcessing(true);
    
    try {
      console.log('⏹️ Stopping current recording segment');
      const uri = recording.getURI();
      await recording.stopAndUnloadAsync();
      setRecording(null);

      if (uri) {
        console.log('📤 Sending audio to backend for processing:', uri);
        // Explicitly set waiting state before sending
        setIsWaitingForResponse(true);
        
        // Check connection and language settings
        if (!isConnected) {
          const connected = await connectWithThrottle();
          if (!connected) {
            setIsWaitingForResponse(false);
            Alert.alert('Error', 'Could not connect to translation service');
            setIsProcessing(false);
            return;
          }
        }
        
        if (!languageSettings.language1 || !languageSettings.language2) {
          setIsWaitingForResponse(false);
          console.error('❌ Languages must be set before processing audio');
          Alert.alert('Error', 'Languages must be set before processing audio');
          setIsProcessing(false);
          return;
        }
        
        const success = await TranslationService.processConversationAudio(uri);
        
        if (!success) {
          setIsWaitingForResponse(false);
          console.error('❌ Failed to process audio');
          Alert.alert('Error', 'Failed to process audio. Please try again.');
        }
        
        try {
          await FileSystem.deleteAsync(uri);
          console.log('🗑️ Cleaned up recording file');
        } catch (error) {
          console.warn('⚠️ Failed to cleanup recording file:', error);
        }
      }

      if (isRecording) {
        console.log('🎙️ Starting next recording segment...');
        await startNewRecordingSegment();
      }
    } catch (error) {
      console.error('❌ Error in processCurrentRecording:', error);
      setIsWaitingForResponse(false);
      if (isRecording) {
        console.log('🔄 Attempting to recover by starting new recording...');
        await startNewRecordingSegment();
      }
    } finally {
      setIsProcessing(false);
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
          
          const success = await TranslationService.processConversationAudio(uri);
          if (!success) {
            setIsWaitingForResponse(false);  // Reset on failure
            Alert.alert('Error', 'Failed to process audio. Please try again.');
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
    // Check connection first
    if (!isConnected) {
      await connectWithThrottle();
      
      if (!isConnected) {
        Alert.alert(
          "Connection Error",
          "Not connected to translation service. Please try again.",
          [{ text: "OK" }]
        );
        return;
      }
    }
    
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

  // Add response handling to reset waiting state
  useEffect(() => {
    const handleResponse = () => {
      setIsWaitingForResponse(false);
    };

    // Update the message callback to include our handler
    TranslationService.onTranslation((response: TranslationResponse) => {
      if (response.languageSettings) {
        setLanguageSettings(response.languageSettings);
      }
      
      const utterance: Utterance = {
        id: Date.now().toString(),
        text: response.original.text,
        language: response.original.language,
        translation: response.translated.text,
        audio: response.audio,
        person: response.person,
        timestamp: new Date()
      };
      
      setConversation(prev => [...prev, utterance]);
      handleResponse();
    });

    return () => {
      // No cleanup needed as we're just enhancing the existing callback
    };
  }, []);

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

    // Check connection first
    if (!isConnected) {
      await connectWithThrottle();
      
      if (!isConnected) {
        Alert.alert(
          "Connection Error",
          "Not connected to translation service. Please try again.",
          [{ text: "OK" }]
        );
        return;
      }
    }

    setIsSettingLanguages(true);
    try {
      const success = await TranslationService.setLanguages(selectedLanguage1, selectedLanguage2);
      
      if (success) {
        setShowLanguagePicker(false);
        
        // Update local language settings
        setLanguageSettings({
          language1: selectedLanguage1,
          language2: selectedLanguage2
        });
        
        if (languageSettings.language1 !== selectedLanguage1 || 
            languageSettings.language2 !== selectedLanguage2) {
          setConversation([]);
        }

        if (!languageSettings.language1 || !languageSettings.language2) {
          await startRecording();
        }
      } else {
        Alert.alert(
          "Error",
          "Failed to set languages. Please check your connection.",
          [{ text: "OK" }]
        );
      }
    } catch (error) {
      console.error('Error setting languages:', error);
      Alert.alert(
        'Error',
        'Failed to set languages. Please try again.',
        [{ text: 'OK' }]
      );
    } finally {
      setIsSettingLanguages(false);
    }
  };

  const renderLanguagePicker = () => {
    return (
      <View style={styles.languagePickerContainer}>
        <View style={styles.languagePickerContent}>
          <Text style={styles.modalTitle}>Select Languages</Text>
          
          <Text style={styles.pickerLabel}>Language 1:</Text>
          <Picker
            selectedValue={selectedLanguage1}
            onValueChange={setSelectedLanguage1}
            style={styles.languagePicker}
          >
            <Picker.Item label="Select Language 1" value="" />
            {Object.entries(supportedLanguages).map(([code, info]) => (
              <Picker.Item 
                key={code} 
                label={info.name} 
                value={code}
              />
            ))}
          </Picker>

          <Text style={styles.pickerLabel}>Language 2:</Text>
          <Picker
            selectedValue={selectedLanguage2}
            onValueChange={setSelectedLanguage2}
            style={styles.languagePicker}
          >
            <Picker.Item label="Select Language 2" value="" />
            {Object.entries(supportedLanguages).map(([code, info]) => (
              <Picker.Item 
                key={code} 
                label={info.name} 
                value={code}
              />
            ))}
          </Picker>

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
  };

  const renderLanguageInfo = () => (
    <View style={styles.languageInfoContainer}>
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
      
      {/* Connection Status Indicator */}
      <View style={styles.connectionStatus}>
        <View style={[
          styles.connectionDot,
          isConnected ? styles.connected : styles.disconnected
        ]} />
        <Text style={styles.connectionText}>
          {isConnected ? 'Connected' : 'Disconnected'}
        </Text>
      </View>
      
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
          <MemoizedUtterance key={utterance.id} utterance={utterance} />
        ))}
        {isProcessing && (
          <View style={styles.processingContainer}>
            <ActivityIndicator size="small" color="#FF6B00" />
            <Text style={styles.processingText}>Processing...</Text>
          </View>
        )}
        {isWaitingForResponse && (
          <View style={styles.waitingContainer}>
            <TypingIndicator />
            <Text style={styles.waitingText}>Getting translation...</Text>
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
                isRecording ? styles.recordingActive : {},
                !isConnected ? styles.recordButtonDisabled : {}
              ]}
              onPress={toggleRecording}
              disabled={isProcessing || !isConnected || isWaitingForResponse}
            >
              {isRecording ? (
                <MicOff size={32} color="#fff" />
              ) : (
                <Mic size={32} color={isConnected ? "#fff" : "#ccc"} />
              )}
            </TouchableOpacity>
          )}
        </MotiView>
        <Text style={styles.recordingStatus}>
          {isRecording ? 'Recording...' : 
           isWaitingForResponse ? 'Getting translation...' :
           !isConnected ? 'Connecting...' : 
           'Tap to start conversation'}
        </Text>
      </View>
      
      {/* Language Picker */}
      {showLanguagePicker && renderLanguagePicker()}
    </SafeAreaView>
  );
};

export default ConversationScreen;