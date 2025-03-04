import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, SafeAreaView, StatusBar } from 'react-native';
import { Audio } from 'expo-av';
import { MotiView } from 'moti';
import { Mic, MicOff, ArrowLeft } from 'lucide-react-native';
import { useNavigation } from 'expo-router';
import { TranslationService } from '../services/TranslationService';

interface Utterance {
  id: string;
  speaker: string;
  text: string;
  language: string;
  timestamp: Date;
}

const ConversationScreen: React.FC = () => {
  const navigation = useNavigation();
  const [recording, setRecording] = useState<Audio.Recording | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [conversation, setConversation] = useState<Utterance[]>([]);
  const [detectedLanguages, setDetectedLanguages] = useState<{[key: string]: string}>({});
  const scrollViewRef = useRef<ScrollView>(null);
  const recordingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    (async () => {
      await Audio.requestPermissionsAsync();
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
        shouldDuckAndroid: true,
        playThroughEarpieceAndroid: false,
      });
    })();

    return () => {
      stopRecording();
    };
  }, []);

  useEffect(() => {
    if (scrollViewRef.current) {
      setTimeout(() => {
        scrollViewRef.current?.scrollToEnd({ animated: true });
      }, 100);
    }
  }, [conversation]);

  const startRecording = async () => {
    try {
      const { recording } = await Audio.Recording.createAsync(
        Audio.RecordingOptionsPresets.HIGH_QUALITY
      );
      setRecording(recording);
      setIsRecording(true);

      // Schedule periodic audio processing
      scheduleAudioProcessing();

    } catch (err) {
      console.error('Failed to start recording', err);
    }
  };

  const scheduleAudioProcessing = () => {
    // Process audio every 8 seconds
    recordingTimeoutRef.current = setInterval(processAudioChunk, 8000);
  };

  const processAudioChunk = async () => {
    if (!recording) return;
    
    setIsProcessing(true);
    
    try {
      // Stop current recording to process it
      await recording.stopAndUnloadAsync();
      const uri = recording.getURI();
      
      if (!uri) {
        throw new Error('No recording URI available');
      }

      // Process the audio with backend
      const result = await TranslationService.processConversationAudio(uri);
      
      if (result && result.speaker && result.text) {
        const newUtterance: Utterance = {
          id: Date.now().toString(),
          speaker: result.speaker,
          text: result.text,
          language: result.language,
          timestamp: new Date()
        };
        
        setConversation(prev => [...prev, newUtterance]);
        
        // Update detected languages if new
        if (result.language && result.speaker) {
          setDetectedLanguages(prev => ({
            ...prev,
            [result.speaker]: result.language
          }));
        }
      }
      
      // Start a new recording if still in recording state
      if (isRecording) {
        const { recording: newRecording } = await Audio.Recording.createAsync(
          Audio.RecordingOptionsPresets.HIGH_QUALITY
        );
        setRecording(newRecording);
      }
      
    } catch (error) {
      console.error('Error processing audio:', error);
    } finally {
      setIsProcessing(false);
    }
  };

  const stopRecording = async () => {
    if (recordingTimeoutRef.current) {
      clearInterval(recordingTimeoutRef.current);
      recordingTimeoutRef.current = null;
    }
    
    if (recording) {
      await recording.stopAndUnloadAsync();
      await processAudioChunk(); // Process final chunk
    }
    
    setRecording(null);
    setIsRecording(false);
  };

  const toggleRecording = async () => {
    if (isRecording) {
      await stopRecording();
    } else {
      await startRecording();
    }
  };

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
        <Text style={styles.headerTitle}>Conversation Translator</Text>
        <View style={styles.placeholder} />
      </View>
      
      {/* Language Info */}
      <View style={styles.languageInfoContainer}>
        {Object.entries(detectedLanguages).length > 0 ? (
          Object.entries(detectedLanguages).map(([speaker, language], index) => (
            <MotiView 
              key={speaker}
              from={{ opacity: 0, translateY: 10 }}
              animate={{ opacity: 1, translateY: 0 }}
              transition={{ type: 'timing', duration: 500, delay: index * 300 }}
              style={styles.languageCard}
            >
              <Text style={styles.speakerLabel}>{speaker}</Text>
              <Text style={styles.languageLabel}>{language}</Text>
            </MotiView>
          ))
        ) : (
          <Text style={styles.instructionText}>
            Start speaking to detect languages
          </Text>
        )}
      </View>
      
      {/* Conversation Area */}
      <ScrollView
        ref={scrollViewRef}
        style={styles.conversationContainer}
        contentContainerStyle={styles.conversationContent}
      >
        {conversation.map((utterance, index) => (
          <MotiView
            key={utterance.id}
            from={{ opacity: 0, translateY: 20 }}
            animate={{ opacity: 1, translateY: 0 }}
            transition={{ type: 'timing', duration: 300 }}
            style={[
              styles.utteranceContainer,
              { alignSelf: utterance.speaker === 'Person 1' ? 'flex-start' : 'flex-end' }
            ]}
          >
            <View style={[
              styles.utteranceBubble,
              utterance.speaker === 'Person 1' ? styles.bubbleLeft : styles.bubbleRight
            ]}>
              <Text style={styles.utteranceSpeaker}>{utterance.speaker}</Text>
              <Text style={styles.utteranceText}>{utterance.text}</Text>
              <Text style={styles.utteranceTime}>
                {utterance.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </Text>
            </View>
          </MotiView>
        ))}
        {isProcessing && (
          <View style={styles.processingContainer}>
            <ActivityIndicator size="small" color="#FF6B00" />
            <Text style={styles.processingText}>Processing...</Text>
          </View>
        )}
      </ScrollView>
      
      {/* Recording Button */}
      <View style={styles.controlsContainer}>
        <MotiView
          from={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: 'timing', duration: 300 }}
        >
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
        </MotiView>
        <Text style={styles.recordingStatus}>
          {isRecording ? 'Tap to stop recording' : 'Tap to start conversation'}
        </Text>
      </View>
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
  placeholder: {
    width: 40,
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
  instructionText: {
    fontSize: 16,
    color: '#888',
    textAlign: 'center',
    paddingVertical: 12,
  },
  conversationContainer: {
    flex: 1,
    padding: 16,
  },
  conversationContent: {
    paddingBottom: 24,
  },
  utteranceContainer: {
    marginVertical: 6,
    maxWidth: '80%',
  },
  utteranceBubble: {
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 12,
    minWidth: 120,
  },
  bubbleLeft: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 4,
  },
  bubbleRight: {
    backgroundColor: '#FF6B00',
    borderTopRightRadius: 4,
  },
  utteranceSpeaker: {
    fontSize: 12,
    fontWeight: '500',
    marginBottom: 4,
    color: '#555',
  },
  utteranceText: {
    fontSize: 16,
    color: '#333',
    marginBottom: 4,
  },
  utteranceTime: {
    fontSize: 10,
    color: '#999',
    alignSelf: 'flex-end',
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
});

export default ConversationScreen;
