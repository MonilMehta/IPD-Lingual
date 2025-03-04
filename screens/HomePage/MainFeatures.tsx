import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Dimensions, Platform } from 'react-native';
import { Camera, Mic, Book, MessageSquare } from 'lucide-react-native';
import { MotiView } from 'moti';

const { width } = Dimensions.get('window');
const CARD_WIDTH = (width - 60) / 2;

export const MainFeatures = ({ navigation }) => {
  console.log('MainFeatures rendered');
  const features = [
    { 
      id: 1, 
      title: "Camera Translate", 
      description: "Scan text to translate",
      icon: Camera, 
      color: "#FF6B00",
      bgColor: "rgba(255, 107, 0, 0.1)",
      route: '/(main)/camera',
      delay: 100,
    },
    { 
      id: 2, 
      title: "Voice Translate", 
      description: "Speak to translate",
      icon: Mic, 
      color: "#F44336",
      bgColor: "rgba(244, 67, 54, 0.1)",
      route: '/(main)/voice',
      delay: 200,
    },
    { 
      id: 3, 
      title: "Phrasebook", 
      description: "Useful expressions",
      icon: Book, 
      color: "#2196F3",
      bgColor: "rgba(33, 150, 243, 0.1)",
      route: '/(main)/phrasebook',
      delay: 300,
    },
    { 
      id: 4, 
      title: "Practice", 
      description: "Practice conversations",
      icon: MessageSquare, 
      color: "#4CAF50",
      bgColor: "rgba(76, 175, 80, 0.1)",
      route: '/(main)/conversation',
      delay: 400,
    }
  ];

  return (
    <View style={styles.container}>
      <Text style={styles.sectionTitle}>Main Features</Text>
      <View style={styles.mainFeaturesGrid}>
        {features.map((feature) => (
          <MotiView
            key={feature.id}
            from={{ opacity: 0, translateY: 20 }}
            animate={{ opacity: 1, translateY: 0 }}
            transition={{ type: 'timing', duration: 600, delay: feature.delay }}
            style={styles.cardWrapper}
          >
            <TouchableOpacity
              style={[styles.mainFeatureCard, { backgroundColor: feature.bgColor }]}
              onPress={() => navigation.navigate(feature.route)}
              activeOpacity={0.7}
            >
              <View style={[styles.iconContainer, { backgroundColor: feature.color }]}>
                <feature.icon size={24} color="white" />
              </View>
              <Text style={styles.mainFeatureTitle}>{feature.title}</Text>
              <Text style={styles.mainFeatureDescription}>{feature.description}</Text>
            </TouchableOpacity>
          </MotiView>
        ))}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginVertical: 24,
    paddingHorizontal: 4,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 16,
    marginLeft: 4,
  },
  mainFeaturesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  cardWrapper: {
    width: CARD_WIDTH,
    marginBottom: 16,
  },
  mainFeatureCard: {
    width: '100%',
    borderRadius: 16,
    padding: 16,
    height: 160,
    // ...Platform.select({
    //   ios: {
    //     shadowColor: '#000',
    //     shadowOffset: { width: 0, height: 1 },
    //     shadowOpacity: 0.05,
    //     shadowRadius: 5,
    //   },
    //   android: {
    //     elevation: 1,
        
    //   },
    //   default: {
    //     // For web or other platforms
    //     boxShadow: '0px 2px 8px rgba(0, 0, 0, 0.05)',
    //   },
    // }),
    // borderWidth: 0,  // Remove any border
  },
  iconContainer: {
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 3,
      },
      android: {
        elevation: 3,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 3,
      },
    }),
  },
  mainFeatureTitle: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 6,
    color: '#333',
  },
  mainFeatureDescription: {
    fontSize: 13,
    color: '#666',
  }
});