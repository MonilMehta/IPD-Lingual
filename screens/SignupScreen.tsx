import React, { useState } from 'react';
import { 
  View, 
  Text, 
  TextInput, 
  TouchableOpacity, 
  StyleSheet, 
  KeyboardAvoidingView, 
  Platform,
  ScrollView,
  Alert,
  Image 
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import axios from 'axios';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { router } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import CatPasswordToggle from '../components/CatPasswordToggle';

interface FormData {
  name: string;
  email: string;
  password: string;
  nativeLanguage: string;
  learningLanguages: string[];
  proficiencyLevels: Record<string, string>;
  learningGoals: string[];
}

interface Language {
  code: string;
  name: string;
  icon: string;
}

interface ProficiencyLevel {
  id: string;
  label: string;
  description: string;
}

interface LearningGoal {
  id: string;
  label: string;
  icon: string;
}

interface FormErrors {
  name?: string;
  email?: string;
  password?: string;
  nativeLanguage?: string;
  learningLanguages?: string;
  proficiency?: string;
  goals?: string;
}

type RootStackParamList = {
  Signup: undefined;
  Login: undefined;
};

type SignupScreenProps = {
  navigation: NativeStackNavigationProp<RootStackParamList, 'Signup'>;
};

const LANGUAGES: Language[] = [
  { code: 'en', name: 'English', icon: 'A' },
  { code: 'hi', name: 'Hindi', icon: 'क' },
  { code: 'kn', name: 'Kannada', icon: 'ಅ' },
  { code: 'mr', name: 'Marathi', icon: 'म' },
  { code: 'gu', name: 'Gujarati', icon: 'અ' },
  { code: 'es', name: 'Spanish', icon: 'ñ' },
  { code: 'fr', name: 'French', icon: 'ç' },
  { code: 'ru', name: 'Russian', icon: 'Я' },
  { code: 'zh', name: 'Chinese', icon: '文' },
  { code: 'ja', name: 'Japanese', icon: 'あ' },
];

const USER_PROFILES = [
  { id: 'kids', label: 'For a child or young learner', emoji: '🧒' },
  { id: 'casual', label: 'For casual everyday use', emoji: '😃' },
  { id: 'tourist', label: 'For travel or tourism', emoji: '🧳' },
];

const SignupScreen: React.FC<SignupScreenProps> = ({ navigation }) => {
  const [currentStep, setCurrentStep] = useState<number>(1);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    learningLanguages: [],
    userProfile: '',
  });
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [errors, setErrors] = useState<FormErrors>({});
  const [loading, setLoading] = useState<boolean>(false);

  const updateFormData = (data: Partial<FormData & { userProfile?: string }>): void => {
    setFormData(prev => ({ ...prev, ...data }));
    setErrors({});
  };

  const validateStep1 = (): boolean => {
    const newErrors: FormErrors = {};
    if (!formData.name) newErrors.name = 'Name is required';
    if (!formData.email) newErrors.email = 'Email is required';
    if (!formData.password) newErrors.password = 'Password is required';
    if (formData.password && formData.password.length < 8) {
      newErrors.password = 'Password must be at least 8 characters';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const validateStep2 = (): boolean => {
    const newErrors: FormErrors = {};
    if (!formData.learningLanguages.length) {
      newErrors.learningLanguages = 'Please select a language to learn';
    }
    if (!formData.userProfile) {
      newErrors.nativeLanguage = 'Please select who will use the app';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNext = async (): Promise<void> => {
    if (currentStep === 1) {
      if (validateStep1()) setCurrentStep(2);
    } else if (currentStep === 2) {
      if (validateStep2()) {
        await handleSubmit();
      }
    }
  };

  const handleBack = (): void => {
    if (currentStep > 1) {
      setCurrentStep(prev => prev - 1);
    } else {
      router.back();
    }
  };

  const handleSubmit = async (): Promise<void> => {
    try {
      setLoading(true);
      const signupData = {
        username: formData.name,
        email: formData.email,
        password: formData.password,
        target_language: formData.learningLanguages[0],
        profile: formData.userProfile,
      };
      const response = await axios.post('https://lingual-yn5c.onrender.com/register', signupData, {
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
      });
      if (response.data && response.data.access_token) {
        // Save token and go to home
        await AsyncStorage.setItem('userToken', response.data.access_token);
        router.replace('/(main)/home');
      } else {
        Alert.alert('Signup Failed', response.data?.msg || 'Unknown error');
      }
    } catch (error) {
console.error('Signup error:', error);
      Alert.alert(
'Signup Failed',
error.response?.data?.message || 'An error occurred during signup'
);
    } finally {
      setLoading(false);
    }
  };

  const renderStep1 = () => (
    <View style={styles.centered}>
      <Image 
        source={require('../assets/images/logo-cat.png')} 
        style={styles.mascot}
        resizeMode="contain"
      />
      <View style={styles.card}>
        <Text style={styles.title}>Create Account</Text>
        <Text style={styles.subtitle}>Start your language journey!</Text>
        <View style={{ height: 24 }} />
        <View style={styles.inputWrapper}>
          <Ionicons name="person-outline" size={22} color="#FF6B00" style={styles.inputIcon} />
          <TextInput
            style={styles.input}
            placeholder="Username"
            value={formData.name}
            onChangeText={(text) => updateFormData({ name: text })}
            autoCapitalize="none"
            placeholderTextColor="#aaa"
          />
        </View>
        {errors.name && <Text style={styles.error}>{errors.name}</Text>}
        <View style={styles.inputWrapper}>
          <Ionicons name="mail-outline" size={22} color="#FF6B00" style={styles.inputIcon} />
          <TextInput
            style={styles.input}
            placeholder="Email"
            value={formData.email}
            onChangeText={(text) => updateFormData({ email: text })}
            keyboardType="email-address"
            autoCapitalize="none"
            placeholderTextColor="#aaa"
          />
        </View>
        {errors.email && <Text style={styles.error}>{errors.email}</Text>}
        <CatPasswordToggle
          value={formData.password}
          onChangeText={(text) => updateFormData({ password: text })}
          placeholder="Password"
        />
        {errors.password && <Text style={styles.error}>{errors.password}</Text>}
        <TouchableOpacity 
          style={[styles.loginButton, loading && styles.disabledButton]}
          onPress={handleNext}
          disabled={loading}
        >
          <Text style={styles.loginButtonText}>
            {loading ? 'Loading...' : 'Next'}
          </Text>
        </TouchableOpacity>
      </View>
      <TouchableOpacity 
        style={styles.signupLink}
        onPress={() => router.replace('/(auth)/login')}
      >
        <Text style={styles.signupText}>
          Already have an account? <Text style={styles.signupTextBold}>Sign In</Text>
        </Text>
      </TouchableOpacity>
    </View>
  );

  const renderStep2 = () => (
    <View style={[styles.centered, { justifyContent: 'flex-start', paddingTop: 40 }]}>
      <View style={styles.card}>
        <Text style={styles.title}>Choose Your Language</Text>
        <Text style={styles.subtitle}>Which language do you want to learn?</Text>
        <View style={{ height: 10 }} />
        <View style={styles.languageGridWrap}>
          {LANGUAGES.map(lang => (
            <TouchableOpacity
              key={lang.code}
              style={[
                styles.languageCardSmall,
                formData.learningLanguages.includes(lang.code) && styles.selectedCard
              ]}
              onPress={() => {
                setFormData(prev => ({ ...prev, learningLanguages: [lang.code] }));
              }}
            >
              <Text style={[
                styles.languageTextSmall,
                formData.learningLanguages.includes(lang.code) && styles.selectedText
              ]}>
                {lang.name} <Text style={{fontWeight:'bold'}}>{lang.icon}</Text>
              </Text>
            </TouchableOpacity>
          ))}
        </View>
        {errors.learningLanguages && <Text style={styles.error}>{errors.learningLanguages}</Text>}
        <View style={{ height: 16 }} />
        <Text style={styles.subtitle}>Who will be using the app?</Text>
        <View style={styles.profileGridWrap}>
          {USER_PROFILES.map(profile => (
            <TouchableOpacity
              key={profile.id}
              style={[
                styles.profileCardSmall,
                formData.userProfile === profile.id && styles.selectedCard
              ]}
              onPress={() => setFormData(prev => ({ ...prev, userProfile: profile.id }))}
            >
              <Text style={[
                styles.profileTextSmall,
                formData.userProfile === profile.id && styles.selectedText
              ]}>
                <Text style={{fontSize:18}}>{profile.emoji}</Text> {profile.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
        {errors.nativeLanguage && <Text style={styles.error}>{errors.nativeLanguage}</Text>}
        <TouchableOpacity 
          style={[styles.loginButton, loading && styles.disabledButton, { marginTop: 18 }]}
          onPress={handleNext}
          disabled={loading}
        >
          <Text style={styles.loginButtonText}>
            {loading ? 'Loading...' : 'Sign Up'}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      {currentStep < 3 && (
        <View style={styles.progressBar}>
          {[1, 2].map((step) => (
            <View
              key={step}
              style={[
                styles.progressStep,
                step <= currentStep && styles.progressStepActive
              ]}
            />
          ))}
        </View>
      )}
      {currentStep === 1 && renderStep1()}
      {currentStep === 2 && renderStep2()}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFF6F0',
  },
  keyboardView: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  backButton: {
    padding: 8,
  },
  stepIndicator: {
    flex: 1,
    textAlign: 'center',
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginRight: 40,
  },
  progressBar: {
    flexDirection: 'row',
    padding: 16,
    gap: 8,
  },
  progressStep: {
    flex: 1,
    height: 4,
    backgroundColor: '#E5E7EB',
    borderRadius: 2,
  },
  progressStepActive: {
    backgroundColor: '#FF6B00',
  },
  content: {
    flex: 1,
  },
  stepContainer: {
    padding: 20,
  },
  stepTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  stepSubtitle: {
    fontSize: 16,
    color: '#666',
    marginBottom: 24,
  },
  form: {
    gap: 16,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#DDD',
    borderRadius: 12,
    paddingHorizontal: 15,
    height: 55,
  },
  inputIcon: {
    marginRight: 10,
  },
  input: {
    flex: 1,
    fontSize: 16,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 16,
  },
  languageList: {
    marginBottom: 16,
  },
  languageGrid: {
    maxHeight: 200,
  },
  gridContent: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  languageCard: {
    backgroundColor: '#FFF',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    marginRight: 8,
    minWidth: 120,
  },
  selectedCard: {
    backgroundColor: '#FF6B00',
    borderColor: '#FF6B00',
  },
  languageText: {
    fontSize: 16,
    color: '#333',
    textAlign: 'center',
  },
  selectedText: {
    color: '#FFF',
  },
  proficiencySection: {
    marginBottom: 16,
  },
  languageTitle: {
    fontSize: 16,
    fontWeight: '500',
    color: '#333',
    marginBottom: 8,
  },
  proficiencyCard: {
    backgroundColor: '#FFF',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    marginRight: 12,
    width: 160,
  },
  proficiencyLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  proficiencyDescription: {
    fontSize: 12,
    color: '#666',
  },
  goalsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  goalCard: {
    width: '48%',
    backgroundColor: '#FFF',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    alignItems: 'center',
  },
  goalIcon: {
    fontSize: 24,
    marginBottom: 8,
  },
  goalLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#333',
  },
  error: {
    color: '#EF4444',
    fontSize: 12,
    marginTop: 4,
  },
  footer: {
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#F0F0F0',
  },
  nextButton: {
    backgroundColor: '#FF6B00',
    borderRadius: 12,
    height: 55,
    justifyContent: 'center',
    alignItems: 'center',
  },
  nextButtonText: {
    color: '#FFF',
    fontSize: 18,
    fontWeight: 'bold',
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  mascot: {
    width: 150,
    height: 150,
    marginBottom: 24,
  },
  card: {
    width: '100%',
    maxWidth: 400,
    backgroundColor: '#FFF',
    borderRadius: 12,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 5,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    textAlign: 'center',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginBottom: 24,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#DDD',
    borderRadius: 12,
    paddingHorizontal: 15,
    height: 55,
    marginBottom: 16,
  },
  loginButton: {
    backgroundColor: '#FF6B00',
    borderRadius: 12,
    height: 55,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 24,
  },
  loginButtonText: {
    color: '#FFF',
    fontSize: 18,
    fontWeight: 'bold',
  },
  disabledButton: {
    backgroundColor: '#FF6B00AA',
  },
  signupLink: {
    marginTop: 24,
  },
  signupText: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
  },
  signupTextBold: {
    fontWeight: 'bold',
    color: '#FF6B00',
  },
  languageGridRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 12,
  },
  languageGridWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 8,
    marginBottom: 8,
  },
  languageCardSmall: {
    backgroundColor: '#FFF',
    borderRadius: 10,
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    margin: 4,
    minWidth: 90,
    alignItems: 'center',
  },
  languageTextSmall: {
    fontSize: 15,
    color: '#333',
    textAlign: 'center',
  },
  profileGridWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 8,
    marginBottom: 8,
  },
  profileCardSmall: {
    backgroundColor: '#FFF',
    borderRadius: 10,
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    margin: 4,
    minWidth: 200,
    alignItems: 'center',
  },
  profileTextSmall: {
    fontSize: 14,
    color: '#333',
    textAlign: 'center',
  },
});

export default SignupScreen;