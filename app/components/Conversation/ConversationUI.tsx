import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { MotiView } from 'moti';
import { Ionicons } from '@expo/vector-icons';
import { Volume2, Volume } from 'lucide-react-native';
import styles from '../../styles/conversation_styles';

// Wave animation component
export const WaveAnimation = () => (
  <View style={styles.waveContainer}>
    {[0, 1, 2, 3, 4].map((i) => (
      <MotiView
        key={i}
        style={styles.waveLine}
        from={{ height: 5, opacity: 0.3 }}
        animate={{ height: [5, 20, 5], opacity: [0.3, 1, 0.3] }}
        transition={{ type: 'timing', duration: 1000, loop: true, delay: i * 150 }}
      />
    ))}
  </View>
);

// Typing indicator animation
export const TypingIndicator = () => (
  <View style={styles.typingContainer}>
    {[0, 1, 2].map((i) => (
      <MotiView
        key={i}
        style={styles.typingDot}
        from={{ opacity: 0.3, scale: 0.8 }}
        animate={{ opacity: [0.3, 1, 0.3], scale: [0.8, 1, 0.8] }}
        transition={{ type: 'timing', duration: 1000, loop: true, delay: i * 300 }}
      />
    ))}
  </View>
);

// Pulsing animation component
export const PulsingCircle = ({ color = '#FF6B00' }) => (
  <MotiView
    style={[styles.pulsingCircle, { backgroundColor: color }]}
    from={{ opacity: 0.8, scale: 1 }}
    animate={{ opacity: 0.2, scale: 1.3 }}
    transition={{ type: 'timing', duration: 1500, loop: true }}
  />
);

// Utterance interface
export interface Utterance {
  id: string;
  text: string;
  language: string;
  translation?: string | null;
  audio?: string;
  timestamp: Date;
  person: string;
}

// Memoized utterance bubble
export const MemoizedUtterance = React.memo(
  ({ utterance, languageSettings, supportedLanguages, playAudio, speakText, isSpeaking, speakingUtteranceId }) => (
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
          <View style={styles.translationSection}>
            <Text style={styles.translationText}>{utterance.translation}</Text>
            <View style={styles.actionButtons}>
              {utterance.audio && (
                <TouchableOpacity 
                  style={styles.actionButton}
                  onPress={() => playAudio(utterance.audio!)}
                >
                  <Ionicons name="play" size={16} color="#FF6B00" />
                </TouchableOpacity>
              )}
              <TouchableOpacity 
                style={[
                  styles.actionButton, 
                  isSpeaking && speakingUtteranceId === utterance.id ? styles.activeButton : {}
                ]}
                onPress={() => speakText(utterance.translation!, utterance.id)}
              >
                {isSpeaking && speakingUtteranceId === utterance.id ? 
                  <Volume2 size={16} color="#FF6B00" /> : 
                  <Volume size={16} color="#FF6B00" />
                }
              </TouchableOpacity>
            </View>
          </View>
        )}
      </View>
    </View>
  )
);
