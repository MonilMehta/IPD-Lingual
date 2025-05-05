import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, SafeAreaView, StatusBar, ActivityIndicator, Alert, TouchableOpacity } from 'react-native';
import { ArrowLeft } from 'lucide-react-native';
import { useRouter } from 'expo-router';
import { LearningPathway } from '../../components/LearningPathway';

export default function PathwayScreen() {
  const [loading, setLoading] = useState(true);
  const [quizData, setQuizData] = useState(null);
  const [error, setError] = useState(null);
  const router = useRouter();

  useEffect(() => {
    const fetchQuiz = async () => {
      try {
        // TODO: Replace with your actual method to get the token
        const token = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJmcmVzaCI6ZmFsc2UsImlhdCI6MTc0NjQ1NzEyOSwianRpIjoiNDBhYTY1MjAtOWY1ZS00NTRkLThmMmUtYjlkOGY5YzM1OTQ4IiwidHlwZSI6ImFjY2VzcyIsInN1YiI6Im1vbmlsIiwibmJmIjoxNzQ2NDU3MTI5LCJjc3JmIjoiZjg4NjIxMzctZDM3Yi00YjhiLWJlNWMtNTZkMGI4Mjg4NjgxIiwiZXhwIjoxNzQ2NTQzNTI5fQ.qJ4XjZGC1WayYgzI-V25ZNGD5SWH46LJQHj4ydTvqU0';
        const response = await fetch('https://lingual-yn5c.onrender.com/api/quiz', {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        if (!response.ok) throw new Error('Failed to fetch quiz');
        const data = await response.json();
        setQuizData(data);
      } catch (err) {
        setError(err.message);
        Alert.alert('Error', err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchQuiz();
  }, []);

  // Placeholder for getting auth token
  async function getAuthToken() {
    // Implement your auth logic here
    return '';
  }

  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
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
  headerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 10,
    gap: 8,
  },
  backButton: {
    marginRight: 8,
    padding: 4,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
  },
});
