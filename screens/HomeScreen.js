import React,{useState} from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, Platform, Dimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MotiView } from 'moti';
import { 
  Search, User, Book, Camera, Mic, Trophy, Settings, 
  Globe, Image, MessageSquare, Map, History, BookOpen,
  Translate, ScanLine, HeadphonesIcon, BookMarked
} from 'lucide-react-native';
import { LanguageSelector } from './LanguageSelector';

const HomeScreen = ({ navigation }) => {
  const username = "Alex";
  const [selectedLanguage, setSelectedLanguage] = useState('Spanish');
  const mainFeatures = [
    { 
      id: 1, 
      title: "Camera Translate", 
      icon: Camera, 
      color: "#FF6B00",
      route: 'camera',
    },
    { 
      id: 2, 
      title: "Voice Translate", 
      icon: Mic, 
      color: "#F44336",
      route: 'VoiceTranslation',
    },
    { 
      id: 3, 
      title: "Phrasebook", 
      icon: Book, 
      color: "#2196F3",
      route: 'Phrasebook',
    },
    { 
      id: 4, 
      title: "Practice", 
      icon: MessageSquare, 
      color: "#4CAF50",
      route: 'Conversation',
    }
  ];

  const touristGuides = [
    {
      id: 1,
      title: "Local Markets Guide",
      description: "Essential phrases for shopping",
      icon: Map,
    },
    {
      id: 2,
      title: "Restaurant Guide",
      description: "Food & dining vocabulary",
      icon: BookOpen,
    },
    {
      id: 3,
      title: "Transport Guide",
      description: "Getting around the city",
      icon: Globe,
    }
  ];

  const quickPhrases = [
    { id: 1, phrase: "Where is...?", translation: "¿Dónde está...?", category: "Navigation" },
    { id: 2, phrase: "How much?", translation: "¿Cuánto cuesta?", category: "Shopping" },
    { id: 3, phrase: "Thank you", translation: "Gracias", category: "Basics" },
    { id: 4, phrase: "Can you help me?", translation: "¿Me puede ayudar?", category: "Help" },
    { id: 5, phrase: "I don't understand", translation: "No entiendo", category: "Help" },
    { id: 6, phrase: "The bill, please", translation: "La cuenta, por favor", category: "Dining" }
  ];

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>
        <MotiView style={styles.header}>
          <View>
            <Text style={styles.greeting}>Welcome back,</Text>
            <Text style={styles.username}>{username}</Text>
          </View>
          <TouchableOpacity onPress={() => navigation.navigate('Profile')} style={styles.profileButton}>
            <User size={24} color="#FF6B00" />
          </TouchableOpacity>
        </MotiView>
        <LanguageSelector />

        <MotiView style={styles.searchContainer}>
          <Search size={20} color="#666" />
          <TextInput 
            style={styles.searchInput} 
            placeholder="Search phrases, translations..." 
            placeholderTextColor="#999" 
          />
        </MotiView>

        <View style={styles.mainFeaturesGrid}>
          {mainFeatures.map((feature) => (
            <TouchableOpacity
              key={feature.id}
              style={[styles.mainFeatureCard, { backgroundColor: feature.color }]}
              onPress={() => navigation.navigate(feature.route)}
            >
              <feature.icon size={28} color="white" />
              <Text style={styles.mainFeatureTitle}>{feature.title}</Text>
            </TouchableOpacity>
          ))}
        </View>

        <View style={styles.quickPhrasesSection}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Quick Phrases</Text>
            <TouchableOpacity onPress={() => navigation.navigate('AllPhrases')}>
              <Text style={styles.seeAllButton}>See All</Text>
            </TouchableOpacity>
          </View>
          <View style={styles.phrasesGrid}>
            {quickPhrases.map(item => (
              <TouchableOpacity key={item.id} style={styles.phraseCard}>
                <View style={styles.phraseContent}>
                  <Text style={styles.phraseText}>{item.phrase}</Text>
                  <Text style={styles.translationText}>{item.translation}</Text>
                </View>
                <Text style={styles.categoryTag}>{item.category}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <View style={styles.guidesSection}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Tourist Guides</Text>
            <TouchableOpacity onPress={() => navigation.navigate('AllGuides')}>
              <Text style={styles.seeAllButton}>See All</Text>
            </TouchableOpacity>
          </View>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            {touristGuides.map(guide => (
              <TouchableOpacity key={guide.id} style={styles.guideCard}>
                <guide.icon size={24} color="#FF6B00" />
                <Text style={styles.guideTitle}>{guide.title}</Text>
                <Text style={styles.guideDescription}>{guide.description}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      </ScrollView>

      <TouchableOpacity 
        style={styles.settingsButton} 
        onPress={() => navigation.navigate('Settings')}
      >
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
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FF6B00',
  },
  languagePickerContainer: {
    marginBottom: 20,
  },
  languagePickerLabel: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 10,
  },
  languagePicker: {
    height: 50,
    width: '100%',
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
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: '#333',
    marginLeft: 10,
    ...(Platform.OS === 'web' && {
      outlineStyle: 'none',
    }),
  },
  mainFeaturesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: -16,
  },
  mainFeatureCard: {
    width: '48%',
    aspectRatio: 1,
    borderRadius: 16,
    padding: 16,
    justifyContent: 'center',
    alignItems: 'center',
    
  },
  mainFeatureTitle: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '600',
    marginTop: 12,
    textAlign: 'center',
    marginBottom: 16,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
  },
  seeAllButton: {
    color: '#FF6B00',
    fontSize: 14,
    fontWeight: '600',
  },
  quickPhrasesSection: {
    marginBottom: 24,
  },
  phrasesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  phraseCard: {
    backgroundColor: '#FFF',
    borderRadius: 12,
    padding: 16,
    width: '48%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  phraseContent: {
    marginBottom: 8,
  },
  phraseText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  translationText: {
    fontSize: 13,
    color: '#666',
    fontStyle: 'italic',
  },
  categoryTag: {
    fontSize: 12,
    color: '#FF6B00',
    fontWeight: '500',
  },
  guidesSection: {
    marginBottom: 24,
  },
  guideCard: {
    backgroundColor: '#FFF',
    borderRadius: 16,
    padding: 20,
    marginRight: 16,
    width: 200,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
    marginBottom: 8,
  },
  guideTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginTop: 12,
    marginBottom: 4,
  },
  guideDescription: {
    fontSize: 14,
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