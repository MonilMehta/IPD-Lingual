import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, SafeAreaView, ActivityIndicator, Alert } from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { getToken } from '../../../services/Auth';

import { ChallengeQuiz } from '../../../components/Challenge/ChallengeQuiz';
import { ChallengeComplete } from '../../../components/Challenge/ChallengeComplete';
import { showMessage } from 'react-native-flash-message';

// Fetch questions from API and memoize
const fetchChallengeData = async (challengeId, memoRef) => {
  if (memoRef.current) return memoRef.current;
  const token = await getToken();
  const response = await fetch('https://lingual-yn5c.onrender.com/api/quiz', {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
  });
  if (!response.ok) throw new Error('Failed to fetch challenge data');
  const data = await response.json();
  console.log('Fetched challenge data:');
  // Map API questions to ChallengeQuiz format
  const questions = data.questions.map((q, idx) => ({
    id: Number(q.quiz_id) || idx + 1,
    type: q.type === 'fill_in_the_blank' ? 'fill' : (q.type || 'multipleChoice'),
    question: q.question,
    options: q.options,
    correctAnswer: q.options[q.answer_index],
  }));
  const challengeData = {
    title: `Challenge ${challengeId}`,
    description: 'Test your language skills with these questions!',
    questions,
  };
  memoRef.current = challengeData;
  return challengeData;
};

export default function ChallengeScreen() {
  const { id, questionNumber } = useLocalSearchParams();
  const [loading, setLoading] = useState(true);
  const [challengeData, setChallengeData] = useState(null);
  const [currentStep, setCurrentStep] = useState(0);
  const [answers, setAnswers] = useState({});
  const [completed, setCompleted] = useState(false);
  const [score, setScore] = useState(0);
  const memoRef = useRef(null);

  useEffect(() => {
    const loadChallenge = async () => {
      try {
        const data = await fetchChallengeData(id, memoRef);
        setChallengeData(data);
      } catch (error) {
        console.error('Failed to load challenge:', error);
      } finally {
        setLoading(false);
      }
    };

    loadChallenge();
  }, [id]);

  const handleAnswer = (questionId, answer) => {
    setAnswers(prev => ({
      ...prev,
      [questionId]: answer
    }));
  };

  const handleNext = async () => {
    if (currentStep < challengeData.questions.length - 1) {
      setCurrentStep(prev => prev + 1);
    } else {
      // If last question is 10, 20, 30, 40, or 50, show special message
      const lastIndex = currentStep + 1;
      let specialMessage = '';
      if ([10, 20, 30, 40, 50].includes(lastIndex)) {
        specialMessage = `Congratulations! You've completed ${lastIndex} questions!`;
      }
      setCompleted(true);
      setScore(prevScore => prevScore);
      if (specialMessage) {
        showMessage({
          message: specialMessage,
          type: 'success',
          duration: 3000,
          icon: 'success',
        });

      }
    }
  };

  // When returning to home/pageway, just navigate
  const handleComplete = async () => {
    router.navigate('/pathway');
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.loadingContainer}>

        <View style={styles.loadingContent}>
          <ActivityIndicator size="large" color="#FF6B00" />
          <Text style={styles.loadingText}>Loading challenge...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>

      
      {!completed ? (
        <ChallengeQuiz
          currentQuestion={challengeData.questions[currentStep]}
          onAnswer={handleAnswer}
          onNext={handleNext}
          userAnswer={answers[challengeData.questions[currentStep].id]}
          isLastQuestion={currentStep === challengeData.questions.length - 1}
          questionNumber={questionNumber ? Number(questionNumber) : currentStep + 1}
          totalQuestions={challengeData.questions.length}
        />
      ) : (
        <ChallengeComplete 
          score={score}
          onComplete={handleComplete}
          challengeId={id}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  loadingContainer: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  loadingContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#666',
  },
});
