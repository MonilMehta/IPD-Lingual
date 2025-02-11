import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

const Phrasebook: React.FC = () => {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Phrasebook</Text>
      <Text style={styles.subtitle}>Your saved phrases will appear here</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F8F9FA',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
  },
});

export default Phrasebook;
