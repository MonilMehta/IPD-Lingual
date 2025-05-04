import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import SavedDetections from '../../components/SavedDetections';
const Phrasebook: React.FC = () => {
  return (
    <View style={{ flex: 1 }}>
      <SavedDetections />
    </View>
  );
};

export default Phrasebook;
