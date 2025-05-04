import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image } from 'react-native';
import { Lock, Check, Star } from 'lucide-react-native';

const MASCOT_IMAGE = require('../../assets/images/cat-smiling.png');

type PathwayNodeProps = {
  id: number;
  status: 'locked' | 'current' | 'completed';
  onPress: () => void;
};

export const PathwayNode = ({ id, status, onPress }: PathwayNodeProps) => {
  const nodeContent = () => {
    switch (status) {
      case 'locked':
        return <Lock size={24} color="#9E9E9E" />;
      case 'completed':
        return <Check size={28} color="#FFFFFF" />;
      case 'current':
        return (
          <Image
            source={MASCOT_IMAGE}
            style={{ width: 38, height: 38, resizeMode: 'contain' }}
          />
        );
      default:
        return <Text style={styles.nodeText}>{id}</Text>;
    }
  };

  const getNodeStyle = () => {
    switch (status) {
      case 'locked':
        return styles.lockedNode;
      case 'completed':
        return styles.completedNode;
      case 'current':
        return styles.currentNode;
      default:
        return {};
    }
  };

  return (
    <View style={styles.container}>
      <TouchableOpacity 
        style={[styles.node, getNodeStyle()]}
        onPress={onPress}
        disabled={status === 'locked'}
        activeOpacity={0.7}
      >
        {nodeContent()}
      </TouchableOpacity>
      <Text style={styles.levelText}>Level {id}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  node: {
    width: 70,
    height: 70,
    borderRadius: 35,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
    zIndex: 10,
  },
  lockedNode: {
    backgroundColor: '#E0E0E0',
    borderWidth: 2,
    borderColor: '#BDBDBD',
  },
  completedNode: {
    backgroundColor: '#4CAF50',
    borderWidth: 2,
    borderColor: '#388E3C',
  },
  currentNode: {
    backgroundColor: '#FF6B00',
    borderWidth: 3,
    borderColor: '#E65100',
    transform: [{ scale: 1.15 }],
  },
  nodeText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
    fontSize: 22,
  },
  levelText: {
    marginTop: 8,
    fontSize: 14,
    fontWeight: '500',
    color: '#666',
  },
});
