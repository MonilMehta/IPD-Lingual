import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, SafeAreaView, StatusBar, ActivityIndicator, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { LearningPathway } from '../../components/LearningPathway';
import { FloatingTabBar } from '../../components/Navigation/FloatingTabBar';
import { getToken } from '../../services/Auth';

export default function LearnScreen() {
  const [loading, setLoading] = useState(true);
  const [quizData, setQuizData] = useState(null);
  const [error, setError] = useState(null);
  const router = useRouter();

  useEffect(() => {
    const fetchQuiz = async () => {
      try {
        const token = await getToken();
        const response = await fetch('https://lingual-yn5c.onrender.com/api/quiz', {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        if (!response.ok) throw new Error('Failed to fetch quiz');
        const data = await response.json();
        setQuizData(data);
      } catch (err) {
        setError(err.message || 'Error fetching quiz');
        Alert.alert('Error', err.message || 'Error fetching quiz');
      } finally {
        setLoading(false);
      }
    };
    fetchQuiz();
  }, []);

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" />
      <View style={styles.contentContainer}>
        {loading ? (
          <ActivityIndicator size="large" color="#FF6B00" style={{ marginTop: 40 }} />
        ) : quizData ? (
          <LearningPathway questions={quizData.questions} currentLevel={quizData.current_level} totalQuestions={quizData.total_questions || quizData.questions.length} />
        ) : (
          <Text style={{ color: 'red', textAlign: 'center', marginTop: 40 }}>Failed to load quiz.</Text>
        )}
      </View>
      <FloatingTabBar />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  contentContainer: {
    flex: 1,
  },
});
