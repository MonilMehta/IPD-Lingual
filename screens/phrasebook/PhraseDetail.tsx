import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';
import { ArrowLeft, Volume2, Copy, Share2 } from 'lucide-react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';

export default function PhraseDetail({ phrase, onPress }) {
  const router = useRouter();

  if (!phrase) {
    return <Text>No phrase data provided</Text>;
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <ArrowLeft size={24} color="#333" />
        </TouchableOpacity>
        <Text style={styles.title}>Phrase Details</Text>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.phraseCard}>
          <Text style={styles.categoryLabel}>{phrase.category}</Text>
          
          <View style={styles.phraseSection}>
            <Text style={styles.sectionLabel}>Original Phrase</Text>
            <View style={styles.phraseContainer}>
              <Text style={styles.phraseText}>{phrase.originalPhrase}</Text>
              <TouchableOpacity>
                <Volume2 size={20} color="#FF6B00" />
              </TouchableOpacity>
            </View>
          </View>

          <View style={styles.phraseSection}>
            <Text style={styles.sectionLabel}>Translation</Text>
            <View style={styles.phraseContainer}>
              <Text style={styles.phraseText}>{phrase.translation}</Text>
              <TouchableOpacity>
                <Volume2 size={20} color="#FF6B00" />
              </TouchableOpacity>
            </View>
          </View>

          <View style={styles.contextSection}>
            <Text style={styles.sectionLabel}>Context</Text>
            <Text style={styles.contextText}>{phrase.context}</Text>
          </View>

          <View style={styles.examplesSection}>
            <Text style={styles.sectionLabel}>Similar Examples</Text>
            {phrase.examples.map((example, index) => (
              <Text key={index} style={styles.exampleText}>• {example}</Text>
            ))}
          </View>
        </View>
      </ScrollView>

      <View style={styles.actions}>
        <TouchableOpacity style={styles.actionButton}>
          <Copy size={20} color="#FFF" />
          <Text style={styles.actionText}>Copy</Text>
        </TouchableOpacity>
        
        <TouchableOpacity style={styles.actionButton}>
          <Share2 size={20} color="#FFF" />
          <Text style={styles.actionText}>Share</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#FFF',
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginLeft: 16,
  },
  content: {
    flex: 1,
    padding: 16,
  },
  phraseCard: {
    backgroundColor: '#FFF',
    borderRadius: 12,
    padding: 16,
  },
  categoryLabel: {
    fontSize: 14,
    color: '#FF6B00',
    fontWeight: '500',
    marginBottom: 16,
  },
  phraseSection: {
    marginBottom: 24,
  },
  sectionLabel: {
    fontSize: 12,
    color: '#999',
    marginBottom: 8,
  },
  phraseContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  phraseText: {
    fontSize: 18,
    color: '#333',
    flex: 1,
  },
  contextSection: {
    marginBottom: 24,
  },
  contextText: {
    fontSize: 16,
    color: '#666',
    lineHeight: 24,
  },
  examplesSection: {
    marginBottom: 16,
  },
  exampleText: {
    fontSize: 16,
    color: '#666',
    marginBottom: 8,
  },
  actions: {
    flexDirection: 'row',
    padding: 16,
    backgroundColor: '#FFF',
    borderTopWidth: 1,
    borderTopColor: '#EEE',
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FF6B00',
    borderRadius: 8,
    padding: 12,
    marginHorizontal: 8,
  },
  actionText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
});