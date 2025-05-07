import React, { useEffect, useState } from 'react';
import { SafeAreaView, StyleSheet, ScrollView, View, Text } from 'react-native';
import { FloatingTabBar } from '../../components/Navigation/FloatingTabBar';
import GuidebookCarousel from '../../components/GuidebookCarousel';
import PhrasesList from '../../components/PhrasesList';
import { getToken } from '../../services/Auth';
import { MotiView } from 'moti';
import { Skeleton } from 'moti/skeleton';

const API_PHRASES = 'https://lingual-yn5c.onrender.com/api/phrases';
const API_GUIDEBOOK = 'https://lingual-yn5c.onrender.com/api/guidebook';

const GuidesScreen: React.FC = () => {
  const [phrasesData, setPhrasesData] = useState(null);
  const [guidebookData, setGuidebookData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const token = await getToken();
        const headers = { 'Authorization': `Bearer ${token}` };
        const [phrasesRes, guidebookRes] = await Promise.all([
          fetch(API_PHRASES, { headers }),
          fetch(API_GUIDEBOOK, { headers })
        ]);
        const phrases = await phrasesRes.json();
        const guidebook = await guidebookRes.json();
        setPhrasesData(phrases);
        setGuidebookData(guidebook);
        setLoading(false);
      } catch (err) {
        setError('Failed to load data');
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <ScrollView showsVerticalScrollIndicator={false}>
          {/* Guidebook Carousel Heading */}
          <View style={{ paddingHorizontal: 16, marginTop: 32, marginBottom: 8 }}>
            <Text style={{ fontSize: 22, fontWeight: 'bold', color: '#FF6B00', marginBottom: 4 }}>Explore Tourist Guides</Text>
            <Text style={{ fontSize: 15, color: '#666', marginBottom: 18 }}>Handpicked guides to help you navigate, dine, shop, and explore like a local.</Text>
          </View>
          {/* Guidebook Loader */}
          <View style={{ paddingHorizontal: 16, marginBottom: 24 }}>
            <Skeleton colorMode="light" width={320} height={120} style={{ borderRadius: 18 }} />
          </View>
          {/* Quick Phrases Heading */}
          <View style={{ paddingHorizontal: 16, marginTop: 32, marginBottom: 8 }}>
            <Text style={{ fontSize: 22, fontWeight: 'bold', color: '#FF6B00', marginBottom: 4 }}>Quick Phrases</Text>
            <Text style={{ fontSize: 15, color: '#666', marginBottom: 18 }}>Essential phrases to zip you through any situation, from greetings to emergencies.</Text>
          </View>
          {/* Quick Phrases Loader */}
          <View style={{ paddingHorizontal: 16, marginBottom: 24 }}>
            {[...Array(6)].map((_, i) => (
              <Skeleton key={i} colorMode="light" width={'100%'} height={20} style={{ marginBottom: 14, borderRadius: 8 }} />
            ))}
          </View>
        </ScrollView>
      </SafeAreaView>
    );
  }

  if (error) {
    return (
      <SafeAreaView style={styles.container}>
        <Text style={{ color: 'red', marginTop: 40 }}>{error}</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Guidebook Carousel */}
        {guidebookData && guidebookData.guidebook && (
          <GuidebookCarousel guidebook={guidebookData.guidebook} />
        )}
        {/* All Phrases List */}
        {phrasesData && (
          <PhrasesList phrases={phrasesData.phrases} />
        )}
      </ScrollView>
      <FloatingTabBar />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
    padding: 0,
  },
  padded: {
    padding: 16,
  },
});

export default GuidesScreen;
