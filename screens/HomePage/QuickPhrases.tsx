import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useCommonPhrases } from '../../hooks/useCommonPhrases';

export const QuickPhrases = ({ navigation }) => {
  const { phrases } = useCommonPhrases();

  return (
    <View style={styles.quickPhrasesSection}>
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Quick Phrases</Text>
        <TouchableOpacity onPress={() => navigation.navigate('Phrasebook')}>
          <Text style={styles.seeAllButton}>See All</Text>
        </TouchableOpacity>
      </View>
      <View style={styles.phrasesGrid}>
        {phrases.slice(0, 6).map(item => (
          <TouchableOpacity 
            key={item.id} 
            style={styles.phraseCard}
            onPress={() => navigation.navigate('Phrasebook', { category: item.category })}
          >
            <View style={styles.phraseContent}>
              <Text style={styles.phraseText}>{item.phrase}</Text>
              <Text style={styles.translationText}>{item.translation}</Text>
            </View>
            <Text style={styles.categoryTag}>{item.category}</Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  quickPhrasesSection: {
    marginBottom: 24,
    paddingHorizontal: 10,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
  },
  seeAllButton: {
    color: '#FF6B00',
    fontSize: 14,
    fontWeight: '600',
  },
  phrasesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  phraseCard: {
    backgroundColor: '#FFF',
    borderRadius: 12,
    padding: 16,
    width: '48%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  phraseContent: {
    marginBottom: 8,
  },
  phraseText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  translationText: {
    fontSize: 13,
    color: '#666',
    fontStyle: 'italic',
  },
  categoryTag: {
    fontSize: 12,
    color: '#FF6B00',
    fontWeight: '500',
  },
});