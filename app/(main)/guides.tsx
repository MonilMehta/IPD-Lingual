import React from 'react';
import { SafeAreaView, StyleSheet, ScrollView } from 'react-native';
import { TouristGuides } from '../../screens/HomePage/TouristGuides';
import { QuickPhrases } from '../../screens/HomePage/QuickPhrases';
import { FloatingTabBar } from '../../components/Navigation/FloatingTabBar';

const GuidesScreen: React.FC = () => {
  return (
    <SafeAreaView style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>
        <TouristGuides navigation={null} />
        <QuickPhrases navigation={null} />
      </ScrollView>
      <FloatingTabBar />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
    padding: 20,
  },
});

export default GuidesScreen;
