import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Dimensions, Platform, Image } from 'react-native';
import { MotiView } from 'moti';

const { width } = Dimensions.get('window');
const CARD_WIDTH = width - 48;
const CARD_ITEM_WIDTH = (CARD_WIDTH / 2) - 8; // Added padding between cards

export const MainFeatures = ({ navigation, homepage }) => {
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Simulate loading delay
    const timer = setTimeout(() => setIsLoading(false), 900);
    return () => clearTimeout(timer);
  }, []);

  const features = [
    {
      id: 1,
      title: 'Detect Your Surroundings',
      image: require('../../assets/images/cat-photo.png'),
      color: '#FFB74D', // warm yellow-orange
      bgColor: 'rgba(255, 183, 77, 0.15)',
      route: '/(main)/camera',
      delay: 100,
    },
    {
      id: 2,
      title: 'Live Voice Translate',
      image: require('../../assets/images/cat-translating.png'),
      color: '#64B5F6', // blue
      bgColor: 'rgba(100, 181, 246, 0.15)',
      route: '/(main)/conversation',
      delay: 200,
    },
    {
      id: 3,
      title: 'Your Saved Detections',
      image: require('../../assets/images/cat-reading.png'),
      color: '#81C784', // green
      bgColor: 'rgba(129, 199, 132, 0.15)',
      route: '/(main)/phrasebook',
      delay: 300,
    },
    {
      id: 4,
      title: 'Translate Text On The Go',
      image: require('../../assets/images/cat-meowing.png'),
      color: '#BA68C8', // purple
      bgColor: 'rgba(186, 104, 200, 0.15)',
      route: '/(main)/text-translate',
      delay: 400,
    },
  ];

  // Skeleton card component
  const SkeletonCard = () => (
    <View style={[styles.cardWrapper]}>
      <View style={[styles.mainFeatureCard, { backgroundColor: '#ececec' }]}> 
        <View style={[styles.iconContainer, { backgroundColor: '#e0e0e0' }]}> 
          <View style={styles.skeletonIcon} />
        </View>
        <View style={{ flex: 1, alignItems: 'flex-start', justifyContent: 'center' }}>
          <View style={styles.skeletonTitle} />
        </View>
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      <Text style={styles.sectionTitle}>Ollie's Picks ⚒️</Text>
      <View style={styles.featureCardWrapper}>
        <View style={styles.grid}>
          {isLoading
            ? Array.from({ length: 4 }).map((_, idx) => <SkeletonCard key={idx} />)
            : features.map((feature) => (
                <MotiView
                  key={feature.id}
                  from={{ opacity: 1, translateY: 0, scale: 1 }}
                  animate={{ opacity: 1, translateY: 0, scale: 1 }}
                  transition={{ type: 'timing', duration: 0 }}
                  style={styles.cardWrapper}
                >
                  <TouchableOpacity
                    style={[styles.mainFeatureCard, { backgroundColor: feature.bgColor }]}
                    onPress={() => navigation.navigate(feature.route)}
                    activeOpacity={0.85}
                  >
                    <View style={[styles.iconContainer, { backgroundColor: feature.color }]}> 
                      <Image source={feature.image} style={styles.catIcon} resizeMode="contain" />
                    </View>
                    <View style={styles.textContainer}>
                      <Text style={[styles.mainFeatureTitle, { color: feature.color }]}>{feature.title}</Text>
                    </View>
                  </TouchableOpacity>
                </MotiView>
              ))}
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginTop: 24,
    paddingHorizontal: 20,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 16,
    marginLeft: 4,
  },
  featureCardWrapper: {
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 340,
    position: 'relative',
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    width: '100%',
    zIndex: 1,
    marginBottom: 40,
  },
  cardWrapper: {
    width: CARD_ITEM_WIDTH-20,
    marginBottom: 16,
    zIndex: 1,
  },
  mainFeatureCard: {
    width: '100%',
    borderRadius: 18,
    padding: 16,
    height: 200,
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#f3f3f3',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.09,
    shadowRadius: 8,
    elevation: 3,
  },
  iconContainer: {
    width: 72,
    height: 72,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.13,
        shadowRadius: 3,
      },
      android: {
        elevation: 3,
      },
    }),
  },
  catIcon: {
    width: 62,
    height: 62,
    borderRadius: 14,
  },
  textContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 6,
  },
  mainFeatureTitle: {
    fontSize: 18,
    fontWeight: '700',
    textAlign: 'center',
    letterSpacing: 0.2,
    
  },
  skeletonIcon: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: '#d6d6d6',
  },
  skeletonTitle: {
    width: 70,
    height: 18,
    borderRadius: 6,
    backgroundColor: '#d6d6d6',
    marginTop: 8,
  },
});