import React from 'react';
import { View, Text, TouchableOpacity, ScrollView, StyleSheet } from 'react-native';
import { Map, BookOpen, Globe } from 'lucide-react-native';

export const TouristGuides = ({ navigation }) => {
  const guides = [
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

  return (
    <View style={styles.guidesSection}>
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Tourist Guides</Text>
        <TouchableOpacity onPress={() => navigation.navigate('AllGuides')}>
          <Text style={styles.seeAllButton}>See All</Text>
        </TouchableOpacity>
      </View>
      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        {guides.map(guide => (
          <TouchableOpacity 
            key={guide.id} 
            style={styles.guideCard}
            onPress={() => navigation.navigate('Guide', { guideId: guide.id })}
          >
            <guide.icon size={24} color="#FF6B00" />
            <Text style={styles.guideTitle}>{guide.title}</Text>
            <Text style={styles.guideDescription}>{guide.description}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  guidesSection: {
    marginBottom: 24,
    paddingHorizontal: 10,
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
});