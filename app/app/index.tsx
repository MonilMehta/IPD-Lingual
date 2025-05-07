import React, { useEffect, useState, useCallback, memo } from 'react';
import { View, Text, StyleSheet, Dimensions, Image } from 'react-native';
import { useRouter } from 'expo-router';
import { MotiView } from 'moti';
import { Easing } from 'react-native-reanimated';
const { width } = Dimensions.get('window');

// Memoized character component to improve performance
const CharBubble = memo(({ char }) => (
  <MotiView
    style={styles.charBubble}
    from={{ opacity: 0, scale: 0.5 }}
    animate={{ opacity: 1, scale: 1 }}
    transition={{ 
      type: 'timing', 
      duration: 300
      // Removed invalid 'easing' property
    }}
  >
    <Text style={styles.character}>{char}</Text>
  </MotiView>
));

export default function SplashScreen() {
  // Trigger backend wake-up on app startup
  useEffect(() => {
    fetch('https://lingual-yn5c.onrender.com/').catch(() => {});
  }, []);

  const router = useRouter();
  const [displayedChars, setDisplayedChars] = useState([]);
  const [isNavigating, setIsNavigating] = useState(false);

  // Reduced character set for better performance
  const languageCharacters = [
    { char: 'A', language: 'English' },
    { char: '你', language: 'Chinese' },
    { char: 'б', language: 'Russian' },
    { char: 'あ', language: 'Japanese' },
    { char: 'Ñ', language: 'Spanish' },
    { char: 'ह', language: 'Hindi' },
    { char: '한', language: 'Korean' },
  ];
  
  // Memoized navigation function to prevent recreating it on every render
  const navigateToLanding = useCallback(() => {
    setIsNavigating(true);
    router.replace('/(landing)');
  }, [router]);

  // Handle character addition
  useEffect(() => {
    let timer;
    
    if (isNavigating) return;
    
    // Add characters one by one with delay
    if (displayedChars.length < languageCharacters.length) {
      timer = setTimeout(() => {
        setDisplayedChars(prevChars => [
          ...prevChars, 
          languageCharacters[displayedChars.length]
        ]);
      }, 250); // Slightly longer delay for smoother appearance
    } else {
      // All characters displayed, wait before navigating
      timer = setTimeout(navigateToLanding, 800);
    }
    
    return () => {
      if (timer) clearTimeout(timer);
    };
  }, [displayedChars, languageCharacters, navigateToLanding, isNavigating]);

  return (
    <View style={styles.container}>
      {/* Background gradient circles */}
      <MotiView
        style={[styles.gradientCircle, styles.topCircle]}
        from={{ opacity: 0, scale: 0 }}
        animate={{ opacity: 0.1, scale: 1 }}
        transition={{ type: 'timing', duration: 800 }}
      />
      <MotiView
        style={[styles.gradientCircle, styles.bottomCircle]}
        from={{ opacity: 0, scaleY: 0.7, scaleX: 0.7 }}
        animate={{ opacity: 0.12, scaleY: 1, scaleX: 1 }}
        transition={{ type: 'timing', duration: 1200, delay: 300, easing: Easing.out(Easing.exp) }}
      />

      {/* Logo images */}
      <Image 
        source={require('../assets/images/logo-cat.png')} 
        style={styles.logoCat} 
        resizeMode="contain" 
      />
      <Image 
        source={require('../assets/images/logo-text.png')} 
        style={styles.logoText} 
        resizeMode="contain" 
      />

      {/* Sequential character display */}
      <View style={styles.charactersContainer}>
        {displayedChars.map((item, index) => (
          <CharBubble key={index} char={item.char} />
        ))}
      </View>
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
  logoCat: {
    width: 120,
    height: 120,
    marginBottom: 10,
    zIndex: 2,
  },
  logoText: {
    width: 180,
    height: 50,
    marginBottom: 40,
    zIndex: 2,
  },
  charactersContainer: {
    width: width * 0.9,
    height: 70,
    marginTop: 20,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 2,
  },
  charBubble: {
    backgroundColor: '#FF6B00',
    borderRadius: 15,
    width: 50,
    height: 50,
    justifyContent: 'center',
    alignItems: 'center',
    marginHorizontal: 4,
  },
  character: {
    fontSize: 28,
    color: '#fff',
    fontWeight: 'bold',
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