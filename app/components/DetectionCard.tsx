import React from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity } from 'react-native';
import * as Speech from 'expo-speech';
import { Colors } from '../constants/Colors';

interface DetectionCardProps {
  label: string;
  translatedLabel: string;
  timestamp: string;
  mascot?: any;
}

const DetectionCard: React.FC<DetectionCardProps> = ({ label, translatedLabel, timestamp, mascot }) => {
  const handleSpeak = () => {
    Speech.speak(translatedLabel);
  };

  return (
    <View style={styles.card}>
      <Image source={mascot} style={styles.mascot} />
      <View style={{ flex: 1 }}>
        <Text style={styles.label}>{label}</Text>
        <View style={styles.row}>
          <TouchableOpacity onPress={handleSpeak} style={styles.speakButton}>
            <Text style={styles.speakText}>🔊</Text>
          </TouchableOpacity>
          <Text style={styles.translatedLabel}>{translatedLabel}</Text>
        </View>
        <Text style={styles.timestamp}>{new Date(timestamp).toLocaleString()}</Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.light.background,
    borderRadius: 12,
    padding: 16,
    marginVertical: 8,
    marginHorizontal: 16,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 3,
  },
  mascot: {
    width: 48,
    height: 48,
    borderRadius: 24,
    marginRight: 12,
  },
  label: {
    fontSize: 18,
    fontWeight: 'bold',
    color: Colors.light.text,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  speakButton: {
    marginRight: 8,
  },
  speakText: {
    fontSize: 20,
  },
  translatedLabel: {
    fontSize: 16,
    color: Colors.light.tint,
  },
  timestamp: {
    fontSize: 12,
    color: '#888',
    marginTop: 8,
    textAlign: 'right',
  },
});

export default DetectionCard;
