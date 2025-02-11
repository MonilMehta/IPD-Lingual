import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

const AllGuides: React.FC = () => {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Tourist Guides</Text>
      <Text style={styles.subtitle}>Explore language guides for popular destinations</Text>
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

export default AllGuides;
