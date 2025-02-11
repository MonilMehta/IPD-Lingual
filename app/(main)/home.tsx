import React from 'react';
import { View, ScrollView, TouchableOpacity, SafeAreaView } from 'react-native';
import { Settings } from 'lucide-react-native';
import { StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { Header } from '../../screens/HomePage/Header';
import { SearchBar } from '../../screens/HomePage/SearchBar';
import { LearningPathway } from '../../screens/HomePage/LearningPathway';
import { MainFeatures } from '../../screens/HomePage/MainFeatures';
import { QuickPhrases } from '../../screens/HomePage/QuickPhrases';
import { TouristGuides } from '../../screens/HomePage/TouristGuides';

const HomeScreen: React.FC = () => {
  const router = useRouter();

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>
        <Header navigation={router} />
        <SearchBar />
        <LearningPathway navigation={router} />
        <MainFeatures navigation={router} />
        <QuickPhrases navigation={router} />
        <TouristGuides navigation={router} />
      </ScrollView>

      <TouchableOpacity 
        style={styles.settingsButton} 
        onPress={() => router.push('/(main)/settings')}
      >
        <Settings size={24} color="#666" />
      </TouchableOpacity>
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
