import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Trophy, BookMarked } from 'lucide-react-native';

export const LearningPathway = ({ navigation }) => {
  const progress = {
    level: 'Beginner',
    lessonsCompleted: 12,
    totalLessons: 30,
    streak: 5,
  };

  return (
    <View style={styles.container}>
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
        <View style={styles.progressBar}>
          <View 
            style={[
              styles.progressFill, 
              { width: `${(progress.lessonsCompleted / progress.totalLessons) * 100}%` }
            ]} 
          />
        </View>
        <Text style={styles.progressText}>
          {progress.lessonsCompleted}/{progress.totalLessons} lessons completed
        </Text>
        <TouchableOpacity 
          style={styles.continueButton}
          onPress={() => navigation.navigate('Lessons')}
        >
          <BookMarked size={20} color="#FFF" />
          <Text style={styles.continueButtonText}>Continue Learning</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: 24,
    paddingHorizontal: 6,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 12,
  },
  card: {
    backgroundColor: '#FFF',
    borderRadius: 16,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  progressInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  levelBadge: {
    backgroundColor: '#E3F2FD',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  levelText: {
    color: '#1976D2',
    fontWeight: '600',
  },
  streakContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  streakText: {
    marginLeft: 4,
    color: '#666',
    fontWeight: '500',
  },
  progressBar: {
    height: 8,
    backgroundColor: '#E0E0E0',
    borderRadius: 4,
    marginBottom: 8,
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#4CAF50',
    borderRadius: 4,
  },
  progressText: {
    color: '#666',
    fontSize: 14,
    marginBottom: 16,
  },
  continueButton: {
    backgroundColor: '#FF6B00',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 12,
    borderRadius: 12,
  },
  continueButtonText: {
    color: '#FFF',
    fontWeight: '600',
    marginLeft: 8,
  },
});