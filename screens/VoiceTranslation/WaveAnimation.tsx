import React from 'react';
import { StyleSheet } from 'react-native';
import { MotiView } from 'moti';

interface WaveAnimationProps {
  isRecording: boolean;
}

export const WaveAnimation = ({ isRecording }: WaveAnimationProps) => {
  const bars = Array.from({ length: 5 });
  
  return (
    <MotiView style={styles.container}>
      {bars.map((_, index) => (
        <MotiView
          key={index}
          style={[styles.bar]}
          animate={{
            height: isRecording ? [40, 100, 40] : 40,
          }}
          transition={{
            type: 'timing',
            duration: 1000,
            delay: index * 100,
            loop: isRecording,
          }}
        />
      ))}
    </MotiView>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 100,
    gap: 4,
  },
  bar: {
    width: 4,
    height: 40,
    backgroundColor: '#FF6B00',
    borderRadius: 2,
  },
});