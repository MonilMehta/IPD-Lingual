import React from 'react';
import { SafeAreaView, StyleSheet, Image, View, Text } from 'react-native';
import { ScrollView } from 'react-native';
import PhrasesList from '../../components/PhrasesList';

const MASCOTS = [
  require('../../assets/images/cat-thinking.png'),
  require('../../assets/images/cat-meowing.png'),
  require('../../assets/images/cat-pointing2.png'),
];

export default function Phrasebook({ route }) {
  // Expecting phrases to be passed as a prop from guides
  const phrases = route?.params?.phrases || [];

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <Image source={MASCOTS[1]} style={styles.mascot} />
          <Text style={styles.title}>Common Phrases</Text>
        </View>
        <Text style={styles.description}>Common phrases to help you get by</Text>
        <PhrasesList phrases={phrases} />
      </ScrollView>
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
    tintColor: '#FF6B00',
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#222',
  },
  description: {
    fontSize: 16,
    color: '#666',
    marginBottom: 12,
  },
});
