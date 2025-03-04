import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Dimensions } from 'react-native';
import { Trophy, BookMarked, ArrowRight } from 'lucide-react-native';
import { MotiView } from 'moti';

const { width } = Dimensions.get('window');

export const LearningPathway = ({ navigation }) => {
  const progress = {
    level: 'Beginner',
    lessonsCompleted: 12,
    totalLessons: 30,
    streak: 5,
  };

  const progressPercentage = (progress.lessonsCompleted / progress.totalLessons) * 100;

  return (
    <MotiView 
      style={styles.container}
      from={{ opacity: 0, translateY: 20 }}
      animate={{ opacity: 1, translateY: 0 }}
      transition={{ type: 'timing', duration: 800 }}
    >
      <Text style={styles.title}>Your Learning Pathway</Text>
      <View style={styles.card}>
        <View style={styles.progressInfo}>
          <View style={styles.levelBadge}>
            <Text style={styles.levelText}>{progress.level}</Text>
          </View>
          <View style={styles.streakContainer}>
            <Trophy size={16} color="#FFD700" />
            <Text style={styles.streakText}>{progress.streak} day streak!</Text>
          </View>
        </View>
        
        <View style={styles.progressBarContainer}>
          <View style={styles.progressBar}>
            <MotiView 
              style={[styles.progressFill]}
              from={{ width: 0 }}
              animate={{ width: `${progressPercentage}%` }}
              transition={{ type: 'timing', duration: 1000, delay: 300 }}
            />
            <MotiView 
              style={styles.progressIndicator}
              from={{ opacity: 0, scale: 0 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ type: 'spring', delay: 1000 }}
            />
          </View>
          <View style={styles.progressLabels}>
            <Text style={styles.progressText}>
              {progress.lessonsCompleted}/{progress.totalLessons} lessons
            </Text>
            <Text style={styles.progressPercentage}>{Math.round(progressPercentage)}%</Text>
          </View>
        </View>
        
        <TouchableOpacity 
          style={styles.continueButton}
          onPress={() => navigation.navigate('pathway')}
        >
          <BookMarked size={20} color="#FFF" />
          <Text style={styles.continueButtonText}>Continue Learning</Text>
          <ArrowRight size={16} color="#FFF" style={styles.arrowIcon} />
        </TouchableOpacity>
      </View>
    </MotiView>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: 24,
    paddingHorizontal: 4,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 16,
  },
  card: {
    backgroundColor: '#FFF',
    borderRadius: 20,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 4,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.03)',
  },
  progressInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  levelBadge: {
    backgroundColor: 'rgba(255, 107, 0, 0.1)',
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 12,
  },
  levelText: {
    color: '#FF6B00',
    fontWeight: '700',
    fontSize: 14,
  },
  streakContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 215, 0, 0.15)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  streakText: {
    marginLeft: 6,
    color: '#B8860B',
    fontWeight: '600',
    fontSize: 13,
  },
  progressBarContainer: {
    marginBottom: 22,
  },
  progressBar: {
    height: 12,
    backgroundColor: '#E0E0E0',
    borderRadius: 6,
    marginBottom: 8,
    position: 'relative',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#FF6B00',
    borderRadius: 6,
    position: 'absolute',
    left: 0,
    top: 0,
  },
  progressIndicator: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#FF6B00',
    position: 'absolute',
    right: -2,
    top: -4,
    shadowColor: '#FF6B00',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.5,
    shadowRadius: 4,
    elevation: 3,
  },
  progressLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  progressText: {
    color: '#666',
    fontSize: 14,
    fontWeight: '500',
  },
  progressPercentage: {
    color: '#FF6B00',
    fontSize: 16,
    fontWeight: 'bold',
  },
  continueButton: {
    backgroundColor: '#FF6B00',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 14,
    borderRadius: 14,
    shadowColor: '#FF6B00',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
    elevation: 3,
  },
  continueButtonText: {
    color: '#FFF',
    fontWeight: '600',
    marginLeft: 8,
    fontSize: 16,
  },
  arrowIcon: {
    marginLeft: 8,
  }
});