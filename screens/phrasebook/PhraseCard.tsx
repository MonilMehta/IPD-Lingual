import * as React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Bookmark, ChevronRight } from 'lucide-react-native';

export function PhraseCard({ phrase, onPress }) {
  return (
    <TouchableOpacity style={styles.card} onPress={onPress}>
      <View style={styles.content}>
        <View style={styles.header}>
          <Text style={styles.category}>{phrase.category}</Text>
          <Bookmark size={16} color="#FF6B00" />
        </View>
        
        <Text style={styles.originalPhrase}>{phrase.originalPhrase}</Text>
        <Text style={styles.translation}>{phrase.translation}</Text>
        
        <View style={styles.contextContainer}>
          <Text style={styles.contextLabel}>Context:</Text>
          <Text style={styles.contextText}>{phrase.context}</Text>
        </View>
      </View>
      
      <ChevronRight size={20} color="#666" />
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 5,
    elevation: 2,
  },
  content: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  category: {
    fontSize: 12,
    color: '#FF6B00',
    fontWeight: '500',
  },
  originalPhrase: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  translation: {
    fontSize: 14,
    color: '#666',
    fontStyle: 'italic',
    marginBottom: 8,
  },
  contextContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  contextLabel: {
    fontSize: 12,
    color: '#999',
    marginRight: 4,
  },
  contextText: {
    fontSize: 12,
    color: '#666',
  },
});
