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
  Alert 
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

const LANGUAGES = [
  { code: 'en', name: 'English' },
  { code: 'es', name: 'Spanish' },
  { code: 'fr', name: 'French' },
  { code: 'de', name: 'German' },
  { code: 'it', name: 'Italian' },
  { code: 'pt', name: 'Portuguese' },
  { code: 'ja', name: 'Japanese' },
  { code: 'ko', name: 'Korean' },
  { code: 'zh', name: 'Chinese' }
];

const PROFICIENCY_LEVELS = [
  { id: 'beginner', label: 'Beginner', description: 'Little to no knowledge' },
  { id: 'elementary', label: 'Elementary', description: 'Basic communication' },
  { id: 'intermediate', label: 'Intermediate', description: 'Can handle most situations' },
  { id: 'advanced', label: 'Advanced', description: 'Fluent in most contexts' },
  { id: 'native', label: 'Native', description: 'Native-like proficiency' }
];

const LEARNING_GOALS = [
  { id: 'travel', label: 'Travel', icon: '✈️' },
  { id: 'business', label: 'Business', icon: '💼' },
  { id: 'academic', label: 'Academic', icon: '📚' },
  { id: 'cultural', label: 'Cultural', icon: '🎭' },
  { id: 'social', label: 'Social', icon: '👥' }
];

