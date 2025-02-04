import React, { useEffect, useRef, useState } from 'react';
import { View, Text, StyleSheet, Dimensions, TouchableOpacity, Platform, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MotiView } from 'moti';
import { Easing } from 'react-native-reanimated';
import { SharedElement } from 'react-navigation-shared-element';
import LottieView from 'lottie-react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { router } from 'expo-router';
const { width, height } = Dimensions.get('window');

const LandingScreen = ({ navigation }) => {
  const animationRef = useRef(null);
  const animationInstance = useRef(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const checkUserToken = async () => {
      try {
        const userToken = await AsyncStorage.getItem('userToken');
        if (userToken) {
          router.replace('/(main)/home');
        } else {
          router.replace('login'); // Redirect to login/signup if no token
        }
      } catch (error) {
        console.error('Error checking user token:', error);
      } finally {
        setIsLoading(false);
      }
    };

    checkUserToken();
  }, [router]);
  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        {Platform.OS === 'web' ? (
          <Text>Loading...</Text>
        ) : (
          <LottieView
            source={require('../assets/animations/loader.json')} // Add a loading animation
            autoPlay
            loop
            style={{ width: 150, height: 150 }}
          />
        )}
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Background gradient circles */}
      <MotiView
        style={[styles.gradientCircle, styles.topCircle]}
        from={{ opacity: 0, scale: 0 }}
        animate={{ opacity: 0.1, scale: 1 }}
        transition={{ type: 'timing', duration: 1000, delay: 200 }}
      />
      <MotiView
        style={[styles.gradientCircle, styles.bottomCircle]}
        from={{ opacity: 0, scale: 0 }}
        animate={{ opacity: 0.1, scale: 1 }}
        transition={{ type: 'timing', duration: 1000, delay: 400 }}
      />

      {/* Main content */}
      <View style={styles.contentContainer}>
        <MotiView
          from={{ opacity: 0, translateY: -20 }}
          animate={{ opacity: 1, translateY: 0 }}
          transition={{ type: 'timing', duration: 1000, easing: Easing.out(Easing.ease) }}
          style={styles.upperSection}
        >
          <SharedElement id="logo">
            <View style={styles.logoContainer}>
              {Platform.OS === 'web' ? (
                <div 
                  ref={animationRef} 
                  style={{ width: '40vw', height: '40vw', maxWidth: 300, maxHeight: 300, marginTop: 50 }} 
                />
              ) : (
                <LottieView
                  source={require('../assets/animations/language.json')}
                  autoPlay
                  loop
                  style={{ width: 250, height: 250 }}
                />
              )}
            </View>
          </SharedElement>

          <MotiView
            from={{ opacity: 0, translateY: 10 }}
            animate={{ opacity: 1, translateY: 0 }}
            transition={{ type: 'timing', duration: 800, delay: 300 }}
          >
            <Text style={styles.title}>Lingual</Text>
          </MotiView>
          <MotiView
            from={{ opacity: 0, translateY: 10 }}
            animate={{ opacity: 1, translateY: 0 }}
            transition={{ type: 'timing', duration: 800, delay: 400 }}
          >
            <Text style={styles.subtitle}>Learn languages through your camera</Text>
          </MotiView>
        </MotiView>

        <MotiView
          from={{ opacity: 0, translateY: 50 }}
          animate={{ opacity: 1, translateY: 0 }}
          transition={{ type: 'timing', duration: 1000, delay: 500, easing: Easing.out(Easing.ease) }}
          style={styles.lowerSection}
        >
          <TouchableOpacity
            style={[styles.button, styles.loginButton]}
            onPress={() => navigation.navigate('login')}
            activeOpacity={0.7}
          >
            <Text style={styles.buttonText}>Get Started</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.button, styles.signupButton]}
            onPress={() => navigation.navigate('signup')}
            activeOpacity={0.7}
          >
            <Text style={[styles.buttonText, styles.signupText]}>Create Account</Text>
          </TouchableOpacity>

          <Text style={styles.terms}>By continuing, you agree to our Terms of Service</Text>
        </MotiView>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFF',
    position: 'relative',
    overflow: 'hidden',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  contentContainer: {
    flex: 1,
    position: 'relative',
    zIndex: 2, 
  },
  upperSection: {
    flex: Platform.OS === 'web' ? 0.6 : 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: height * 0.1,
  },
  logoContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  title: {
    fontSize: 38,
    fontWeight: 'bold',
    color: '#FF6B00',
    textAlign: 'center',
    marginBottom: 5,
  },
  subtitle: {
    fontSize: 18,
    color: '#666',
    textAlign: 'center',
    paddingHorizontal: 40,
    lineHeight: 24,
    marginTop: 5,
  },
  lowerSection: {
    padding: 30,
    paddingBottom: 50,
    position: 'relative',
    zIndex: 3, 
  },
  button: {
    height: 56,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
    shadowColor: '#FF6B00',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
    position: 'relative',
    zIndex: 3,
  },
  loginButton: {
    backgroundColor: '#FF6B00',
  },
  signupButton: {
    backgroundColor: '#FFF',
    borderWidth: 2,
    borderColor: '#FF6B00',
  },
  buttonText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFF',
    textAlign: 'center',
  },
  signupText: {
    color: '#FF6B00',
  },
  terms: {
    textAlign: 'center',
    color: '#666',
    fontSize: 12,
    marginTop: 20,
    position: 'relative',
    zIndex: 3,
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

export default LandingScreen;
