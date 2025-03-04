import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, Animated, Dimensions } from 'react-native';
import { useRouter } from 'expo-router';
import { MotiView } from 'moti';

const { width } = Dimensions.get('window');

export default function SplashScreen() {
  const router = useRouter();
  const [currentCharIndex, setCurrentCharIndex] = useState(0);
  const fadeAnim = useState(new Animated.Value(0))[0];
  
  // Expanded language characters from different writing systems
  const languageCharacters = [
    { char: 'A', language: 'English' },
    { char: '你', language: 'Chinese' },
    { char: 'б', language: 'Russian' },
    { char: 'あ', language: 'Japanese' },
    { char: 'ا', language: 'Arabic' },
    { char: 'ก', language: 'Thai' },
    { char: 'ਕ', language: 'Punjabi' },
    { char: 'Ñ', language: 'Spanish' },
    { char: 'ש', language: 'Hebrew' },
    { char: 'ε', language: 'Greek' },
    { char: 'ह', language: 'Hindi' },
    { char: '한', language: 'Korean' },
  ];

  // Calculate total pairs for the animation
  const totalPairs = Math.floor(languageCharacters.length / 2);

  useEffect(() => {
    // Animate through language character pairs
    const intervalId = setInterval(() => {
      // Fade out
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 200, // Faster fade out
        useNativeDriver: true,
      }).start(() => {
        // Update character index
        setCurrentCharIndex((prevIndex) => 
          prevIndex < totalPairs - 1 ? prevIndex + 1 : prevIndex
        );
        
        // Fade in
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 200, // Faster fade in
          useNativeDriver: true,
        }).start();
      });
    }, 600); // Faster interval between changes

    // Navigate to landing screen after showing all character pairs
    const timer = setTimeout(() => {
      clearInterval(intervalId);
      router.replace('/(landing)');
    }, totalPairs * 600 + 300); // Adjusted timing
    
    return () => {
      clearTimeout(timer);
      clearInterval(intervalId);
    };
  }, []);

  // Start with fade-in animation
  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 400,
      useNativeDriver: true,
    }).start();
  }, []);
  
  // Get the current pair of characters
  const firstIndex = currentCharIndex * 2;
  const secondIndex = firstIndex + 1;
  
  return (
    <View style={styles.container}>
      {/* Background gradient circles */}
      <MotiView
        style={[styles.gradientCircle, styles.topCircle]}
        from={{ opacity: 0, scale: 0 }}
        animate={{ opacity: 0.1, scale: 1 }}
        transition={{ type: 'timing', duration: 800, delay: 100 }}
      />
      <MotiView
        style={[styles.gradientCircle, styles.bottomCircle]}
        from={{ opacity: 0, scale: 0 }}
        animate={{ opacity: 0.1, scale: 1 }}
        transition={{ type: 'timing', duration: 800, delay: 200 }}
      />
      
      <Text style={styles.title}>Lingual</Text>
      <Text style={styles.subtitle}>Learn languages through your camera</Text>
      
      <Animated.View style={[styles.charactersRow, { opacity: fadeAnim }]}>
        <View style={styles.characterContainer}>
          <Text style={styles.character}>{languageCharacters[firstIndex].char}</Text>
          <Text style={styles.languageName}>{languageCharacters[firstIndex].language}</Text>
        </View>
        
        {secondIndex < languageCharacters.length && (
          <View style={styles.characterContainer}>
            <Text style={styles.character}>{languageCharacters[secondIndex].char}</Text>
            <Text style={styles.languageName}>{languageCharacters[secondIndex].language}</Text>
          </View>
        )}
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    overflow: 'hidden',
  },
  title: {
    color: '#FF6B00',
    fontSize: 48,
    fontWeight: 'bold',
    marginBottom: 10,
    zIndex: 2,
  },
  subtitle: {
    fontSize: 18,
    color: '#666',
    textAlign: 'center',
    paddingHorizontal: 40,
    marginBottom: 40,
    zIndex: 2,
  },
  charactersRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: '100%',
    paddingHorizontal: 20,
    zIndex: 2,
  },
  characterContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: 20,
  },
  character: {
    fontSize: 72,
    color: '#FF6B00',
    marginBottom: 10,
  },
  languageName: {
    fontSize: 18,
    color: '#666',
  },
  gradientCircle: {
    position: 'absolute',
    backgroundColor: '#FF6B00',
    borderRadius: 1000,
    zIndex: 1,
  },
  topCircle: {
    width: width * 1.5,
    height: width * 1.5,
    top: -width * 0.75,
    left: -width * 0.25,
  },
  bottomCircle: {
    width: width * 1.5,
    height: width * 1.5,
    bottom: -width,
    right: -width * 0.25,
  },
});
