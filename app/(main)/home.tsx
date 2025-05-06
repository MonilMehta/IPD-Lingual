import React, { useEffect, useState, useMemo } from 'react';
import { View, ScrollView, TouchableOpacity, SafeAreaView } from 'react-native';
import { StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { Header } from '../../screens/HomePage/Header';
import { DailyQuiz } from '../../screens/HomePage/DailyQuiz';
import { MainFeatures } from '../../screens/HomePage/MainFeatures';
import { FloatingTabBar } from '../../components/Navigation/FloatingTabBar';
import { getToken } from '../../services/Auth'; // Reuse getToken for bearer token

export const HomeScreen: React.FC = () => {
  const router = useRouter();
  const [homepageData, setHomepageData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let isMounted = true;
    async function fetchHomepage() {
      setLoading(true);
      setError(null);
      try {
        const token = await getToken();
        const res = await fetch('https://lingual-yn5c.onrender.com/api/homepage', {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!res.ok) throw new Error('Failed to fetch homepage');
        const data = await res.json();
        console.log('Homepage data:', data); // Debugging line
        if (isMounted) setHomepageData(data);
      } catch (err) {
        if (isMounted) setError(err.message || 'Error fetching homepage');
      } finally {
        if (isMounted) setLoading(false);
      }
    }
    fetchHomepage();
    return () => { isMounted = false; };
  }, []);

  // Memoize homepageData to avoid unnecessary re-renders
  const homepage = useMemo(() => homepageData, [homepageData]);

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>
        <Header navigation={router} homepage={homepage} loading={loading} error={error} />
        <DailyQuiz homepage={homepage} loading={loading} error={error} />
        <MainFeatures navigation={router} homepage={homepage} />
      </ScrollView>
      <FloatingTabBar />
    </SafeAreaView>
  );
};

export const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: '#F8F9FA',
      padding: 20,
    },
    settingsButton: {
      position: 'absolute',
      right: 20,
      bottom: 20,
      width: 48,
      height: 48,
      borderRadius: 24,
      backgroundColor: '#FFF',
      justifyContent: 'center',
      alignItems: 'center',
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 8,
      elevation: 3,
    },
  });

export default HomeScreen;
