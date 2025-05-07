import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, SafeAreaView, StatusBar, ActivityIndicator, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { LearningPathway } from '../../components/LearningPathway';
import { FloatingTabBar } from '../../components/Navigation/FloatingTabBar';
import { getToken } from '../../services/Auth';
import { showMessage } from 'react-native-flash-message';
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

        // Transform questions to have a numeric 'id' field from 'quiz_id'
        const originalQuestions = data.questions || [];
        const transformedApiQuestions = originalQuestions.map(q => ({
          ...q,
          id: parseInt(q.quiz_id, 10),
        }));

        // Determine the current level for the pathway display
        // If API current_level is 12, pathway's currentLevel is 13
        const pathwayCurrentLevel = (data.current_level || 0) + 1;

        // Determine total questions for the entire pathway.
        // The API response for /api/quiz (based on the snippet) doesn't provide an overall total.
        // Using data.quiz_total if the API were to include it, otherwise defaulting to 50.
        // This '50' is based on previous "Homepage data" logs (quiz_total: 50).
        // This value should ideally come reliably from the API or app's state/config.
        const pathwayTotalQuestions = data.quiz_total || 50; // Assuming quiz_total might be in data, else 50.

        setQuizData({
          questions: transformedApiQuestions,
          current_level: pathwayCurrentLevel, // Used as currentLevel prop in LearningPathway
          total_questions: pathwayTotalQuestions, // Used as totalQuestions prop in LearningPathway
          // You might want to spread other original 'data' fields if they are needed elsewhere
          // ...data, // Uncomment and adjust if other fields from 'data' are needed directly
        });
      } catch (err) {
        setError(err.message || 'Error fetching quiz');
        showMessage({
          message: 'Error',
          description: 'Failed to load quiz. Please try again later.',
          type: 'danger',
          icon: 'danger',
          duration: 2500,
        });
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
