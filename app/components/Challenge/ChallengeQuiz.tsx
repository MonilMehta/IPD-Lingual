import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image } from 'react-native';
import { MotiView } from 'moti';
import { useRouter } from 'expo-router';
import { getToken } from '../../services/Auth';
import { ChallengeComplete } from './ChallengeComplete';
import { ArrowLeft } from 'lucide-react-native';

// Mascot images
const mascots = [
  require('../../assets/images/cat-laughing.png'),
  require('../../assets/images/cat-pointing.png'),
  require('../../assets/images/cat-pointing2.png'),
  require('../../assets/images/cat-sayinghi.png'),
  require('../../assets/images/cat-sleeping.png'),
  require('../../assets/images/cat-sleeping2.png'),
  require('../../assets/images/cat-smiling.png'),
  require('../../assets/images/cat-thinking.png'),
];

type QuestionType = {
  id: number;
  type: 'multipleChoice' | 'translation' | 'fill';
  question: string;
  options?: string[];
  correctAnswer: string;
};

type ChallengeQuizProps = {
  currentQuestion: QuestionType;
  onAnswer: (questionId: number, answer: string) => void;
  onNext: () => void;
  userAnswer: string | null;
  isLastQuestion: boolean;
  questionNumber: number;
  totalQuestions: number;
};

async function completeQuiz(quizIndex: number) {
  const token = await getToken();
  const response = await fetch(`https://lingual-yn5c.onrender.com/api/complete_quiz?quiz_index=${quizIndex}`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
  });
  if (!response.ok) throw new Error('Failed to complete quiz');
  return true;
}

