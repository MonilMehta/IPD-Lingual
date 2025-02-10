import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Dimensions, TouchableOpacity, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MotiView } from 'moti';
import { Easing } from 'react-native-reanimated';
import { SharedElement } from 'react-navigation-shared-element';
import LottieView from 'lottie-react-native';

const { width, height } = Dimensions.get('window');

const LandingScreen = ({ navigation }) => {
  const animationRef = useRef(null);
  const animationInstance = useRef(null);
  console.log('Control in landing')
  useEffect(() => {
    if (Platform.OS === 'web' && animationRef.current && !animationInstance.current) {
      import('lottie-web').then(LottieWeb => {
        if (animationInstance.current) {
          animationInstance.current.destroy();
        }
        
        animationInstance.current = LottieWeb.default.loadAnimation({
          container: animationRef.current,
          renderer: 'svg',
          loop: true,
          autoplay: true,
          path: '../assets/animations/language.json',
        });
      });
    }

    return () => {
      if (animationInstance.current) {
        animationInstance.current.destroy();
        animationInstance.current = null;
      }
    };
  }, []);

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
                  style={{ 
                    width: Platform.OS === 'web' ? '40vw' : '80vw',
                    height: Platform.OS === 'web' ? '40vw' : '80vw',
                    maxWidth: '300px',
                    maxHeight: '300px',
                    marginTop: Platform.OS === 'web' ? 50 : 0,
                  }} 
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
  contentContainer: {
    flex: 1,
    position: 'relative',
    zIndex: 2, // Ensure content is above gradient circles
  },
  upperSection: {
    flex: Platform.OS === 'web' ? 0.6 : 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: Platform.OS === 'web' ? height * 0.05 : height * 0.1,
    marginTop: Platform.OS === 'web' ? 50 : 0,
  },
  logoContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Platform.OS === 'web' ? 10 : 20,
    marginTop: Platform.OS === 'web' ? 40 : 0,
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
    zIndex: 3, // Ensure buttons are clickable
  },
  button: {
    height: 56,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
    shadowColor: '#FF6B00',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
    position: 'relative',
    zIndex: 3,
    ...(Platform.OS === 'web' && {
      cursor: 'pointer',
      ':hover': {
        opacity: 0.9,
      }
      
    }),
  },
  loginButton: {
    backgroundColor: '#FF6B00',
    ...(Platform.OS === 'web' && {
      marginTop: 200,
    }),
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
    zIndex: 1, // Keep circles behind content
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