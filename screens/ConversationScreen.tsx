import React, { useState, useEffect, useRef, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, SafeAreaView, StatusBar, Alert, AppState, AppStateStatus } from 'react-native';
import { Audio } from 'expo-av';
import { Picker } from '@react-native-picker/picker';
import { MotiView } from 'moti';
import { Mic, MicOff, ArrowLeft, Languages } from 'lucide-react-native';
import { useNavigation } from 'expo-router';
import * as FileSystem from 'expo-file-system';
import { 
  TranslationService, 
  TranslationResponse, 
  ConfigResponse, 
  InitResponse,
  SupportedLanguages,
  LanguageInfo,
  LanguageSettings 
} from '../services/TranslationService';
import { Ionicons } from '@expo/vector-icons';

// Improved wave animation component
const WaveAnimation = () => {
  return (
    <View style={styles.waveContainer}>
      {[0, 1, 2, 3, 4].map((i) => (
        <MotiView
          key={i}
          style={styles.waveLine}
          from={{ height: 5, opacity: 0.3 }}
          animate={{ 
            height: [5, 20, 5],
            opacity: [0.3, 1, 0.3]
          }}
          transition={{ 
            type: 'timing',
            duration: 1000,
            loop: true,
            delay: i * 150,
          }}
        />
      ))}
    </View>
  );
};

