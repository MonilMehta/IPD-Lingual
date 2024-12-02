import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Camera, Mic, Book, MessageSquare } from 'lucide-react-native';

export const MainFeatures = ({ navigation }) => {
  const features = [
    { 
      id: 1, 
      title: "Camera Translate", 
      icon: Camera, 
      color: "#FF6B00",
      route: 'camera',
    },
    { 
      id: 2, 
      title: "Voice Translate", 
      icon: Mic, 
      color: "#F44336",
      route: 'VoiceTranslation',
    },
    { 
      id: 3, 
      title: "Phrasebook", 
      icon: Book, 
      color: "#2196F3",
      route: 'Phrasebook',
    },
    { 
      id: 4, 
      title: "Practice", 
      icon: MessageSquare, 
      color: "#4CAF50",
      route: 'Conversation',
    }
  ];

  return (
    <View style={styles.mainFeaturesGrid}>
      {features.map((feature) => (
        <TouchableOpacity
          key={feature.id}
          style={[styles.mainFeatureCard, { backgroundColor: feature.color }]}
          onPress={() => navigation.navigate(feature.route)}
        >
          <feature.icon size={28} color="white" />
          <Text style={styles.mainFeatureTitle}>{feature.title}</Text>
        </TouchableOpacity>
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  mainFeaturesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    paddingHorizontal: 6,
    marginBottom:-24,
    marginTop:12,
  },
  mainFeatureCard: {
    width: '48%',
    aspectRatio: 1,
    borderRadius: 16,
    padding: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  mainFeatureTitle: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '600',
    marginTop: 12,
    textAlign: 'center',
  },
});