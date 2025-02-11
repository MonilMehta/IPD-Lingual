import React from 'react';
import { View, ScrollView, TouchableOpacity, SafeAreaView } from 'react-native';
import { Settings } from 'lucide-react-native';
import { Header } from './HomePage/Header';
import { SearchBar } from './HomePage/SearchBar';
import { LearningPathway } from './HomePage/LearningPathway';
import { MainFeatures } from './HomePage/MainFeatures';
import { QuickPhrases } from './HomePage/QuickPhrases';
import { TouristGuides } from './HomePage/TouristGuides';
import { StyleSheet, Platform } from 'react-native';


const HomeScreen = ({ navigation }) => {
  return (
    <SafeAreaView style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>
        <Header navigation={navigation} />
        <SearchBar />
        <LearningPathway navigation={navigation} />
        <MainFeatures navigation={navigation} />
        <QuickPhrases navigation={navigation} />
        <TouristGuides navigation={navigation} />
      </ScrollView>

      <TouchableOpacity 
        style={styles.settingsButton} 
        onPress={() => navigation.navigate('Settings')}
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

