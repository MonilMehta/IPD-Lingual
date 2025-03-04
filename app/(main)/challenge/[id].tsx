import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, SafeAreaView, ActivityIndicator } from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { Header } from '../../../components/Header';
import { ChallengeQuiz } from '../../../components/Challenge/ChallengeQuiz';
import { ChallengeComplete } from '../../../components/Challenge/ChallengeComplete';

// Mock fetch function - replace with actual API call
const fetchChallengeData = async (challengeId) => {
  // Simulate API delay
  await new Promise(resolve => setTimeout(resolve, 1000));
  
  return {
    title: `Challenge ${challengeId}`,
    description: "Test your language skills with these questions!",
    questions: [
      {
        id: 1,
        type: 'multipleChoice',
        question: 'How do you say "hello" in Spanish?',
        options: ['Bonjour', 'Hola', 'Ciao', 'Guten tag'],
        correctAnswer: 'Hola',
      },
      {
        id: 2,
        type: 'translation',
        question: 'Translate "I am hungry" to Spanish',
        correctAnswer: 'Tengo hambre',
      },
      {
        id: 3,
        type: 'multipleChoice',
        question: 'Which word means "dog"?',
        options: ['Gato', 'Perro', 'Pájaro', 'Pez'],
        correctAnswer: 'Perro',
      },
      {
        id: 4,
        type: 'fill',
        question: 'Complete the sentence: Yo ___ estudiante.',
        options: ['soy', 'eres', 'es', 'son'],
        correctAnswer: 'soy',
      },
      {
        id: 5,
        type: 'multipleChoice',
        question: 'How do you say "thank you"?',
        options: ['Gracias', 'Por favor', 'De nada', 'Lo siento'],
        correctAnswer: 'Gracias',
      },
    ],
  };
};

export default function ChallengeScreen() {
  const { id } = useLocalSearchParams();
  const [loading, setLoading] = useState(true);
  const [challengeData, setChallengeData] = useState(null);
  const [currentStep, setCurrentStep] = useState(0);
  const [answers, setAnswers] = useState({});
  const [completed, setCompleted] = useState(false);
  const [score, setScore] = useState(0);

  useEffect(() => {
    const loadChallenge = async () => {
      try {
        const data = await fetchChallengeData(id);
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

  const handleNext = () => {
    if (currentStep < challengeData.questions.length - 1) {
      setCurrentStep(prev => prev + 1);
    } else {
      // Calculate score
      let correctCount = 0;
      challengeData.questions.forEach(question => {
        if (answers[question.id] === question.correctAnswer) {
          correctCount++;
        }
      });
      
      setScore(Math.round((correctCount / challengeData.questions.length) * 100));
      setCompleted(true);
    }
  };

  const handleComplete = () => {
    router.push('/pathway');
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.loadingContainer}>
        <Header title={`Challenge ${id}`} showBackButton={true} />
        <View style={styles.loadingContent}>
          <ActivityIndicator size="large" color="#FF6B00" />
          <Text style={styles.loadingText}>Loading challenge...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <Header 
        title={challengeData.title} 
        showBackButton={!completed} 
        progress={!completed ? (currentStep / challengeData.questions.length) : 1}
      />
      
      {!completed ? (
        <ChallengeQuiz
          currentQuestion={challengeData.questions[currentStep]}
          onAnswer={handleAnswer}
          onNext={handleNext}
          userAnswer={answers[challengeData.questions[currentStep].id]}
          isLastQuestion={currentStep === challengeData.questions.length - 1}
          questionNumber={currentStep + 1}
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
