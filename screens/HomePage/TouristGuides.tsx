import React, { useRef } from 'react';
import { View, Text, TouchableOpacity, ScrollView, StyleSheet, Dimensions, Image } from 'react-native';
import { Map, BookOpen, Globe, ChevronRight,Bus,Utensils,Store, } from 'lucide-react-native';
import { MotiView } from 'moti';
import { LinearGradient } from 'expo-linear-gradient';

const { width } = Dimensions.get('window');
const CARD_WIDTH = width * 0.7;

export const TouristGuides = ({ navigation }) => {
  const scrollViewRef = useRef(null);
  console.log('TouristGuides rendered');
  
  const guides = [
    {
      id: 1,
      title: "Local Markets Guide",
      description: "Essential phrases for shopping and bargaining at local markets",
      icon: Map,
      image: require('../../assets/images/market.png'), // You'll need to add these images
      color: ['rgba(255, 107, 0, 0.8)', 'rgba(255, 107, 0, 0.4)'],
    },
    {
      id: 2,
      title: "Restaurant Guide",
      description: "Food & dining vocabulary to enhance your culinary experiences",
      icon: BookOpen,
      image: require('../../assets/images/restaurant.png'),
      color: ['rgba(33, 150, 243, 0.8)', 'rgba(33, 150, 243, 0.4)'],
    },
    {
      id: 3,
      title: "Transport Guide",
      description: "Getting around the city with confidence using local transport",
      icon: Globe,
      image: require('../../assets/images/transport.png'),
      color: ['rgba(76, 175, 80, 0.8)', 'rgba(76, 175, 80, 0.4)'],
    }
  ];

  return (
    <MotiView 
      style={styles.guidesSection}
      from={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ type: 'timing', duration: 800, delay: 200 }}
    >
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Tourist Guides</Text>
        <TouchableOpacity 
          style={styles.seeAllButtonContainer}
          onPress={() => navigation.navigate('/(main)/allguides')}
        >
          <Text style={styles.seeAllButton}>See All</Text>
          <ChevronRight size={16} color="#FF6B00" />
        </TouchableOpacity>
      </View>
      
      <MotiView
        from={{ translateX: 20 }}
        animate={{ translateX: 0 }}
        transition={{ type: 'timing', duration: 600 }}
      >
        <ScrollView 
          ref={scrollViewRef}
          horizontal 
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.scrollViewContent}
          snapToInterval={CARD_WIDTH + 16}
          decelerationRate="fast"
        >
          {guides.map((guide, index) => (
            <MotiView
              key={guide.id}
              from={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ type: 'timing', duration: 800, delay: 300 + index * 100 }}
            >
              <TouchableOpacity 
                style={styles.guideCard}
                onPress={() => navigation.navigate('/(main)/guide', { guideId: guide.id })}
                activeOpacity={0.9}
              >
                <Image source={guide.image} style={styles.guideImage} />
                <LinearGradient
                  colors={guide.color}
                  style={styles.gradientOverlay}
                >
                  <View style={styles.iconContainer}>
                    <guide.icon size={24} color="#FFF" />
                  </View>
                  <Text style={styles.guideTitle}>{guide.title}</Text>
                  <Text style={styles.guideDescription}>{guide.description}</Text>
                </LinearGradient>
              </TouchableOpacity>
            </MotiView>
          ))}
        </ScrollView>
      </MotiView>
      
      <View style={styles.dotsContainer}>
        {guides.map((_, index) => (
          <TouchableOpacity
            key={index}
            style={[styles.dot, index === 0 && styles.activeDot]}
            onPress={() => {
              scrollViewRef.current?.scrollTo({
                x: index * (CARD_WIDTH + 16),
                animated: true,
              });
            }}
          />
        ))}
      </View>
    </MotiView>
  );
};

const styles = StyleSheet.create({
  guidesSection: {
    marginBottom: 28,
    paddingHorizontal: 4,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
    paddingHorizontal: 4,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
  },
  seeAllButtonContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  seeAllButton: {
    color: '#FF6B00',
    fontSize: 14,
    fontWeight: '600',
    marginRight: 2,
  },
  scrollViewContent: {
    paddingLeft: 4,
    paddingRight: 20,
  },
  guideCard: {
    width: CARD_WIDTH,
    height: 180,
    marginRight: 16,
    borderRadius: 20,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  guideImage: {
    width: '100%',
    height: '100%',
    position: 'absolute',
  },
  gradientOverlay: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    height: '100%',
    padding: 20,
    justifyContent: 'flex-end',
  },
  iconContainer: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  guideTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FFF',
    marginBottom: 6,
  },
  guideDescription: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.9)',
  },
  dotsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 16,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#ccc',
    marginHorizontal: 4,
  },
  activeDot: {
    backgroundColor: '#FF6B00',
    width: 16,
  },
});