import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { MotiView } from 'moti';
import { Award, ChevronRight } from 'lucide-react-native';

export const Challenge = ({ navigation }) => {
  const today = new Date();
  const dateString = today.toLocaleDateString('en-US', { month: 'long', day: 'numeric' });
  console.log('Challenge component rendered');
  const challenge = {
    title: "Complete 5 Camera Translations",
    progress: 2,
    total: 5,
    xp: 50,
  };
  
  const progressPercentage = (challenge.progress / challenge.total) * 100;
  
  return (
    <MotiView 
      style={styles.container}
      from={{ opacity: 0, translateY: 20 }}
      animate={{ opacity: 1, translateY: 0 }}
      transition={{ type: 'timing', duration: 800, delay: 400 }}
    >
      <View style={styles.header}>
        <Text style={styles.title}>Daily Challenge</Text>
        <Text style={styles.date}>{dateString}</Text>
      </View>
      
      <TouchableOpacity 
        style={styles.card}
        onPress={() => navigation.navigate('/(main)/challenges')}
        activeOpacity={0.8}
      >
        <View style={styles.cardContent}>
          <View style={styles.iconContainer}>
            <Award size={24} color="#FFF" />
          </View>
          
          <View style={styles.challengeDetails}>
            <View style={styles.challengeHeader}>
              <Text style={styles.challengeTitle}>{challenge.title}</Text>
              <Text style={styles.xpBadge}>+{challenge.xp} XP</Text>
            </View>
            
            <View style={styles.progressBarContainer}>
              <View style={styles.progressBar}>
                <MotiView 
                  style={[styles.progressFill]}
                  from={{ width: '0%' }}
                  animate={{ width: `${progressPercentage}%` }}
                  transition={{ type: 'timing', duration: 1000, delay: 600 }}
                />
              </View>
              
              <Text style={styles.progressText}>
                {challenge.progress}/{challenge.total} completed
              </Text>
            </View>
          </View>
          
          <ChevronRight size={20} color="#999" />
        </View>
      </TouchableOpacity>
    </MotiView>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: 28,
    paddingHorizontal: 4,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
    paddingHorizontal: 4,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
  },
  date: {
    fontSize: 14,
    color: '#666',
  },
  card: {
    backgroundColor: '#FFF',
    borderRadius: 16,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 5,
    elevation: 2,
  },
  cardContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconContainer: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#FF6B00',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
  },
  challengeDetails: {
    flex: 1,
  },
  challengeHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  challengeTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    flex: 1,
  },
  xpBadge: {
    backgroundColor: 'rgba(255, 107, 0, 0.1)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    fontSize: 12,
    fontWeight: '700',
    color: '#FF6B00',
  },
  progressBarContainer: {
    width: '100%',
  },
  progressBar: {
    height: 8,
    backgroundColor: '#E0E0E0',
    borderRadius: 4,
    marginBottom: 6,
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#FF6B00',
    borderRadius: 4,
  },
  progressText: {
    fontSize: 12,
    color: '#666',
  },
});
