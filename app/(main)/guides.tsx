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
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ flexGrow: 1 }}>
          {/* Guidebook Carousel Skeleton */}
          <View style={{ marginTop: 28, marginBottom: 8, paddingLeft: 16 }}>
            <Skeleton colorMode="light" width={220} height={28} style={{ marginBottom: 8, borderRadius: 8 }} />
            <Skeleton colorMode="light" width={280} height={18} style={{ marginBottom: 18, borderRadius: 8 }} />
            <View style={{ flexDirection: 'row' }}>
              {[0,1,2].map(i => (
                <Skeleton key={i} colorMode="light" width={180} height={120} style={{ borderRadius: 18, marginRight: 16 }} />
              ))}
            </View>
          </View>
          {/* Phrases List Skeleton */}
          <View style={{ marginTop: 32, paddingHorizontal: 16 }}>
            <Skeleton colorMode="light" width={180} height={24} style={{ marginBottom: 12, borderRadius: 8 }} />
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
