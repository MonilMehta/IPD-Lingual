import React from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Image, Dimensions } from 'react-native';
import { useRouter } from 'expo-router';

const { width } = Dimensions.get('window');
const CARD_WIDTH = width * 0.7;

const GUIDE_IMAGES = {
  'local_markets': require('../assets/images/market.png'),
  'restaurant': require('../assets/images/restaurant.png'),
  'transport': require('../assets/images/transport.png'),
  'kids_guide': require('../assets/images/kids.jpg'),
  'scam_save': require('../assets/images/scam.jpg'),
};

const GUIDE_TITLES = {
  'local_markets': 'Local Markets Guide',
  'restaurant': 'Restaurant Guide',
  'transport': 'Transport Guide',
  'kids_guide': 'Kids Guide',
  'scam_save': 'Scam Safety Guide',
};

const GuidebookCarousel = ({ guidebook }) => {
  const router = useRouter();
  const guideKeys = ['local_markets', 'restaurant', 'transport', 'kids_guide', 'scam_save'];
  const guides = guideKeys.map(key => ({
    key,
    title: GUIDE_TITLES[key],
    image: GUIDE_IMAGES[key],
    data: guidebook[key],
  }));

  return (
    <View style={styles.sectionContainer}>
      <Text style={styles.sectionTitle}>Tourist Guides</Text>
      <FlatList
        data={guides}
        keyExtractor={item => item.key}
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.carouselContent}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={styles.card}
            onPress={() => router.push({ pathname: '/(main)/guide', params: { guideKey: item.key } })}
            activeOpacity={0.9}
          >
            <Image source={item.image} style={styles.image} />
            <View style={styles.overlay}>
              <Text style={styles.cardTitle}>{item.title}</Text>
            </View>
          </TouchableOpacity>
        )}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  sectionContainer: {
    marginTop: 28,
    marginBottom: 8,
    paddingLeft: 16,
  },
  sectionTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#222',
    marginBottom: 12,
  },
  carouselContent: {
    paddingRight: 16,
  },
  card: {
    width: CARD_WIDTH,
    height: 180,
    backgroundColor: '#fff',
    borderRadius: 18,
    marginRight: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
    justifyContent: 'flex-end',
  },
  image: {
    width: '100%',
    height: '100%',
    position: 'absolute',
    resizeMode: 'cover',
  },
  overlay: {
    backgroundColor: 'rgba(0,0,0,0.35)',
    padding: 16,
    borderBottomLeftRadius: 18,
    borderBottomRightRadius: 18,
  },
  cardTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
  },
});

export default GuidebookCarousel;
