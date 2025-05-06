import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ActivityIndicator, FlatList, Image, TextInput, TouchableOpacity, SafeAreaView } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { getToken } from '../../services/Auth';
import * as Speech from 'expo-speech';
import { useRouter } from 'expo-router';

const API_GUIDEBOOK = 'https://lingual-yn5c.onrender.com/api/guidebook';
const MASCOTS = [
  require('../../assets/images/cat-sleeping.png'), // Use sleeping cat for header mascot
  require('../../assets/images/cat-meowing.png'),
  require('../../assets/images/cat-pointing2.png'),
];

const GUIDE_TITLES = {
  'local_markets': 'Local Markets Guide',
  'restaurant': 'Restaurant Guide',
  'transport': 'Transport Guide',
  'kids_guide': 'Kids Guide',
  'scam_save': 'Scam Safety Guide',
};

// Language code mapping for Speech API compatibility
const LANGUAGE_CODES = {
  'hi': 'hi-IN',     // Hindi
  'gu': 'gu-IN',     // Gujarati
  'mr': 'mr-IN',     // Marathi
  'kn': 'kn-IN',     // Kannada
  'fr': 'fr-FR',     // French
  'zh': 'zh-CN',     // Chinese
  'es': 'es-ES',     // Spanish
  'ja': 'ja-JP',     // Japanese
  'ru': 'ru-RU',     // Russian
  'en': 'en-US',     // English (default fallback)
};

export default function GuideDetail() {
  const { guideKey } = useLocalSearchParams();
  const [phrases, setPhrases] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [targetLang, setTargetLang] = useState('en-US'); // Default to English
  const router = useRouter();
  const [isSpeaking, setIsSpeaking] = useState(false);

  useEffect(() => {
    const fetchGuide = async () => {
      setLoading(true);
      try {
        const token = await getToken();
        const headers = { 'Authorization': `Bearer ${token}` };
        const res = await fetch(API_GUIDEBOOK, { headers });
        const data = await res.json();
        const guide = data.guidebook[guideKey];
        setPhrases(guide || []);
        
        // Set language code from API response if available
        if (data.target_language) {
          const langCode = LANGUAGE_CODES[data.target_language] || 'en-US';
          setTargetLang(langCode);
          console.log(`Set language to: ${langCode}`);
        }
      } catch (error) {
        console.error('Error fetching guidebook:', error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchGuide();
    
    // Clean up any ongoing speech when component unmounts
    return () => {
      Speech.stop();
    };
  }, [guideKey]);

  const filtered = search
    ? phrases.filter(p =>
        p.label1.toLowerCase().includes(search.toLowerCase()) ||
        p.label2.toLowerCase().includes(search.toLowerCase())
      )
    : phrases;

  const handleSpeak = async (text) => {
    if (!text || typeof text !== 'string') return;
    
    try {
      // Stop any ongoing speech
      await Speech.stop();
      setIsSpeaking(true);
      
      console.log(`Speaking text: "${text}" in language: ${targetLang}`);
      
      // Check if the specified language is available
      const availableVoices = await Speech.getAvailableVoicesAsync();
      console.log(`Available voices: ${availableVoices.length}`);
      
      // Speak with a slight delay
      setTimeout(() => {
        Speech.speak(text, {
          language: targetLang,
          pitch: 1.0,
          rate: 0.9,
          onDone: () => setIsSpeaking(false),
          onError: (error) => {
            console.error('Speech error:', error);
            setIsSpeaking(false);
          }
        });
      }, 100);
    } catch (error) {
      console.error('Error in speech function:', error);
      setIsSpeaking(false);
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: '#fff' }}>
        <View style={{ flex: 1, backgroundColor: '#fff', justifyContent: 'center', alignItems: 'center' }}>
          <View style={{ width: '90%', height: 32, backgroundColor: '#eee', borderRadius: 8, marginBottom: 16 }} />
          {[...Array(5)].map((_, i) => (
            <View key={i} style={{ width: '100%', height: 60, backgroundColor: '#f3f3f3', borderRadius: 12, marginBottom: 14 }} />
          ))}
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.replace('/guides')} style={styles.backBtn}>
            <Text style={{ fontSize: 22, color: '#FF6B00' }}>{'←'}</Text>
          </TouchableOpacity>
          <Image source={MASCOTS[0]} style={styles.mascot} />
          <Text style={styles.title}>{GUIDE_TITLES[guideKey] || 'Guide'}</Text>
        </View>
        <TextInput
          style={styles.searchInput}
          placeholder="Search phrases..."
          value={search}
          onChangeText={setSearch}
          placeholderTextColor="#999"
        />
        <FlatList
          data={filtered}
          keyExtractor={(_, idx) => idx.toString()}
          showsVerticalScrollIndicator={false}
          renderItem={({ item }) => (
            <View style={styles.card}>
              <View style={styles.cardRow}>
                <Text style={styles.label1}>{item.label2}</Text>
                <TouchableOpacity 
                  onPress={() => handleSpeak(item.label1)}
                  disabled={isSpeaking}
                  style={styles.speakerButton}
                >
                  <Text style={{
                    fontSize: 22, 
                    color: isSpeaking ? '#999' : '#FF6B00', 
                    marginLeft: 8
                  }}>
                    🔊
                  </Text>
                </TouchableOpacity>
              </View>
              <Text style={styles.label2}>{item.label1}</Text>
            </View>
          )}
          contentContainerStyle={{ paddingBottom: 32 }}
        />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
    paddingHorizontal: 16,
    paddingTop: 16,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 18,
  },
  mascot: {
    width: 48,
    height: 48,
    marginRight: 12,
    tintColor: '#FF6B00', // unify mascot color
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#222',
  },
  searchInput: {
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 10,
    fontSize: 15,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: '#eee',
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 14,
    padding: 16,
    marginBottom: 12,
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
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    flex: 1,
    marginRight: 6,
  },
  label2: {
    fontSize: 14,
    color: '#666',
    fontStyle: 'italic',
  },
  speakerButton: {
    padding: 5,
  },
  backBtn: {
    marginRight: 12,
  },
});