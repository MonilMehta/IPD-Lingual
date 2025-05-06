import React from 'react';
import { View, Text, StyleSheet, FlatList, Dimensions } from 'react-native';

const { width } = Dimensions.get('window');
const CARD_WIDTH = width * 0.7;

const GuidebookSection = ({ title, data }) => {
  return (
    <View style={styles.sectionContainer}>
      <Text style={styles.sectionTitle}>{formatTitle(title)}</Text>
      <FlatList
        data={data}
        keyExtractor={(_, idx) => idx.toString()}
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.carouselContent}
        renderItem={({ item }) => (
          <View style={styles.card}>
            <Text style={styles.label1}>{item.label2}</Text>
            <Text style={styles.label2}>{item.label1}</Text>
          </View>
        )}
      />
    </View>
  );
};

function formatTitle(key) {
  // Convert snake_case or camelCase to Title Case
  return key
    .replace(/_/g, ' ')
    .replace(/\b\w/g, l => l.toUpperCase());
}

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
    minHeight: 110,
    backgroundColor: '#fff',
    borderRadius: 18,
    marginRight: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
    justifyContent: 'center',
  },
  label1: {
    fontSize: 18,
    fontWeight: '600',
    color: '#FF6B00',
    marginBottom: 6,
  },
  label2: {
    fontSize: 16,
    color: '#333',
  },
});

export default GuidebookSection;
