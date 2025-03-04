import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextInput } from 'react-native';
import { MotiView } from 'moti';

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

export const ChallengeQuiz = ({ 
  currentQuestion, 
  onAnswer, 
  onNext, 
  userAnswer, 
  isLastQuestion,
  questionNumber,
  totalQuestions
}: ChallengeQuizProps) => {
  const [textInput, setTextInput] = useState('');
  const [showFeedback, setShowFeedback] = useState(false);
  
  const isAnswerCorrect = userAnswer === currentQuestion.correctAnswer;
  
  const handleOptionSelect = (option: string) => {
    onAnswer(currentQuestion.id, option);
    setShowFeedback(true);
  };
  
  const handleTextSubmit = () => {
    if (textInput.trim()) {
      onAnswer(currentQuestion.id, textInput.trim());
      setShowFeedback(true);
    }
  };

  const handleNext = () => {
    setShowFeedback(false);
    setTextInput('');
    onNext();
  };

  const renderQuestionContent = () => {
    switch (currentQuestion.type) {
      case 'multipleChoice':
        return (
          <View style={styles.optionsContainer}>
            {currentQuestion.options.map((option, index) => (
              <TouchableOpacity
                key={index}
                style={[
                  styles.optionButton,
                  userAnswer === option && styles.selectedOption,
                  showFeedback && userAnswer === option && isAnswerCorrect && styles.correctOption,
                  showFeedback && userAnswer === option && !isAnswerCorrect && styles.wrongOption,
                ]}
                onPress={() => handleOptionSelect(option)}
                disabled={showFeedback}
              >
                <Text 
                  style={[
                    styles.optionText,
                    userAnswer === option && styles.selectedOptionText,
                    showFeedback && userAnswer === option && isAnswerCorrect && styles.correctOptionText,
                    showFeedback && userAnswer === option && !isAnswerCorrect && styles.wrongOptionText,
                  ]}
                >
                  {option}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        );
      
      case 'translation':
        return (
          <View style={styles.inputContainer}>
            <TextInput
              style={styles.textInput}
              placeholder="Type your answer here"
              value={textInput}
              onChangeText={setTextInput}
              editable={!showFeedback}
              autoCapitalize="none"
            />
            
            {!userAnswer && (
              <TouchableOpacity 
                style={styles.submitButton}
                onPress={handleTextSubmit}
              >
                <Text style={styles.submitButtonText}>Check</Text>
              </TouchableOpacity>
            )}
            
            {showFeedback && (
              <MotiView 
                from={{ opacity: 0, translateY: 10 }}
                animate={{ opacity: 1, translateY: 0 }}
                style={[styles.feedbackContainer, isAnswerCorrect ? styles.correctFeedback : styles.wrongFeedback]}
              >
                <Text style={styles.feedbackText}>
                  {isAnswerCorrect 
                    ? "Correct!" 
                    : `The correct answer is: ${currentQuestion.correctAnswer}`}
                </Text>
              </MotiView>
            )}
          </View>
        );

      case 'fill':
        return (
          <View style={styles.optionsContainer}>
            {currentQuestion.options.map((option, index) => (
              <TouchableOpacity
                key={index}
                style={[
                  styles.optionButton,
                  userAnswer === option && styles.selectedOption,
                  showFeedback && userAnswer === option && isAnswerCorrect && styles.correctOption,
                  showFeedback && userAnswer === option && !isAnswerCorrect && styles.wrongOption,
                ]}
                onPress={() => handleOptionSelect(option)}
                disabled={showFeedback}
              >
                <Text 
                  style={[
                    styles.optionText,
                    userAnswer === option && styles.selectedOptionText,
                    showFeedback && userAnswer === option && isAnswerCorrect && styles.correctOptionText,
                    showFeedback && userAnswer === option && !isAnswerCorrect && styles.wrongOptionText,
                  ]}
                >
                  {option}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        );
      
      default:
        return null;
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.progressContainer}>
        <Text style={styles.progressText}>Question {questionNumber} of {totalQuestions}</Text>
      </View>
      
      <MotiView
        key={`question-${currentQuestion.id}`}
        from={{ opacity: 0, translateX: 20 }}
        animate={{ opacity: 1, translateX: 0 }}
        transition={{ type: 'timing', duration: 500 }}
        style={styles.questionContainer}
      >
        <Text style={styles.questionText}>{currentQuestion.question}</Text>
        
        {renderQuestionContent()}
        
        {showFeedback && (
          <TouchableOpacity 
            style={[
              styles.nextButton,
              isAnswerCorrect ? styles.correctNextButton : styles.wrongNextButton
            ]}
            onPress={handleNext}
          >
            <Text style={styles.nextButtonText}>
              {isLastQuestion ? "Complete Challenge" : "Next Question"}
            </Text>
          </TouchableOpacity>
        )}
      </MotiView>
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
  },
  progressText: {
    fontSize: 16,
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
});