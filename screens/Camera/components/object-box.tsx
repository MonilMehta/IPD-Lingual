import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

interface ObjectBoxProps {
  box: [number, number, number, number];
  label: string;
  score: number;
}

const ObjectBox: React.FC<ObjectBoxProps> = ({ box, label, score }) => {
  const [x, y, width, height] = box;
  
  return (
    <View
      style={[
        styles.box,
        {
          left: x,
          top: y,
          width: width,
          height: height,
        },
      ]}>
      <Text style={styles.label}>{`${label} (${Math.round(score * 100)}%)`}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  box: {
    position: 'absolute',
    borderWidth: 2,
    borderColor: '#00ff00',
    backgroundColor: 'transparent',
  },
  label: {
    backgroundColor: '#00ff00',
    color: '#000',
    fontSize: 12,
    padding: 4,
    position: 'absolute',
    top: -24,
    left: 0,
    borderRadius: 4,
  },
});

export default ObjectBox;