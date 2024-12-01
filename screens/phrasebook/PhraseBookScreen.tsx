import * as React from 'react';
import { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, TextInput } from 'react-native';
import { Book, Search, Plus } from 'lucide-react-native';
import { PhraseCard } from './PhraseCard';
import { ScrollView } from 'moti';

export default function PhrasebookScreen({ navigation }) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');

  const savedPhrases = [
    {
      id: '1',
      originalPhrase: 'Where is the nearest restaurant?',
      translation: '¿Dónde está el restaurante más cercano?',
      context: 'When looking for places to eat',
      category: 'Dining',
      examples: [
        'Where is the nearest cafe?',
        'Where is the nearest bar?'
      ]
    },
    {
      id: '2',
      originalPhrase: 'Can I have the menu, please?',
      translation: '¿Me puede traer el menú, por favor?',
      context: 'At a restaurant',
      category: 'Dining',
      examples: [
        'Can I have the wine list?',
        'Can I have the dessert menu?'
      ]
    },
    {
      id: '3',
      originalPhrase: 'How much does this cost?',
      translation: '¿Cuánto cuesta esto?',
      context: 'Shopping or services',
      category: 'Shopping',
      examples: [
        'How much is the total?',
        'What is the price?'
      ]
    },
    {
      id: '4',
      originalPhrase: 'Where is the nearest hospital?',
      translation: '¿Dónde está el hospital más cercano?',
      context: 'When looking for medical services',
      category: 'Emergency',
      examples: [
        'Where is the nearest clinic?',
        'Where is the nearest pharmacy?'
      ]
    },
    {
      id: '5',
      originalPhrase: 'I need help.',
      translation: 'Necesito ayuda.',
      context: 'In an emergency situation',
      category: 'Emergency',
      examples: [
        'Can you help me?',
        'I need assistance.'
      ]
    },
    {
      id: '6',
      originalPhrase: 'What time is it?',
      translation: '¿Qué hora es?',
      context: 'Asking for the time',
      category: 'General',
      examples: [
        'Do you have the time?',
        'Can you tell me the time?'
      ]
    },
    {
      id: '7',
      originalPhrase: 'Where is the bathroom?',
      translation: '¿Dónde está el baño?',
      context: 'Looking for a restroom',
      category: 'General',
      examples: [
        'Where is the restroom?',
        'Can you show me the bathroom?'
      ]
    },
    {
      id: '8',
      originalPhrase: 'How do I get to the airport?',
      translation: '¿Cómo llego al aeropuerto?',
      context: 'Asking for directions',
      category: 'Travel',
      examples: [
        'How do I get to the train station?',
        'How do I get to the bus stop?'
      ]
    },
    {
      id: '9',
      originalPhrase: 'Can I get a taxi?',
      translation: '¿Puedo conseguir un taxi?',
      context: 'Requesting transportation',
      category: 'Travel',
      examples: [
        'Can I get a ride?',
        'Can I get an Uber?'
      ]
    },
    {
      id: '10',
      originalPhrase: 'Do you speak English?',
      translation: '¿Habla inglés?',
      context: 'Asking if someone speaks English',
      category: 'General',
      examples: [
        'Do you understand English?',
        'Can you speak English?'
      ]
    },
    {
      id: '11',
      originalPhrase: 'I am lost.',
      translation: 'Estoy perdido.',
      context: 'When you are lost',
      category: 'Emergency',
      examples: [
        'Can you help me find my way?',
        'I don’t know where I am.'
      ]
    },
    {
      id: '12',
      originalPhrase: 'I would like to buy this.',
      translation: 'Me gustaría comprar esto.',
      context: 'Shopping',
      category: 'Shopping',
      examples: [
        'I want to purchase this.',
        'Can I buy this?'
      ]
    },
    {
      id: '13',
      originalPhrase: 'Can you give me a discount?',
      translation: '¿Me puede dar un descuento?',
      context: 'Negotiating a price',
      category: 'Shopping',
      examples: [
        'Is there a discount?',
        'Can you lower the price?'
      ]
    }
  ];

  const categories = ['All', 'Dining', 'Shopping', 'Transport', 'Emergency', 'Social'];

  const filteredPhrases = savedPhrases.filter(phrase => {
    const matchesSearch = phrase.originalPhrase.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         phrase.translation.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === 'All' || phrase.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Book size={24} color="#FF6B00" />
        <Text style={styles.title}>Phrasebook</Text>
      </View>

      <View style={styles.searchContainer}>
        <Search size={20} color="#666" />
        <TextInput
          style={styles.searchInput}
          placeholder="Search phrases..."
          value={searchQuery}
          onChangeText={(text) => setSearchQuery(text)}
        />
      </View>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.categoriesContainer}>
        {categories.map((category) => (
          <TouchableOpacity
            key={category}
            style={[
              styles.categoryChip,
              selectedCategory === category && styles.selectedCategoryChip
            ]}
            onPress={() => setSelectedCategory(category)}
          >
            <Text
              style={[
                styles.categoryText,
                selectedCategory === category && styles.selectedCategoryText
              ]}
            >
              {category}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
      <ScrollView style={styles.phrasesContainer} showsVerticalScrollIndicator={false}>
        {filteredPhrases.map((phrase) => (
          <PhraseCard
          key={phrase.id}
          phrase={phrase}
          onPress={() => navigation.navigate('phrasedetail', { phrase })} // Use props instead of route params
        />
        ))}
      </ScrollView>

      <TouchableOpacity
        style={styles.addButton}
        onPress={() => navigation.navigate('AddPhrase')}
      >
        <Plus size={24} color="#FFF" />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
    padding: 16,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
    marginTop: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginLeft: 12,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF',
    borderRadius: 12,
    padding: 12,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 5,
    elevation: 3,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    marginLeft: 8,
    color: '#333',
  },
  categoryChip: {
    backgroundColor: '#FFF',
    borderRadius: 20,
    maxHeight:50,
    minWidth: 100,
    paddingHorizontal: 16,
    marginRight: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  selectedCategoryChip: {
    backgroundColor: '#FF6B00',
  },
  categoryText: {
    color: '#666',
    fontSize: 14,
    fontWeight: '500',
  },
  selectedCategoryText: {
    color: '#FFF',
  },
  phrasesContainer: {
    flex: 1,
    marginTop:-512,
  },
  addButton: {
    position: 'absolute',
    right: 16,
    bottom: 16,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#FF6B00',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowRadius: 10,
    elevation: 4,
  },
});
