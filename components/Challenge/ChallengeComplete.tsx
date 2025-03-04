import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image } from 'react-native';
import { MotiView } from 'moti';
import { Trophy, Star } from 'lucide-react-native';

type ChallengeCompleteProps = {
  score: number;
  onComplete: () => void;
  challengeId: string | number;
};

export const ChallengeComplete = ({ score, onComplete, challengeId }: ChallengeCompleteProps) => {
  const stars = score >= 80 ? 3 : score >= 60 ? 2 : 1;
  
  const renderStars = () => {
    return Array.from({ length: 3 }).map((_, index) => (
      <MotiView
        key={index}
        style={styles.starContainer}
        from={{ opacity: 0, scale: 0 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{
          type: 'spring',
          delay: 600 + index * 200,
          damping: 12,
        }}
      >
        <Star
          size={40}
          fill={index < stars ? '#FFD700' : '#D1D1D1'}
          color={index < stars ? '#FFA000' : '#BDBDBD'}
          strokeWidth={1}
        />
      </MotiView>
    ));
  };

  return (
    <View style={styles.container}>
      <MotiView
        from={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ type: 'timing', duration: 500 }}
        style={styles.card}
      >
        <MotiView
          from={{ opacity: 0, translateY: -20 }}
          animate={{ opacity: 1, translateY: 0 }}
          transition={{ type: 'spring', delay: 300, damping: 14 }}
        >
          <View style={styles.trophyContainer}>
            <Trophy size={60} color="#FFA000" fill="#FFD700" />
          </View>
          <Text style={styles.congratsText}>Challenge Complete!</Text>
        </MotiView>
        
        <MotiView
          from={{ opacity: 0, translateY: 20 }}
          animate={{ opacity: 1, translateY: 0 }}
          transition={{ type: 'timing', delay: 400, duration: 500 }}
        >
          <Text style={styles.scoreText}>Your Score</Text>
          <Text style={styles.scoreValue}>{score}%</Text>
          
          <View style={styles.starsContainer}>
            {renderStars()}
          </View>
          
          <View style={styles.messageContainer}>
            <Text style={styles.messageText}>
              {score >= 80 
                ? 'Excellent work! You\'ve mastered this challenge!' 
                : score >= 60 
                ? 'Great job! Keep practicing to improve your skills.' 
                : 'Good effort! Try again to improve your score.'}
            </Text>
          </View>
        </MotiView>
        
        <TouchableOpacity 
          style={styles.continueButton}
          onPress={onComplete}
        >
          <Text style={styles.continueButtonText}>Continue</Text>
        </TouchableOpacity>
      </MotiView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  card: {
    backgroundColor: '#FFF',
    borderRadius: 20,
    padding: 24,
    width: '100%',
    maxWidth: 400,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 5,
  },
  trophyContainer: {
    backgroundColor: 'rgba(255, 215, 0, 0.15)',
    borderRadius: 40,
    width: 80,
    height: 80,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
    alignSelf: 'center',
  },
  congratsText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 24,
    textAlign: 'center',
  },
  scoreText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#666',
    textAlign: 'center',
  },
  scoreValue: {
    fontSize: 48,
    fontWeight: 'bold',
    color: '#FF6B00',
    textAlign: 'center',
    marginVertical: 8,
  },
  starsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginVertical: 16,
  },
  starContainer: {
    marginHorizontal: 8,
  },
  messageContainer: {
    marginVertical: 16,
    backgroundColor: 'rgba(0, 0, 0, 0.03)',
    borderRadius: 12,
    padding: 16,
  },
  messageText: {
    fontSize: 15,
    color: '#555',
    textAlign: 'center',
    lineHeight: 22,
  },
  continueButton: {
    backgroundColor: '#FF6B00',
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 24,
    width: '100%',
    alignItems: 'center',
    marginTop: 16,
  },
  continueButtonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '600',
  },
});
