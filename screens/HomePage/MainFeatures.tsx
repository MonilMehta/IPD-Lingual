import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Dimensions, Platform, Image } from 'react-native';
import { MotiView } from 'moti';

const { width } = Dimensions.get('window');
const CARD_WIDTH = width - 48;

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
      title: 'Camera Translate',
      image: require('../../assets/images/cat-photo.png'),
      color: '#FFB74D', // warm yellow-orange
      bgColor: 'rgba(255, 183, 77, 0.15)',
      route: '/(main)/camera',
      delay: 100,
    },
    {
      id: 2,
      title: 'Voice Translate',
      image: require('../../assets/images/cat-translating.png'),
      color: '#64B5F6', // blue
      bgColor: 'rgba(100, 181, 246, 0.15)',
      route: '/(main)/conversation',
      delay: 200,
    },
    {
      id: 3,
      title: 'Saved Phrases',
      image: require('../../assets/images/cat-reading.png'),
      color: '#81C784', // green
      bgColor: 'rgba(129, 199, 132, 0.15)',
      route: '/(main)/phrasebook',
      delay: 300,
    },
    {
      id: 4,
      title: 'Quick Translate',
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
      <Text style={styles.sectionTitle}>Main Features</Text>
      <View style={styles.featureCardWrapper}>
        <View style={styles.orangeBgAccent} />
        <View style={styles.grid}>
          {isLoading
            ? Array.from({ length: 4 }).map((_, idx) => <SkeletonCard key={idx} />)
            : features.map((feature) => (
                <MotiView
                  key={feature.id}
                  from={{ opacity: 1, translateY: 0, scale: 1 }} // No animation when loaded
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
                    <View style={{ flex: 1, alignItems: 'flex-start', justifyContent: 'center' }}>
                      <Text style={styles.mainFeatureTitle}>{feature.title}</Text>
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
    marginVertical: 24,
    paddingHorizontal: 4,
    marginBottom: 100,
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
  mascotBgWrapper: {
    display: 'none', // mascot background removed
  },
  mascotBg: {
    display: 'none',
  },
  orangeBgAccent: {
    // Remove or soften the background effect
    // backgroundColor: 'rgba(255, 140, 0, 0.13)',
    // Option 1: Remove completely
    display: 'none',
    // Option 2: To soften, uncomment below and adjust alpha
    // backgroundColor: 'rgba(255, 140, 0, 0.05)',
    // zIndex: 0,
    // position: 'absolute',
    // left: -40,
    // top: 60,
    // width: 320,
    // height: 180,
    // borderRadius: 90,
    // transform: [{ rotate: '-8deg' }],
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-around',
    width: '100%',
    zIndex: 1,
    marginBottom: 40, // Added margin for scroll spacing
  },
  cardWrapper: {
    width: (CARD_WIDTH / 2),
    marginBottom: 12,
    zIndex: 1,
  },
  mainFeatureCard: {
    width: '100%',
    borderRadius: 18,
    padding: 18,
    height: 140,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#FF9800',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.09,
    shadowRadius: 8,
    elevation: 3,
    marginBottom: 8,
    backgroundColor: '#FFF3E0',
  },
  iconContainer: {
    width: 72,
    height: 72,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 18,
    ...Platform.select({
      ios: {
        shadowColor: '#FF9800',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.13,
        shadowRadius: 3,
      },
      android: {
        elevation: 3,
        shadowColor: '#FF9800',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.13,
        shadowRadius: 3,
      },
    }),
  },
  catIcon: {
    width: 62, // Increased size
    height: 62, // Increased size
    borderRadius: 14,
  },
  mainFeatureTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FF6B00',
    letterSpacing: 0.2,
  },
  mainFeatureDescription: {
    fontSize: 13,
    color: '#666',
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