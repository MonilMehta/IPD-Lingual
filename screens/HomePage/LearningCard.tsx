import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Dimensions, Image } from 'react-native';
import { Trophy, BookMarked, ArrowRight } from 'lucide-react-native';
import { MotiView } from 'moti';

const { width } = Dimensions.get('window');

const mascotImages = [
  require('../../assets/images/cat-reading.png'),
  require('../../assets/images/cat-thinking.png'),
  require('../../assets/images/cat-laughing.png'),
  require('../../assets/images/cat-celebrating.png'),
  require('../../assets/images/cat-photo.png'),
];
const mascotMessages = [
  'Keep going, you are doing great! 🐾',
  'Ollie says: Every word is a step closer! 📚',
  'Almost there! Ollie is proud of you! 😸',
  'Celebrate your progress! 🎉',
  'Let’s learn something new today! ✨',
];
const levelEmojis = ['🌱', '📖', '📝', '🎯', '🏅', '🚀', '🌟', '🦉', '🎓', '🏆'];

export const LearningPathway = ({ navigation, homepage }) => {
  // Use homepage data if available, else fallback
  const progress = homepage
    ? {
        level: homepage.current_level ? `Level ${homepage.current_level}` : 'Beginner',
        lessonsCompleted: homepage.quiz_completed || 0,
        totalLessons: homepage.quiz_total || 1,
        currentLevel: homepage.current_level || 1,
      }
    : {
        level: 'Beginner',
        lessonsCompleted: 0,
        totalLessons: 1,
        currentLevel: 1,
      };

  // 10 levels, each 5 lessons (or spread evenly)
  const levels = 10;
  const lessonsPerLevel = Math.max(1, Math.floor(progress.totalLessons / levels));
  const levelDots = Array.from({ length: levels }, (_, i) => {
    const lessonNum = (i + 1) * lessonsPerLevel;
    const isActive = progress.lessonsCompleted >= lessonNum;
    return {
      emoji: levelEmojis[i % levelEmojis.length],
      isActive,
      lessonNum,
    };
  });
  // Always show a dot at the end for 100%
  levelDots[levels - 1].lessonNum = progress.totalLessons;

  // Progress dot (2%) at the end
  const progressPercentage = (progress.lessonsCompleted / progress.totalLessons) * 100;
  const mascotIndex = Math.min(Math.floor(progressPercentage / 20), mascotImages.length - 1);
  const mascotImage = mascotImages[mascotIndex];
  const mascotMessage = mascotMessages[mascotIndex];

  return (
    <MotiView 
      style={styles.container}
      from={{ opacity: 0, translateY: 20 }}
      animate={{ opacity: 1, translateY: 0 }}
      transition={{ type: 'timing', duration: 800 }}
    >
      <Text style={styles.title}>Continue Learning 📚 </Text>
      <View style={styles.card}>
        <View style={styles.progressInfo}>
          <View style={styles.levelBadge}>
            <Text style={styles.levelText}>{progress.level} {levelEmojis[(progress.currentLevel-1)%levelEmojis.length]}</Text>
          </View>
        </View>
        <View style={styles.progressBarContainer}>
          <View style={styles.progressBar}>
            {/* Level dots */}
            {levelDots.map((dot, idx) => (
              <View key={idx} style={{
                position: 'absolute',
                left: `${(dot.lessonNum / progress.totalLessons) * 100}%`,
                top: -10,
                alignItems: 'center',
                width: 28,
              }}>
                <Text style={{ fontSize: 18, opacity: dot.isActive ? 1 : 0.3 }}>{dot.emoji}</Text>
              </View>
            ))}
            {/* Progress fill */}
            <MotiView 
              style={[styles.progressFill]}
              from={{ width: 0 }}
              animate={{ width: `${progressPercentage}%` }}
              transition={{ type: 'timing', duration: 1000, delay: 300 }}
            />
            {/* Progress indicator dot at the actual progress position */}
            <View style={{
              position: 'absolute',
              left: `calc(${progressPercentage}% - 10px)`, // Position dot at progress
              top: -6,
              width: 20,
              height: 20,
              borderRadius: 10,
              backgroundColor: '#FF6B00',
              borderWidth: 2,
              borderColor: '#FFF',
              justifyContent: 'center',
              alignItems: 'center',
              zIndex: 2,
            }}>
              <Text style={{ color: '#FFF', fontWeight: 'bold', fontSize: 10 }}>{Math.round(progressPercentage)}%</Text>
            </View>
          </View>
          <View style={styles.progressLabels}>
            <Text style={styles.progressText}>
              {progress.lessonsCompleted}/{progress.totalLessons} lessons
            </Text>
            <Text style={styles.progressPercentage}>{Math.round(progressPercentage)}%</Text>
          </View>
        </View>
        <View style={{ alignItems: 'center', marginBottom: 12 }}>
          <Image source={mascotImage} style={{ width: 70, height: 70, marginBottom: 4 }} resizeMode="contain" />
          <Text style={{ color: '#FF6B00', fontWeight: '600', fontSize: 15, textAlign: 'center' }}>{mascotMessage}</Text>
        </View>
        <TouchableOpacity 
          style={styles.continueButton}
          onPress={() => navigation.navigate('/learn')}
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
    marginBottom: 160,
    paddingHorizontal: 4,
    marginHorizontal: 20,
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