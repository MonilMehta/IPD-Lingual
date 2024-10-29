import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MotiView } from 'moti';
import { Search, User, Book, Camera, Mic, Trophy, Settings } from 'lucide-react-native';

const HomeScreen = ({ navigation }) => {
  const username = "Alex"; // Replace with actual username from authentication

  const categories = [
    { id: 1, title: "Camera Translation", icon: Camera, color: "#FF6B00", route: 'Camera' },
    { id: 2, title: "Voice Practice", icon: Mic, color: "#4CAF50", route: 'VoicePractice' },
    { id: 3, title: "Vocabulary", icon: Book, color: "#2196F3", route: 'Vocabulary' },
    { id: 4, title: "Achievements", icon: Trophy, color: "#FFC107", route: 'Achievements' },
  ];

  const recentLessons = [
    { id: 1, title: "Basic Greetings", language: "Spanish", progress: 75 },
    { id: 2, title: "Food & Drinks", language: "French", progress: 45 },
    { id: 3, title: "Numbers 1-100", language: "Japanese", progress: 90 },
  ];

  return (
    <SafeAreaView style={styles.container}>
      <MotiView style={styles.header}>
        <View>
          <Text style={styles.greeting}>Hello,</Text>
          <Text style={styles.username}>{username}</Text>
        </View>
        <TouchableOpacity onPress={() => navigation.navigate('Profile')} style={styles.profileButton}>
          <User size={24} color="#FF6B00" />
        </TouchableOpacity>
      </MotiView>

      <MotiView style={styles.searchContainer}>
        <Search size={20} color="#666" />
        <TextInput style={styles.searchInput} placeholder="Search lessons, words..." placeholderTextColor="#999" />
      </MotiView>

      <Text style={styles.sectionTitle}>Quick Actions</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.categoriesContainer}>
        {categories.map((Category, index) => (
          <MotiView key={Category.id} style={[styles.CategoryCard, { backgroundColor: Category.color }]}>
            <TouchableOpacity onPress={() => navigation.navigate(Category.route)}>
              <Category.icon size={24} color="white" />
              <Text style={styles.CategoryTitle}>{Category.title}</Text>
            </TouchableOpacity>
          </MotiView>
        ))}
      </ScrollView>

      <View style={styles.recentContainer}>
        <Text style={styles.sectionTitle}>Recent Lessons</Text>
        <ScrollView showsVerticalScrollIndicator={false}>
          {recentLessons.map((lesson, index) => (
            <MotiView key={lesson.id} style={styles.lessonCard}>
              <TouchableOpacity onPress={() => navigation.navigate('Lesson', { lessonId: lesson.id })}>
                <View style={styles.lessonInfo}>
                  <Text style={styles.lessonTitle}>{lesson.title}</Text>
                  <Text style={styles.lessonLanguage}>{lesson.language}</Text>
                </View>
                <View style={styles.progressContainer}>
                  <View style={[styles.progressBar, { width: `${lesson.progress}%` }]} />
                  <Text style={styles.progressText}>{lesson.progress}%</Text>
                </View>
              </TouchableOpacity>
            </MotiView>
          ))}
        </ScrollView>
      </View>

      <TouchableOpacity style={styles.settingsButton} onPress={() => navigation.navigate('Settings')}>
        <Settings size={24} color="#666" />
      </TouchableOpacity>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
    padding: 20,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  headerLeft: {
    flexDirection: 'column',
  },
  greeting: {
    fontSize: 16,
    color: '#666',
  },
  username: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
  },
  profileButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#FFF',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF',
    borderRadius: 12,
    padding: 12,
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  searchIcon: {
    marginRight: 10,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: '#333',
    ...(Platform.OS === 'web' && {
      outlineStyle: 'none',
    }),
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 16,
  },
  categoriesContainer: {
    marginBottom: 24,
  },
  CategoryCard: {
    width: 140,
    height: 100,
    borderRadius: 16,
    padding: 16,
    marginRight: 12,
    justifyContent: 'space-between',
  },
  CategoryTitle: {
    color: '#FFF',
    fontSize: 14,
    fontWeight: '600',
    marginTop: 8,
  },
  recentContainer: {
    flex: 1,
  },
  lessonCard: {
    backgroundColor: '#FFF',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  lessonInfo: {
    marginBottom: 12,
  },
  lessonTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  lessonLanguage: {
    fontSize: 14,
    color: '#666',
  },
  progressContainer: {
    height: 4,
    backgroundColor: '#E0E0E0',
    borderRadius: 2,
    marginTop: 8,
    position: 'relative',
  },
  progressBar: {
    position: 'absolute',
    left: 0,
    top: 0,
    height: '100%',
    backgroundColor: '#FF6B00',
    borderRadius: 2,
  },
  progressText: {
    position: 'absolute',
    right: 0,
    top: -20,
    fontSize: 12,
    color: '#666',
  },
  settingsButton: {
    position: 'absolute',
    right: 20,
    bottom: 20,
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#FFF',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
});

export default HomeScreen;