interface Utterance {
  id: string;
  text: string;
  language: string;
  translation?: string | null;
  audio?: string;
  timestamp: Date;
  person: string;
}

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
    setIsWaitingForResponse(true);
    try {
      console.log('⏹️ Stopping current recording segment');
      const uri = recording.getURI();
      await recording.stopAndUnloadAsync();
      setRecording(null);

      if (uri) {
        console.log('📤 Sending audio to backend for processing:', uri);
        // Ensure we're connected before sending audio
        if (!isConnected) {
          await connectWithThrottle();
        }
        
        // Check if language settings are set
        if (!languageSettings.language1 || !languageSettings.language2) {
          console.error('❌ Languages must be set before processing audio');
          Alert.alert('Error', 'Languages must be set before processing audio');
          setIsWaitingForResponse(false);
          return;
        }
        
        const success = await TranslationService.processConversationAudio(uri);
        if (!success) {
          console.error('❌ Failed to process audio');
          setIsWaitingForResponse(false);
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
          await TranslationService.processConversationAudio(uri);
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

  const MemoizedUtterance = React.memo(({ utterance }: { utterance: Utterance }) => (
    <View style={[
      styles.utteranceContainer,
      { alignSelf: utterance.person === '1' ? 'flex-start' : 'flex-end' }
    ]}>
      <Text style={styles.utteranceSpeaker}>
        {utterance.person === '1' && languageSettings?.language1 && supportedLanguages[languageSettings.language1]
          ? supportedLanguages[languageSettings.language1].name || 'Person 1'
          : utterance.person === '2' && languageSettings?.language2 && supportedLanguages[languageSettings.language2]
          ? supportedLanguages[languageSettings.language2].name || 'Person 2'
          : utterance.person === '1' ? 'Person 1' : 'Person 2'}
      </Text>
      <View style={[
        styles.utteranceContent,
        utterance.person === '1' ? styles.person1Bubble : styles.person2Bubble
      ]}>
        <Text style={styles.utteranceText}>{utterance.text}</Text>
        {utterance.translation && (
          <Text style={styles.translationText}>{utterance.translation}</Text>
        )}
        {utterance.audio && (
          <TouchableOpacity 
            style={styles.playButton}
            onPress={() => playAudio(utterance.audio!)}
          >
            <Ionicons name="play" size={16} color="#fff" />
          </TouchableOpacity>
        )}
      </View>
    </View>
  ));

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
            <WaveAnimation />
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
              <WaveAnimation />
              <Text style={styles.waitingText}>Listening...</Text>
            </View>
          ) : (
            <TouchableOpacity
              style={[
                styles.recordButton,
                isRecording ? styles.recordingActive : {}
              ]}
              onPress={toggleRecording}
              disabled={isProcessing}
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
          {isRecording ? 'Recording...' : 'Tap to start conversation'}
        </Text>
      </View>
      
      {/* Language Picker */}
      {showLanguagePicker && renderLanguagePicker()}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f8f8',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  languageButton: {
    padding: 8,
  },
  languageInfoContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: 12,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  languageCard: {
    backgroundColor: '#f0f0f0',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 12,
    minWidth: 120,
    alignItems: 'center',
  },
  speakerLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#555',
    marginBottom: 2,
  },
  languageLabel: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  conversationContainer: {
    flex: 1,
    padding: 16,
  },
  conversationContent: {
    paddingBottom: 24,
  },
  processingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 16,
  },
  processingText: {
    fontSize: 14,
    color: '#666',
    marginLeft: 8,
  },
  controlsContainer: {
    alignItems: 'center',
    paddingVertical: 24,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#eee',
  },
  recordButton: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: '#FF6B00',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#FF6B00',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
    marginBottom: 12,
  },
  recordingActive: {
    backgroundColor: '#F44336',
  },
  recordingStatus: {
    fontSize: 14,
    color: '#666',
  },
  languagePickerContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  languagePickerContent: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingBottom: 20,
  },
  languagePicker: {
    width: '100%',
    height: 200,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    textAlign: 'center',
    paddingVertical: 16,
  },
  pickerButtonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    marginTop: 10,
  },
  pickerButton: {
    padding: 12,
    borderRadius: 10,
    minWidth: 120,
    alignItems: 'center',
  },
  pickerButtonText: {
    color: '#333',
    fontWeight: '600',
  },
  pickerButtonConfirm: {
    backgroundColor: '#FF6B00',
  },
  pickerButtonTextConfirm: {
    color: '#fff',
    fontWeight: '600',
  },
  pickerButtonDisabled: {
    opacity: 0.5,
  },
  pickerLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginLeft: 20,
    marginTop: 10,
    marginBottom: 5,
  },
  utteranceContainer: {
    marginVertical: 6,
    maxWidth: '80%',
  },
  utteranceContent: {
    padding: 12,
  },
  utteranceSpeaker: {
    fontSize: 14,
    fontWeight: '500',
    color: '#555',
    marginBottom: 4,
  },
  utteranceText: {
    fontSize: 16,
    color: '#333',
    marginBottom: 4,
  },
  translationText: {
    fontSize: 17, // Increased from 14 to 17
    color: '#444', // Made slightly darker for better readability
    fontWeight: '500', // Added medium font weight for emphasis
    fontStyle: 'italic',
    marginTop: 6, // Increased from 4 to 6
    marginBottom: 6, // Increased from 4 to 6
  },
  playButton: {
    marginTop: 8,
    padding: 4,
    borderRadius: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
  },
  tapToChange: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
  },
  connectionStatus: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  connectionDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 6,
  },
  connected: {
    backgroundColor: '#4CAF50', // Green
  },
  disconnected: {
    backgroundColor: '#F44336', // Red
  },
  connectionText: {
    fontSize: 12,
    color: '#666',
  },
  person1Bubble: {
    backgroundColor: '#E3F2FD', // Light blue for person 1
    borderRadius: 12,
    borderTopLeftRadius: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  person2Bubble: {
    backgroundColor: '#E8F5E9', // Light green for person 2
    borderRadius: 12,
    borderTopRightRadius: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  waveAnimationContainer: {
    width: 70,
    height: 70,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 107, 0, 0.1)',
    borderRadius: 35,
    marginBottom: 12,
  },
  waveContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    height: 30,
    width: 40,
  },
  waveLine: {
    width: 3,
    backgroundColor: '#FF6B00',
    borderRadius: 3,
    marginHorizontal: 1,
  },
  waitingText: {
    fontSize: 12,
    color: '#FF6B00',
    marginTop: 5,
  },
  waitingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 16,
    padding: 10,
    backgroundColor: 'rgba(255, 107, 0, 0.05)',
    borderRadius: 20,
  },
  recordButtonDisabled: {
    backgroundColor: '#cccccc',
  },
});

export default ConversationScreen;