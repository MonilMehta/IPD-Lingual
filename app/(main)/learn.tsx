import React from 'react';
import { SafeAreaView, StyleSheet } from 'react-native';
import { LearningPathway } from '../../screens/HomePage/LearningCard';
import { FloatingTabBar } from '../../components/Navigation/FloatingTabBar';

const LearnScreen: React.FC = () => {
  return (
    <SafeAreaView style={styles.container}>
      <LearningPathway navigation={null} />
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

export default LearnScreen;