const SignupScreen = ({ navigation }) => {
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState({
    // Step 1: Basic Info
    name: '',
    email: '',
    password: '',
    // Step 2: Language Selection
    nativeLanguage: '',
    learningLanguages: [],
    // Step 3: Proficiency & Goals
    proficiencyLevels: {},
    learningGoals: []
  });
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState({});

  const updateFormData = (data) => {
    setFormData(prev => ({ ...prev, ...data }));
    setErrors({});
  };

  const validateStep1 = () => {
    const newErrors = {};
    if (!formData.name) newErrors.name = 'Name is required';
    if (!formData.email) newErrors.email = 'Email is required';
    if (!formData.password) newErrors.password = 'Password is required';
    if (formData.password && formData.password.length < 8) {
      newErrors.password = 'Password must be at least 8 characters';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const validateStep2 = () => {
    const newErrors = {};
    if (!formData.nativeLanguage) {
      newErrors.nativeLanguage = 'Please select your native language';
    }
    if (!formData.learningLanguages.length) {
      newErrors.learningLanguages = 'Please select at least one language to learn';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const validateStep3 = () => {
    const newErrors = {};
    if (formData.learningLanguages.some(lang => !formData.proficiencyLevels[lang])) {
      newErrors.proficiency = 'Please select proficiency level for all languages';
    }
    if (!formData.learningGoals.length) {
      newErrors.goals = 'Please select at least one learning goal';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNext = () => {
    let isValid = false;
    switch (currentStep) {
      case 1:
        isValid = validateStep1();
        break;
      case 2:
        isValid = validateStep2();
        break;
      case 3:
        isValid = validateStep3();
        break;
    }

    if (isValid) {
      if (currentStep < 3) {
        setCurrentStep(prev => prev + 1);
      } else {
        handleSubmit();
      }
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(prev => prev - 1);
    } else {
      navigation.goBack();
    }
  };

  const handleSubmit = async () => {
    try {
      // Here you would typically make an API call to create the account
      console.log('Form submitted:', formData);
      Alert.alert('Success', 'Account created successfully', [
        {
          text: 'OK',
          onPress: () => navigation.navigate('Login')
        }
      ]);
    } catch (error) {
      Alert.alert('Error', 'Signup failed. Please try again.');
    }
  };

  const renderStep1 = () => (
    <View style={styles.stepContainer}>
      <Text style={styles.stepTitle}>Create Your Account</Text>
      <Text style={styles.stepSubtitle}>Let's get started with your language journey</Text>

      <View style={styles.form}>
        <View style={styles.inputContainer}>
          <Ionicons name="person-outline" size={24} color="#FF6B00" style={styles.inputIcon} />
          <TextInput
            style={styles.input}
            placeholder="Full Name"
            value={formData.name}
            onChangeText={(text) => updateFormData({ name: text })}
            autoCapitalize="words"
          />
        </View>
        {errors.name && <Text style={styles.error}>{errors.name}</Text>}

        <View style={styles.inputContainer}>
          <Ionicons name="mail-outline" size={24} color="#FF6B00" style={styles.inputIcon} />
          <TextInput
            style={styles.input}
            placeholder="Email"
            value={formData.email}
            onChangeText={(text) => updateFormData({ email: text })}
            keyboardType="email-address"
            autoCapitalize="none"
          />
        </View>
        {errors.email && <Text style={styles.error}>{errors.email}</Text>}

        <View style={styles.inputContainer}>
          <Ionicons name="lock-closed-outline" size={24} color="#FF6B00" style={styles.inputIcon} />
          <TextInput
            style={styles.input}
            placeholder="Password"
            value={formData.password}
            onChangeText={(text) => updateFormData({ password: text })}
            secureTextEntry={!showPassword}
          />
          <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
            <Ionicons
              name={showPassword ? "eye-off-outline" : "eye-outline"}
              size={24}
              color="#FF6B00"
            />
          </TouchableOpacity>
        </View>
        {errors.password && <Text style={styles.error}>{errors.password}</Text>}
      </View>
    </View>
  );

  const renderStep2 = () => (
    <View style={styles.stepContainer}>
      <Text style={styles.stepTitle}>Language Preferences</Text>
      
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Your Native Language</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.languageList}>
          {LANGUAGES.map(lang => (
            <TouchableOpacity
              key={lang.code}
              style={[
                styles.languageCard,
                formData.nativeLanguage === lang.code && styles.selectedCard
              ]}
              onPress={() => updateFormData({ nativeLanguage: lang.code })}
            >
              <Text style={[
                styles.languageText,
                formData.nativeLanguage === lang.code && styles.selectedText
              ]}>
                {lang.name}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
        {errors.nativeLanguage && <Text style={styles.error}>{errors.nativeLanguage}</Text>}
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Languages You Want to Learn</Text>
        <ScrollView style={styles.languageGrid}>
          <View style={styles.gridContent}>
            {LANGUAGES.filter(lang => lang.code !== formData.nativeLanguage).map(lang => (
              <TouchableOpacity
                key={lang.code}
                style={[
                  styles.languageCard,
                  formData.learningLanguages.includes(lang.code) && styles.selectedCard
                ]}
                onPress={() => {
                  const updated = formData.learningLanguages.includes(lang.code)
                    ? formData.learningLanguages.filter(code => code !== lang.code)
                    : [...formData.learningLanguages, lang.code];
                  updateFormData({ learningLanguages: updated });
                }}
              >
                <Text style={[
                  styles.languageText,
                  formData.learningLanguages.includes(lang.code) && styles.selectedText
                ]}>
                  {lang.name}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </ScrollView>
        {errors.learningLanguages && <Text style={styles.error}>{errors.learningLanguages}</Text>}
      </View>
    </View>
  );

  const renderStep3 = () => (
    <View style={styles.stepContainer}>
      <Text style={styles.stepTitle}>Your Language Journey</Text>

      <ScrollView>
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Current Proficiency Levels</Text>
          {formData.learningLanguages.map(langCode => (
            <View key={langCode} style={styles.proficiencySection}>
              <Text style={styles.languageTitle}>
                {LANGUAGES.find(l => l.code === langCode)?.name}
              </Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                {PROFICIENCY_LEVELS.map(level => (
                  <TouchableOpacity
                    key={level.id}
                    style={[
                      styles.proficiencyCard,
                      formData.proficiencyLevels[langCode] === level.id && styles.selectedCard
                    ]}
                    onPress={() => {
                      const updated = { ...formData.proficiencyLevels, [langCode]: level.id };
                      updateFormData({ proficiencyLevels: updated });
                    }}
                  >
                    <Text style={[
                      styles.proficiencyLabel,
                      formData.proficiencyLevels[langCode] === level.id && styles.selectedText
                    ]}>
                      {level.label}
                    </Text>
                    <Text style={[
                      styles.proficiencyDescription,
                      formData.proficiencyLevels[langCode] === level.id && styles.selectedText
                    ]}>
                      {level.description}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
          ))}
          {errors.proficiency && <Text style={styles.error}>{errors.proficiency}</Text>}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Learning Goals</Text>
          <View style={styles.goalsGrid}>
            {LEARNING_GOALS.map(goal => (
              <TouchableOpacity
                key={goal.id}
                style={[
                  styles.goalCard,
                  formData.learningGoals.includes(goal.id) && styles.selectedCard
                ]}
                onPress={() => {
                  const updated = formData.learningGoals.includes(goal.id)
                    ? formData.learningGoals.filter(g => g !== goal.id)
                    : [...formData.learningGoals, goal.id];
                  updateFormData({ learningGoals: updated });
                }}
              >
                <Text style={styles.goalIcon}>{goal.icon}</Text>
                <Text style={[
                  styles.goalLabel,
                  formData.learningGoals.includes(goal.id) && styles.selectedText
                ]}>
                  {goal.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
          {errors.goals && <Text style={styles.error}>{errors.goals}</Text>}
        </View>
      </ScrollView>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        <View style={styles.header}>
          <TouchableOpacity onPress={handleBack} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color="#FF6B00" />
          </TouchableOpacity>
          <Text style={styles.stepIndicator}>Step {currentStep} of 3</Text>
        </View>

        <View style={styles.progressBar}>
          {[1, 2, 3].map((step) => (
            <View
              key={step}
              style={[
                styles.progressStep,
                step <= currentStep && styles.progressStepActive
              ]}
            />
          ))}
        </View>

        <ScrollView style={styles.content}>
          {currentStep === 1 && renderStep1()}
          {currentStep === 2 && renderStep2()}
          {currentStep === 3 && renderStep3()}
        </ScrollView>

        <View style={styles.footer}>
          <TouchableOpacity
            style={styles.nextButton}
            onPress={handleNext}
          >
            <Text style={styles.nextButtonText}>
              {currentStep === 3 ? 'Create Account' : 'Next'}
            </Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
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
});

export default SignupScreen;