export const ChallengeQuiz = ({ 
  currentQuestion, 
  onAnswer, 
  onNext, 
  userAnswer, 
  isLastQuestion,
  questionNumber,
  totalQuestions,
}: ChallengeQuizProps) => {
  const [showFeedback, setShowFeedback] = useState(false);
  const [selectedOption, setSelectedOption] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [showMilestone, setShowMilestone] = useState(false);
  const router = useRouter();
  // Compute questionNo based on currentQuestion.id only once per question
  const questionNo = React.useMemo(() => {
    if (currentQuestion.id < 10) return 10;
    if (currentQuestion.id < 20) return 20;
    if (currentQuestion.id < 30) return 30;
    if (currentQuestion.id < 40) return 40;
    return 50;
  }, [currentQuestion.id]);

  // Pick a mascot based on question number for variety
  const mascot = mascots[questionNumber % mascots.length];

  // Fix typo: fallback to 'optiions' if 'options' is missing
  const options = currentQuestion.options || currentQuestion.optiions || [];

  const isAnswerCorrect = selectedOption === currentQuestion.correctAnswer;

  const handleOptionSelect = async (option: string) => {
    setSelectedOption(option);
    setShowFeedback(true);
    onAnswer(currentQuestion.id, option);
    // If last question and correct, call complete endpoint
    if (isLastQuestion && option === currentQuestion.correctAnswer) {
      setSubmitting(true);
      try {
        await completeQuiz(currentQuestion.id); // Use question id as quiz index
      } catch {}
      setSubmitting(false);
    }
  };

  const handleNext = () => {
    setShowFeedback(false);
    setSelectedOption(null);
    onNext();
  };

  const handleTryAgain = () => {
    setShowFeedback(false);
    setSelectedOption(null);
  };

  // Helper to call complete endpoint before navigating to main
  const handleGoToMain = async () => {
    try {
      await completeQuiz(currentQuestion.id);
      if ([10, 20, 30, 40, 50].includes(Number(currentQuestion.id))) {
        setShowMilestone(true);
      } else {
        router.navigate('/(main)/home');
      }
    } catch {
      router.navigate('/(main)/home');
    }
  };

  return (
    <View style={styles.container}>
      {/* Back Button */}
      
      <View style={styles.progressContainer}>
      <TouchableOpacity
        style={{ position: 'absolute', top: 32, left: 16, zIndex: 10, padding: 8 }}
        onPress={() => router.back()}
      >
       <ArrowLeft size={28} color="#ff6b00" />
      </TouchableOpacity>
        <Text style={styles.progressText}>Question {currentQuestion.id} of {questionNo}</Text>
      </View>
      <MotiView
        key={`question-${currentQuestion.id}`}
        from={{ opacity: 0, translateX: 20 }}
        animate={{ opacity: 1, translateX: 0 }}
        transition={{ type: 'timing', duration: 500 }}
        style={styles.questionContainer}
      >
        <Text style={styles.questionText}>{currentQuestion.question}</Text>
        <Image source={mascot} style={styles.mascot} resizeMode="contain" />
        <View style={styles.optionsContainer}>
          {options.map((option, index) => (
            <TouchableOpacity
              key={index}
              style={[
                styles.optionButton,
                selectedOption === option && styles.selectedOption,
                showFeedback && selectedOption === option && (selectedOption === currentQuestion.correctAnswer ? styles.correctOption : styles.wrongOption),
              ]}
              onPress={() => handleOptionSelect(option)}
              disabled={showFeedback || submitting}
            >
              <Text 
                style={[
                  styles.optionText,
                  selectedOption === option && styles.selectedOptionText,
                  showFeedback && selectedOption === option && (selectedOption === currentQuestion.correctAnswer ? styles.correctOptionText : styles.wrongOptionText),
                ]}
              >
                {option}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
        {showFeedback && (
          <View style={{ marginTop: 24 }}>
            {isAnswerCorrect ? (
              <>
                <Text style={[styles.feedbackText, { color: '#4CAF50', textAlign: 'center', marginBottom: 12 }]}>Correct!</Text>
                <TouchableOpacity
                  style={[styles.nextButton, styles.correctNextButton]}
                  onPress={handleNext}
                  disabled={submitting}
                >
                  <Text style={styles.nextButtonText}>
                    {isLastQuestion ? 'Complete Quiz' : 'Next Question'}
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.nextButton, { backgroundColor: '#FF6B00', marginTop: 12 }]}
                  onPress={handleGoToMain}
                  disabled={submitting}
                >
                  <Text style={styles.nextButtonText}>Go to Main Screen</Text>
                </TouchableOpacity>
              </>
            ) : (
              <>
                <Text style={[styles.feedbackText, { color: '#F44336', textAlign: 'center', marginBottom: 12 }]}>Incorrect. Try again!</Text>
                <TouchableOpacity
                  style={[styles.nextButton, styles.wrongNextButton]}
                  onPress={handleTryAgain}
                  disabled={submitting}
                >
                  <Text style={styles.nextButtonText}>Try Again</Text>
                </TouchableOpacity>
              </>
            )}
          </View>
        )}
      </MotiView>
      {showMilestone && (
        <View style={styles.overlay}>
          <ChallengeComplete />
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
  },
  progressContainer: {
    marginBottom: 24,
    alignItems: 'center',
    paddingTop:32,
  },
  progressText: {
    fontSize: 24,
    color: '#666',
    fontWeight: '500',
  },
  questionContainer: {
    backgroundColor: '#FFF',
    borderRadius: 16,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 4,
  },
  questionText: {
    fontSize: 20,
    fontWeight: '600',
    color: '#333',
    marginBottom: 24,
  },
  optionsContainer: {
    marginTop: 8,
  },
  optionButton: {
    backgroundColor: '#F0F0F0',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  selectedOption: {
    borderColor: '#FF6B00',
    backgroundColor: 'rgba(255, 107, 0, 0.05)',
  },
  correctOption: {
    backgroundColor: 'rgba(76, 175, 80, 0.1)',
    borderColor: '#4CAF50',
  },
  wrongOption: {
    backgroundColor: 'rgba(244, 67, 54, 0.1)',
    borderColor: '#F44336',
  },
  optionText: {
    fontSize: 16,
    color: '#333',
  },
  selectedOptionText: {
    color: '#FF6B00',
    fontWeight: '500',
  },
  correctOptionText: {
    color: '#4CAF50',
    fontWeight: '500',
  },
  wrongOptionText: {
    color: '#F44336',
    fontWeight: '500',
  },
  inputContainer: {
    marginTop: 16,
  },
  textInput: {
    backgroundColor: '#F0F0F0',
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  submitButton: {
    backgroundColor: '#FF6B00',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    marginTop: 16,
  },
  submitButtonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '600',
  },
  feedbackContainer: {
    padding: 16,
    borderRadius: 12,
    marginTop: 16,
  },
  correctFeedback: {
    backgroundColor: 'rgba(76, 175, 80, 0.1)',
    borderWidth: 1,
    borderColor: '#4CAF50',
  },
  wrongFeedback: {
    backgroundColor: 'rgba(244, 67, 54, 0.1)',
    borderWidth: 1,
    borderColor: '#F44336',
  },
  feedbackText: {
    fontSize: 16,
    fontWeight: '500',
  },
  nextButton: {
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    marginTop: 24,
  },
  correctNextButton: {
    backgroundColor: '#4CAF50',
  },
  wrongNextButton: {
    backgroundColor: '#666',
  },
 nextButtonText: {
    fontSize: 16,
    color: '#FFF',
    fontWeight: '600',
    },
  mascot: {
    width: 100,
    height: 100,
    alignSelf: 'center',
    marginBottom: 16,
  },
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(255,255,255,0.95)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 100,
  },
});