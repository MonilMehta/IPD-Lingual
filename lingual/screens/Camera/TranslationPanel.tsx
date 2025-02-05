import React, { useMemo } from 'react';
import { View, Text, TouchableOpacity, Animated, StyleSheet } from 'react-native';
import { X, Save, Info } from 'lucide-react-native';
import { DetectedObject } from '../types';
import { useLanguageStore } from '../../store/languageStore';
import { useGeneratedPhrases } from '../../hooks/useGeneratedPhrases';

interface TranslationPanelProps {
  object: DetectedObject | null;
  onClose: () => void;
  bottomSheetAnim: Animated.Value;
}

export const TranslationPanel: React.FC<TranslationPanelProps> = ({
  object,
  onClose,
  bottomSheetAnim,
}) => {
  const addVocabulary = useLanguageStore(state => state.addVocabulary);
  const { getPhrasesForWord } = useGeneratedPhrases();

  const commonPhrases = useMemo(() => {
    return object ? getPhrasesForWord(object.name) : [];
  }, [object, getPhrasesForWord]);

  const handleSave = () => {
    if (object) {
      addVocabulary(object.name, object.translation);
    }
  };

  if (!object) return null;

  return (
    <Animated.View
      style={[
        styles.bottomSheet,
        {
          transform: [{
            translateY: bottomSheetAnim.interpolate({
              inputRange: [0, 1],
              outputRange: [300, 0],
            }),
          }],
        },
      ]}
    >
      <View style={styles.content}>
        <View style={styles.header}>
          <Text style={styles.title}>{object.name}</Text>
          <TouchableOpacity onPress={onClose}>
            <X size={24} color="#333" />
          </TouchableOpacity>
        </View>
        
        <View style={styles.translationContainer}>
          <Text style={styles.translationText}>{object.translation}</Text>
          <Text style={styles.descriptionText}>{object.description}</Text>
        </View>

        <View style={styles.phrasesContainer}>
          <Text style={styles.phrasesTitle}>Common Phrases</Text>
          {commonPhrases.map((phrase, index) => (
            <View key={index} style={styles.phraseItem}>
              <Text style={styles.phraseText}>{phrase.english}</Text>
              <Text style={styles.phraseTranslation}>{phrase.translation}</Text>
            </View>
          ))}
        </View>

        <View style={styles.actions}>
          <TouchableOpacity 
            style={styles.actionButton}
            onPress={handleSave}
          >
            <Save size={20} color="#FF6B00" />
            <Text style={styles.actionButtonText}>Save to Vocabulary</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.actionButton}
            onPress={() => {/* Handle more info */}}
          >
            <Info size={20} color="#FF6B00" />
            <Text style={styles.actionButtonText}>More Info</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  bottomSheet: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'white',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: -2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  content: {
    minHeight: 200,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
  },
  translationContainer: {
    marginBottom: 20,
  },
  translationText: {
    fontSize: 20,
    color: '#FF6B00',
    marginBottom: 8,
  },
  descriptionText: {
    fontSize: 16,
    color: '#666',
    lineHeight: 24,
  },
  phrasesContainer: {
    marginTop: 20,
    marginBottom: 20,
  },
  phrasesTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 12,
  },
  phraseItem: {
    backgroundColor: '#F8F9FA',
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
  },
  phraseText: {
    fontSize: 16,
    color: '#333',
    marginBottom: 4,
  },
  phraseTranslation: {
    fontSize: 14,
    color: '#666',
    fontStyle: 'italic',
  },
  actions: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: 20,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 8,
    backgroundColor: '#F8F9FA',
  },
  actionButtonText: {
    marginLeft: 8,
    color: '#FF6B00',
    fontWeight: '600',
  },
});
