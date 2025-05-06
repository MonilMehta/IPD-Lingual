import React, { useState, useMemo } from 'react';
import { View, Text, StyleSheet, FlatList, TextInput, TouchableOpacity } from 'react-native';
import * as Speech from 'expo-speech';

interface Phrase {
  category: string;
  label1: string;
  label2: string;
}

interface PhrasesListProps {
  phrases: Phrase[];
  showSearch?: boolean;
}

const categoryColors: Record<string, string> = {
  Basics: '#FF6B00',
  Dining: '#00B894',
  Emergency: '#D63031',
  Help: '#0984E3',
  Navigation: '#6C5CE7',
  Shopping: '#E17055',
};

function groupByCategory(phrases: Phrase[], search: string) {
  const filtered = search
    ? phrases.filter(p =>
        p.label1.toLowerCase().includes(search.toLowerCase()) ||
        p.label2.toLowerCase().includes(search.toLowerCase()) ||
        p.category.toLowerCase().includes(search.toLowerCase())
      )
    : phrases;
  const grouped: Record<string, Phrase[]> = {};
  filtered.forEach(p => {
    if (!grouped[p.category]) grouped[p.category] = [];
    grouped[p.category].push(p);
  });
  return grouped;
}

function chunkArray<T>(arr: T[], size: number): T[][] {
  const res: T[][] = [];
  for (let i = 0; i < arr.length; i += size) {
    res.push(arr.slice(i, i + size));
  }
  return res;
}

const PhrasesList: React.FC<PhrasesListProps> = ({ phrases, showSearch = true }) => {
  const [search, setSearch] = useState('');
  const grouped = useMemo(() => groupByCategory(phrases, search), [phrases, search]);

  const handleSpeak = (text: string) => {
    Speech.speak(text, { language: 'hi-IN' });
  };

  return (
    <View>
      {showSearch && (
        <TextInput
          style={styles.searchInput}
          placeholder="Search phrases..."
          value={search}
          onChangeText={setSearch}
          placeholderTextColor="#999"
        />
      )}
      {Object.keys(grouped).map(category => (
        <View key={category} style={{ marginBottom: 24 }}>
          <Text style={[styles.categoryHeader, { color: categoryColors[category] || '#333' }]}>{category}</Text>
          {chunkArray(grouped[category], 2).map((row, idx) => (
            <View key={idx} style={styles.row}>
              {row.map((item, i) => (
                <View style={styles.card} key={i}>
                  <View style={styles.cardRow}>
                    <Text style={styles.label2}>{item.label2}</Text>
                    <TouchableOpacity onPress={() => handleSpeak(item.label2)}>
                      <Text style={{ fontSize: 22, color: '#FF6B00', marginLeft: 8 }}>🔊</Text>
                    </TouchableOpacity>
                  </View>
                  <Text style={styles.label1}>{item.label1}</Text>
                </View>
              ))}
              {row.length === 1 && <View style={[styles.card, { backgroundColor: 'transparent', elevation: 0, shadowOpacity: 0 }]} />}
            </View>
          ))}
        </View>
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  searchInput: {
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 10,
    fontSize: 15,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: '#eee',
  },
  categoryHeader: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 8,
    marginLeft: 2,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  card: {
    flex: 1,
    backgroundColor: '#fff',
    borderRadius: 14,
    padding: 16,
    marginRight: 8,
    marginBottom: 0,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.07,
    shadowRadius: 4,
    elevation: 2,
  },
  cardRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  label1: {
    fontSize: 14,
    color: '#666',
    fontStyle: 'italic',
  },
  label2: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    flex: 1,
    marginRight: 6,
  },
});

export default PhrasesList;
