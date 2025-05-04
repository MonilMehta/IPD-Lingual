import React, { useEffect, useState } from 'react';
import { View, Text, Image, ActivityIndicator, StyleSheet } from 'react-native';

const MASCOT = require('../../assets/images/cat-smiling.png');
const API_URL = 'https://lingual-yn5c.onrender.com/api/daily_challenge';

export const DailyQuiz = () => {
  const [challengeWord, setChallengeWord] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch(API_URL, {
      headers: {
        'Authorization': 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJmcmVzaCI6ZmFsc2UsImlhdCI6MTc0NjM3MzYwMCwianRpIjoiMjk1YmEwNjktMDc2ZC00ZTgyLWE4YWYtYjVhOThjYWY4YTRmIiwidHlwZSI6ImFjY2VzcyIsInN1YiI6Im1vbmlsIiwibmJmIjoxNzQ2MzczNjAwLCJjc3JmIjoiZTY4YzdhYzctNjhkMC00MzVlLTk1OWUtNjk0N2YwNDQzOGQ4IiwiZXhwIjoxNzQ2NDYwMDAwfQ.nZ2KMuiJ7TVPGENlzSKmTGwZYps_2P6X9-zvtU_J25I'
      }
    })
      .then(res => res.json())
      .then(data => {
        setChallengeWord(data.challenge_word);
        setLoading(false);
      })
      .catch(() => {
        setError('Could not load today\'s challenge.');
        setLoading(false);
      });
  }, []);

  return (
    <View style={styles.container}>
      <Image source={MASCOT} style={styles.mascot} />
      <Text style={styles.title}>Daily Object Challenge</Text>
      {loading ? (
        <ActivityIndicator size="small" color="#FF6B00" />
      ) : error ? (
        <Text style={styles.error}>{error}</Text>
      ) : (
        <>
          <Text style={styles.instruction}>
            Find and point your camera at a <Text style={styles.word}>{challengeWord}</Text>!
          </Text>
        </>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    backgroundColor: '#FFF',
    borderRadius: 16,
    padding: 20,
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 2,
  },
  mascot: {
    width: 64,
    height: 64,
    marginBottom: 10,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FF6B00',
    marginBottom: 6,
  },
  word: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#FF6B00',
    marginBottom: 6,
  },
  instruction: {
    fontSize: 18,
    color: '#444',
    textAlign: 'center',
  },
  bold: {
    fontWeight: 'bold',
    color: '#FF6B00',
  },
  error: {
    color: 'red',
    fontSize: 15,
  },
});
