import React, { useEffect } from 'react';
import { View, Text, StyleSheet, Image } from 'react-native';
import { useRouter } from 'expo-router';

export const ChallengeComplete = ({ challengeId }) => {
  const router = useRouter();

  useEffect(() => {
    const timeout = setTimeout(() => {
      router.navigate('/(main)/home');
    }, 5000);
    return () => clearTimeout(timeout);
  }, [router]);

  return (
    <View style={styles.container}>
      <Image
        source={require('../../assets/images/cat-smiling.png')}
        style={styles.catImage}
        resizeMode="contain"
      />
      <Text style={styles.congratsText}>🎉 Congratulations! 🎉</Text>
      <Text style={styles.milestoneText}>You've achieved a milestone!</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FFF',
  },
  catImage: {
    width: 180,
    height: 180,
    marginBottom: 24,
  },
  congratsText: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#FF6B00',
    marginTop: 8,
    textAlign: 'center',
  },
  milestoneText: {
    fontSize: 18,
    color: '#333',
    marginTop: 12,
    textAlign: 'center',
  },
});
