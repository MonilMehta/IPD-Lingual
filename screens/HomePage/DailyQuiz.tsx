import React from 'react';
import { View, Text, Image, StyleSheet, Animated, Easing } from 'react-native';

const MASCOT = require('../../assets/images/cat-pointing.png');
const MASCOT_DONE = require('../../assets/images/cat-laughing.png');
const MASCOT_CELEBRATE = require('../../assets/images/cat-celebrating.png');

function getLast7DaysStreak(streak:any, daily_challenge_done:any) {
  // Returns an array of 7 booleans, last is today
  // If streak >= 7, all true; else fill from end
  const arr = Array(7).fill(false);
  for (let i = 0; i < Math.min(streak, 7); i++) {
    arr[6 - i] = true;
  }
  // If today's challenge is not done, last is false
  if (!daily_challenge_done) arr[6] = false;
  return arr;
}

const dayNames = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

// Skeleton loader component
const SkeletonLoader = () => {
  const animatedValue = React.useRef(new Animated.Value(0)).current;
  React.useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(animatedValue, {
          toValue: 1,
          duration: 900,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: false,
        }),
        Animated.timing(animatedValue, {
          toValue: 0,
          duration: 900,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: false,
        }),
      ])
    ).start();
  }, [animatedValue]);
  const bgColor = animatedValue.interpolate({
    inputRange: [0, 1],
    outputRange: ['#FFE5CC', '#FFD1A3'],
  });
  return (
    <Animated.View style={[styles.skeleton, { backgroundColor: bgColor }]} />
  );
};

export const DailyQuiz = ({ homepage, loading, error }) => {
  const challengeWord = homepage?.challenge_word || homepage?.daily_challenge_word || null;
  const streak = homepage?.daily_challenge_streak || 0;
  const dailyDone = homepage?.daily_challenge_done;
  const streakArr = getLast7DaysStreak(streak, dailyDone);

  // Always show mascot and title at the bottom
  return (
    <View style={styles.container}>
      {/* Main content */}
      <View style={{ flex: 1, width: '100%' }}>
        {loading ? (
          <View style={styles.loaderContainer}>
            <SkeletonLoader />
            <SkeletonLoader />
            <SkeletonLoader />
          </View>
        ) : error ? (
          <Text style={styles.error}>{error}</Text>
        ) : dailyDone ? (
          <View style={styles.completedCard}>
            <Image source={MASCOT_CELEBRATE} style={styles.celebrateMascot} />
            <View style={styles.checkmarkCircle}>
              <Text style={styles.checkmark}>✓</Text>
            </View>
            <Text style={styles.completedTextBig}>Challenge Completed!</Text>
            <Text style={styles.streakLabel}>Streak</Text>
            <View style={styles.streakRow}>
              {streakArr.map((done, i) => (
                <View key={i} style={[styles.streakCircle, done && styles.streakCircleFilled]}>
                  <Text style={styles.streakDay}>{dayNames[(new Date().getDay() + i - 6 + 7) % 7]}</Text>
                </View>
              ))}
            </View>
            <Text style={styles.streakCount}>{streak} day streak</Text>
          </View>
        ) : (
          <>
            <Text style={styles.instruction}>
              Find and point your camera at a <Text style={styles.word}>{challengeWord}</Text>!
            </Text>
            <Text style={styles.streakLabel}>Streak</Text>
            <View style={styles.streakRow}>
              {streakArr.map((done, i) => (
                <View key={i} style={[styles.streakCircle, done && styles.streakCircleFilled]}>
                  <Text style={styles.streakDay}>{dayNames[(new Date().getDay() + i - 6 + 7) % 7]}</Text>
                </View>
              ))}
            </View>
            <Text style={styles.streakCount}>{streak} day streak</Text>
          </>
        )}
      </View>

    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    backgroundColor: '#FFF',
    borderRadius: 16,
    padding: 20,
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 2,
    minHeight: 340,
    justifyContent: 'space-between',
  },
  mascot: {
    width: 80,
    height: 80,
    marginBottom: 2,
    marginTop: 8,
  },
  celebrateMascot: {
    width: 110,
    height: 110,
    alignSelf: 'center',
    marginBottom: 8,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FF6B00',
    marginBottom: 6,
    textAlign: 'center',
  },
  word: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#FF6B00',
    marginBottom: 6,
  },
  instruction: {
    fontSize: 18,
    color: '#444',
    textAlign: 'center',
    marginBottom: 10,
  },
  completedText: {
    fontSize: 18,
    color: '#4CAF50',
    fontWeight: 'bold',
    marginBottom: 10,
  },
  completedTextBig: {
    fontSize: 22,
    color: '#FF6B00',
    fontWeight: 'bold',
    marginBottom: 8,
    textAlign: 'center',
  },
  streakLabel: {
    fontSize: 15,
    color: '#888',
    marginTop: 8,
    marginBottom: 2,
    fontWeight: '600',
    textAlign: 'center',
  },
  streakRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginVertical: 4,
    gap: 4,
  },
  streakCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: '#FF6B00',
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: 2,
    backgroundColor: '#FFF',
  },
  streakCircleFilled: {
    backgroundColor: '#FF6B00',
  },
  streakDay: {
    fontSize: 10,
    color: '#FF6B00',
    fontWeight: 'bold',
  },
  streakCount: {
    fontSize: 14,
    color: '#FF6B00',
    fontWeight: 'bold',
    marginTop: 2,
    textAlign: 'center',
  },
  error: {
    color: 'red',
    fontSize: 15,
    textAlign: 'center',
  },
  completedCard: {
    backgroundColor: '#FFF6ED',
    borderRadius: 16,
    padding: 18,
    alignItems: 'center',
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#FFD1A3',
    shadowColor: '#FF6B00',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 1,
  },
  checkmarkCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#FF6B00',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
    shadowColor: '#FF6B00',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12,
    shadowRadius: 6,
    elevation: 2,
  },
  checkmark: {
    color: '#FFF',
    fontSize: 28,
    fontWeight: 'bold',
    marginTop: -2,
  },
  loaderContainer: {
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    marginVertical: 24,
  },
  skeleton: {
    width: '90%',
    height: 24,
    borderRadius: 8,
    marginVertical: 6,
    alignSelf: 'center',
  },
  bottomSection: {
    alignItems: 'center',
    marginTop: 10,
  },
});
