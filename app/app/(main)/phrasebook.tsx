import React, { useEffect, useState } from 'react';
import { SafeAreaView, View, Text, FlatList, ActivityIndicator, StyleSheet, TouchableOpacity, TextInput, Image } from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { getToken } from '../../services/Auth';
import * as Speech from 'expo-speech';
import { router, useRouter } from 'expo-router';

const mascots = [
  require('../../assets/images/cat-thinking.png'),
  require('../../assets/images/cat-meowing.png'),
  require('../../assets/images/cat-pointing2.png'),
  require('../../assets/images/cat-smiling.png'),
  require('../../assets/images/cat-sayinghi.png'),
];

const API_URL ='https://lingual-yn5c.onrender.com';

interface Detection {
  _id: string;
  label: string;
  translated_label: string;
  timestamp: string;
}

export default function Phrasebook({ navigation }) {
  const [detections, setDetections] = useState<Detection[]>([]);
  const [filtered, setFiltered] = useState<Detection[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const router=useRouter();
  useEffect(() => {
    const fetchDetections = async () => {
      setLoading(true);
      setError(null);
      try {
        const token = await getToken();
        const res = await fetch(`${API_URL}/api/detections`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!res.ok) throw new Error('Failed to fetch');
        const data = await res.json();
        setDetections(data);
        setFiltered(data);
      } catch (err: any) {
        setError(err.message || 'Error fetching detections');
      } finally {
        setLoading(false);
      }
    };
    fetchDetections();
  }, []);

  useEffect(() => {
    if (!search) setFiltered(detections);
    else setFiltered(
      detections.filter(d =>
        d.label.toLowerCase().includes(search.toLowerCase()) ||
        d.translated_label.toLowerCase().includes(search.toLowerCase())
      )
    );
  }, [search, detections]);

  const handleBack = () => {
    router.back();
  };

  // Language code detection helper
  function guessLanguage(text: string): string {
    // Simple Unicode range checks for major languages
    if (/\p{Script=Devanagari}/u.test(text)) return 'hi'; // Hindi, Marathi
    if (/[\u0C80-\u0CFF]/.test(text)) return 'kn'; // Kannada
    if (/[\u0A80-\u0AFF]/.test(text)) return 'gu'; // Gujarati
    if (/[\u4e00-\u9fff]/.test(text)) return 'zh'; // Chinese
    if (/\p{Script=Cyrillic}/u.test(text)) return 'ru'; // Russian
    if (/\p{Script=Hiragana}|\p{Script=Katakana}/u.test(text)) return 'ja'; // Japanese
    if (/[áéíóúñü¿¡]/i.test(text)) return 'es'; // Spanish
    if (/ç|é|è|ê|à|â|î|ô|û|œ|ë|ï|ü|ù|ÿ/i.test(text)) return 'fr'; // French
    // Default to English
    return 'en';
  }

  const handleSpeak = (text: string) => {
    if (text) {
      const lang = guessLanguage(text);
      Speech.speak(text, {
        language: lang,
        rate: 0.95,
        pitch: 1.0,
      });
    }
  };

  const handleDelete = async (id: string) => {
    try {
      const token = await getToken();
      const res = await fetch(`${API_URL}/api/delete_detection/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error('Failed to delete');
      setDetections(prev => prev.filter(d => d._id !== id));
      setFiltered(prev => prev.filter(d => d._id !== id));
    } catch (err) {
      // Optionally show error
    }
  };

  const renderDetection = ({ item, index }) => (
    <View style={styles.row}>
      <Image source={mascots[index % mascots.length]} style={styles.mascot} />
      <View style={styles.texts}>
        <Text style={styles.label}>{item.label}</Text>
        <Text style={styles.translated}>{item.translated_label}</Text>
        <Text style={styles.timestamp}>{new Date(item.timestamp).toLocaleString()}</Text>
      </View>
      <TouchableOpacity style={styles.micBtn} onPress={() => handleSpeak(item.translated_label)}>
        <Ionicons name="mic-outline" size={26} color="#FF6B00" />
      </TouchableOpacity>
      <TouchableOpacity style={styles.trashBtn} onPress={() => handleDelete(item._id)}>
        <MaterialCommunityIcons name="trash-can-outline" size={26} color="#F44336" />
      </TouchableOpacity>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.headerRow}>
        <TouchableOpacity onPress={handleBack} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={26} color="#FF6B00" />
        </TouchableOpacity>
        <Text style={styles.title}>Phrasebook</Text>
      </View>
      <TextInput
        style={styles.search}
        placeholder="Search saved detections..."
        placeholderTextColor="#aaa"
        value={search}
        onChangeText={setSearch}
      />
      {loading ? (
        <ActivityIndicator style={{ marginTop: 40 }} size="large" color="#FF6B00" />
      ) : error ? (
        <Text style={styles.error}>{error}</Text>
      ) : !filtered.length ? (
        <Text style={styles.empty}>No saved detections found.</Text>
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={item => item._id}
          renderItem={renderDetection}
          contentContainerStyle={{ paddingVertical: 16 }}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
    paddingHorizontal: 0,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingTop: 44,
    paddingBottom: 8,
    backgroundColor: '#FFF',
    borderBottomWidth: 1,
    borderBottomColor: '#FFE0CC',
  },
  backBtn: {
    padding: 6,
    marginRight: 8,
    borderRadius: 20,
    backgroundColor: '#FFF3E6',
    borderWidth: 1,
    borderColor: '#FF6B00',
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#222',
  },
  search: {
    backgroundColor: '#FFF',
    borderRadius: 10,
    padding: 12,
    fontSize: 16,
    margin: 14,
    borderWidth: 1,
    borderColor: '#FFE0CC',
    color: '#222',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF',
    borderRadius: 12,
    padding: 16,
    marginHorizontal: 14,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOpacity: 0.07,
    shadowRadius: 4,
    elevation: 2,
  },
  mascot: {
    width: 44,
    height: 44,
    borderRadius: 22,
    marginRight: 12,
  },
  texts: {
    flex: 1,
  },
  label: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FF6B00',
  },
  translated: {
    fontSize: 16,
    color: '#333',
    marginTop: 2,
  },
  timestamp: {
    fontSize: 12,
    color: '#888',
    marginTop: 6,
  },
  micBtn: {
    marginLeft: 10,
    padding: 8,
    borderRadius: 20,
    backgroundColor: '#FFF3E6',
    borderWidth: 1,
    borderColor: '#FF6B00',
  },
  trashBtn: {
    marginLeft: 8,
    padding: 8,
    borderRadius: 20,
    backgroundColor: '#FFF3E6',
    borderWidth: 1,
    borderColor: '#F44336',
  },
  error: { color: 'red', textAlign: 'center', marginTop: 40 },
  empty: { color: '#888', textAlign: 'center', marginTop: 40, fontSize: 16 },
});
