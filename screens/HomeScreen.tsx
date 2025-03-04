import React, { useEffect } from 'react';
import { View, ScrollView, TouchableOpacity, SafeAreaView, StatusBar, StyleSheet, Platform } from 'react-native';
import { Settings } from 'lucide-react-native';
import { MotiView } from 'moti';
import { Header } from './HomePage/Header';
import { SearchBar } from './HomePage/SearchBar';
import { LearningPathway } from './HomePage/LearningPathway';
import { MainFeatures } from './HomePage/MainFeatures';
import { QuickPhrases } from './HomePage/QuickPhrases';
import { TouristGuides } from './HomePage/TouristGuides';
import { Challenge } from './HomePage/Challenge';
import { useNavigation } from 'expo-router';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';

// Define the type for the navigation stack
type RootStackParamList = {
  Home: undefined;
  Settings: undefined;
  // Add other screens as needed
};

// Define the navigation type using Expo's navigation
type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

const HomeScreen: React.FC = () => {
  // Use the navigation hook from Expo
  const navigation = useNavigation<NavigationProp>();

  useEffect(() => {
    // Debug check for components loading
    console.log('HomeScreen rendered with DailyChallenge component');
  }, []);

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar translucent backgroundColor="transparent" barStyle="dark-content" />
     
      <MotiView
        style={[styles.gradientCircle, styles.topCircle]}
        from={{ opacity: 0 }}
        animate={{ opacity: 0.05 }}
        transition={{ type: 'timing', duration: 1000 }}
      />
      <MotiView
        style={[styles.gradientCircle, styles.bottomCircle]}
        from={{ opacity: 0 }}
        animate={{ opacity: 0.05 }}
        transition={{ type: 'timing', duration: 1000, delay: 200 }}
      />
     
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        <Header navigation={navigation} />
        <SearchBar />
        <LearningPathway navigation={navigation} />
        <Challenge navigation={navigation} />
        <MainFeatures navigation={navigation} />
        <QuickPhrases navigation={navigation} />
        <TouristGuides navigation={navigation} />
        <View style={{ height: 80 }} />
      </ScrollView>
      <MotiView
        from={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ type: 'timing', duration: 500, delay: 800 }}
        style={styles.settingsButtonContainer}
      >
        <TouchableOpacity
          style={styles.settingsButton}
          onPress={() => navigation.navigate('Settings')}
        >
          <Settings size={24} color="#FF6B00" />
        </TouchableOpacity>
      </MotiView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    position: 'relative',
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight || 0 : 0,
  },
  settingsButtonContainer: {
    position: 'absolute',
    right: 20,
    bottom: 20,
    zIndex: 10,
  },
  settingsButton: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#FFF',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 10,
    elevation: 5,
    borderWidth: 1,
    borderColor: 'rgba(255, 107, 0, 0.1)',
  },
  gradientCircle: {
    position: 'absolute',
    backgroundColor: '#FF6B00',
    borderRadius: 1000,
    zIndex: 0,
  },
  topCircle: {
    width: 500,
    height: 500,
    top: -300,
    right: -200,
  },
  bottomCircle: {
    width: 600,
    height: 600,
    bottom: -350,
    left: -300,
  },
});

export default HomeScreen;