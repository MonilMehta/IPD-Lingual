import React, { useRef } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  Dimensions, 
  TouchableOpacity, 
  Platform 
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MotiView } from 'moti';
import { Easing } from 'react-native-reanimated';
import LottieView from 'lottie-react-native';
import { router } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';

const { width, height } = Dimensions.get('window');

const LandingScreen: React.FC = () => {
  const animationRef = useRef<LottieView>(null);

  return (
    <SafeAreaView style={styles.container}>
      {/* Dynamic blurred gradient circles */}
      <MotiView
        style={[styles.gradientCircle, styles.topCircle]}
        from={{ opacity: 0, scale: 0 }}
        animate={{ opacity: 0.18, scale: 1 }}
        transition={{ type: 'timing', duration: 1200, delay: 100 }}
      >
        <LinearGradient
          colors={["#FF6B00", "#FFD580"]}
          style={StyleSheet.absoluteFill}
          start={{ x: 0.2, y: 0 }}
          end={{ x: 1, y: 1 }}
        />
      </MotiView>
      <MotiView
        style={[styles.gradientCircle, styles.bottomCircle]}
        from={{ opacity: 0, scale: 0 }}
        animate={{ opacity: 0.15, scale: 1 }}
        transition={{ type: 'timing', duration: 1200, delay: 300 }}
      >
        <LinearGradient
          colors={["#FFD580", "#FF6B00"]}
          style={StyleSheet.absoluteFill}
          start={{ x: 1, y: 0 }}
          end={{ x: 0, y: 1 }}
        />
      </MotiView>

      <View style={styles.contentContainer}>
        <MotiView
          from={{ opacity: 0, translateY: -30 }}
          animate={{ opacity: 1, translateY: 0 }}
          transition={{ type: 'timing', duration: 1000, easing: Easing.out(Easing.exp) }}
          style={styles.upperSection}
        >
          <View style={styles.logoContainer}>
            <LottieView
              ref={animationRef}
              source={require('../assets/animations/language.json')}
              autoPlay
              loop={false}
              onAnimationFinish={() => {
                // Do nothing, keeps last frame
              }}
              style={{ width: '100%', height: width * 0.6, alignSelf: 'stretch' }}
              resizeMode="cover"
            />
          </View>
          <MotiView
            from={{ opacity: 0, translateY: 20 }}
            animate={{ opacity: 1, translateY: 0 }}
            transition={{ type: 'timing', duration: 900, delay: 200 }}
          >
            <Text style={styles.title}>Welcome to <Text style={styles.titleAccent}>Lingual</Text></Text>
          </MotiView>
          <MotiView
            from={{ opacity: 0, translateY: 20 }}
            animate={{ opacity: 1, translateY: 0 }}
            transition={{ type: 'timing', duration: 900, delay: 350 }}
          >
            <Text style={styles.subtitle}>Snap. Learn. Speak. <Text style={styles.subtitleAccent}>Your camera is your new language teacher.</Text></Text>
          </MotiView>
        </MotiView>

        <MotiView
          from={{ opacity: 0, translateY: 60 }}
          animate={{ opacity: 1, translateY: 0 }}
          transition={{ type: 'timing', duration: 1000, delay: 600, easing: Easing.out(Easing.exp) }}
          style={styles.lowerSection}
        >
          <TouchableOpacity
            style={[styles.button, styles.getStartedButton]}
            onPress={() => router.navigate('/screens/auth/login')}
            activeOpacity={0.8}
          >
            <LinearGradient
              colors={["#FF6B00", "#FF9A36"]}
              style={styles.buttonGradient}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
            >
              <Text style={styles.buttonText}>Get Started</Text>
            </LinearGradient>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.button, styles.createAccountButton]}
            onPress={() => router.navigate('/screens/auth/signup')}
            activeOpacity={0.8}
          >
            <Text style={[styles.buttonText, styles.createAccountText]}>Create Account</Text>
          </TouchableOpacity>

          <Text style={styles.terms}>By continuing, you agree to our <Text style={styles.termsLink}>Terms of Service</Text>.</Text>
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
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Platform.OS === 'web' ? 10 : 20,
    marginTop: Platform.OS === 'web' ? 40 : 0,
  },
  title: {
    fontSize: 40,
    fontWeight: '900',
    color: '#222',
    textAlign: 'center',
    marginBottom: 2,
    letterSpacing: 1.2,
  },
  titleAccent: {
    color: '#FF6B00',
    fontWeight: '900',
  },
  subtitle: {
    fontSize: 18,
    color: '#444',
    textAlign: 'center',
    paddingHorizontal: 32,
    lineHeight: 26,
    marginTop: 8,
    marginBottom: 2,
  },
  subtitleAccent: {
    color: '#FF6B00',
    fontWeight: 'bold',
  },
  lowerSection: {
    padding: 30,
    paddingBottom: 50,
    position: 'relative',
    zIndex: 3, // Ensure buttons are clickable
  },
  button: {
    height: 56,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
    overflow: 'hidden',
  },
  getStartedButton: {
    backgroundColor: 'transparent',
    padding: 0,
    marginBottom: 14,
    borderWidth: 0,
    shadowColor: '#FF6B00',
    shadowOpacity: 0.25,
    shadowRadius: 10,
    elevation: 6,
  },
  buttonGradient: {
    flex: 1,
    width: '100%',
    height: '100%',
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  createAccountButton: {
    backgroundColor: '#FFF',
    borderWidth: 2,
    borderColor: '#FF6B00',
    marginBottom: 8,
  },
  createAccountText: {
    color: '#FF6B00',
    fontWeight: 'bold',
  },
  buttonText: {
    fontSize: 19,
    fontWeight: 'bold',
    color: '#FFF',
    textAlign: 'center',
    letterSpacing: 0.5,
  },
  terms: {
    textAlign: 'center',
    color: '#888',
    fontSize: 13,
    marginTop: 18,
    marginBottom: 2,
  },
  termsLink: {
    color: '#FF6B00',
    textDecorationLine: 'underline',
  },
  gradientCircle: {
    position: 'absolute',
    borderRadius: 1000,
    zIndex: 1,
    overflow: 'hidden',
    filter: Platform.OS === 'web' ? 'blur(60px)' : undefined,
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