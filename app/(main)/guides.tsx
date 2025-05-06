import React, { useEffect, useState } from 'react';
import { SafeAreaView, StyleSheet, ScrollView, ActivityIndicator, View, Text } from 'react-native';
import { FloatingTabBar } from '../../components/Navigation/FloatingTabBar';
import GuidebookCarousel from '../../components/GuidebookCarousel';
import PhrasesList from '../../components/PhrasesList';
import { getToken } from '../../services/Auth';

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
        <ActivityIndicator size="large" color="#FF6B00" style={{ marginTop: 40 }} />
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
});

export default GuidesScreen;
