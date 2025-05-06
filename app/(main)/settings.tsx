import React, { useState, useRef } from 'react';
import { 
  View, 
  Text, 
  TextInput, 
  TouchableOpacity, 
  StyleSheet, 
  ScrollView, 
  Alert, 
  Image,
  ActivityIndicator
} from 'react-native';
import { Collapsible } from '@/components/Collapsible';
const mascotImg= require('../../assets/images/cat-fixing.png');
import { FloatingTabBar } from '../../components/Navigation/FloatingTabBar';
import { View as RNView } from 'react-native';

// Separated constants for better organization
const CONSTANTS = {
  HELP_CENTER_URL: 'https://savory-worm-69e.notion.site/ebd/1ebdd605d73581dda6c0db129990cbd9',
  FEEDBACK_API: 'https://lingual-yn5c.onrender.com/api/feedback',
  APP_VERSION: '1.0.0'
};

const TERMS_TEXT = `Welcome to Lingual!\n\nBy using this app, you agree to:\n• Use the app for personal, non-commercial purposes only.\n• Not misuse or attempt to disrupt the service.\n• Respect copyright and intellectual property of content.\n• We do not guarantee accuracy of translations.\n• Your data is handled securely and not sold to third parties.\n\nFor any questions or support, please use the feedback form below.`;

const PRIVACY_TEXT = `Your privacy is important to us.\n\n• We collect only the data necessary to provide language features.\n• Your email is used for login, support, and data export.\n• We do not sell your data.\n• You can request data export or deletion anytime.\n\nFor privacy concerns or support, please use the feedback form below.`;

const FAQS = [
  {
    q: 'How do I change my learning language?',
    a: 'Go to your profile and select a new language. Your progress will reset for the new language.'
  },
  {
    q: 'How do I export my data?',
    a: 'Use the Data Export section at the bottom of this page. Enter your email and you will receive your data within 48-72 working hours.'
  },
  {
    q: 'How do I contact support?',
    a: 'Use the feedback form below or check the Help Center for instant answers.'
  },
  {
    q: 'Is my data safe?',
    a: 'Yes. We do not sell your data and you can request deletion at any time.'
  },
  {
    q: 'Can I use the app offline?',
    a: 'Some features may require an internet connection, but phrasebook and guides are available offline after first load.'
  },
  {
    q: 'How does detection work?',
    a: 'Detection uses our in-house developed machine learning model to recognize and translate text or speech from your surroundings quickly and accurately.'
  },
  {
    q: 'How do I use live translation?',
    a: 'Just select the language you want to communicate in, press record, and the live translation will happen automatically.'
  }
];

export default function Settings() {
  // State variables
  const [dataExport, setDataExport] = useState({
    email: '',
    loading: false,
    success: false,
    error: null
  });
  
  const [feedback, setFeedback] = useState({
    email: '',
    satisfaction: '',
    recommendation: '',
    additionalNotes: '',
    message: '',
    loading: false,
    success: false,
    error: null
  });

  // Section refs for scrolling
  const scrollRef = useRef(null);
  const faqRef = useRef(null);
  const feedbackRef = useRef(null);
  const legalRef = useRef(null);
  const privacyRef = useRef(null);
  const exportRef = useRef(null);

  // Helper to scroll to section
  const scrollToSection = (ref) => {
    if (ref.current && scrollRef.current) {
      ref.current.measureLayout(
        scrollRef.current.getInnerViewNode(),
        (x, y) => {
          scrollRef.current.scrollTo({ y: y - 20, animated: true });
        }
      );
    }
  };

  // Form validation
  const validateEmail = (email) => {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(email);
  };

  const validateRating = (rating) => {
    return rating >= 1 && rating <= 5;
  };

  // Handle data export request
  const handleExport = async () => {
    // Form validation
    if (!dataExport.email) {
      return Alert.alert('Missing Information', 'Please enter your email address');
    }
    
    if (!validateEmail(dataExport.email)) {
      return Alert.alert('Invalid Email', 'Please enter a valid email address');
    }
    
    setDataExport(prev => ({ ...prev, loading: true, error: null }));
    
    try {
      // Here you would send the actual API request to your backend
      // For demonstration purposes, we're simulating success
      setTimeout(() => {
        setDataExport(prev => ({ 
          ...prev, 
          loading: false, 
          success: true 
        }));
      }, 1500);
      
    } catch (error) {
      setDataExport(prev => ({ 
        ...prev, 
        loading: false, 
        error: 'Failed to submit request. Please try again.' 
      }));
    }
  };

  // Handle feedback submission
  const handleFeedback = async () => {
    // Form validation
    if (!feedback.email || !feedback.message || !feedback.satisfaction || !feedback.recommendation) {
      return Alert.alert('Missing Information', 'Please fill all required fields');
    }
    
    if (!validateEmail(feedback.email)) {
      return Alert.alert('Invalid Email', 'Please enter a valid email address');
    }
    
    if (!validateRating(parseInt(feedback.satisfaction)) || !validateRating(parseInt(feedback.recommendation))) {
      return Alert.alert('Invalid Rating', 'Ratings must be between 1 and 5');
    }
    
    setFeedback(prev => ({ ...prev, loading: true, error: null }));
    
    try {
      // Prepare the payload
      const payload = {
        email: feedback.email,
        satisfaction: parseInt(feedback.satisfaction),
        recommendation: parseInt(feedback.recommendation),
        additionalNotes: feedback.additionalNotes,
        message: feedback.message,
      };
      
      // Make the POST request
      const response = await fetch('https://lingual-yn5c.onrender.com/api/feedback', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });
      
      if (!response.ok) {
        throw new Error('Network response was not ok');
      }
      
      setFeedback(prev => ({ 
        ...prev, 
        loading: false, 
        success: true,
        // Reset form fields after successful submission
        email: '',
        satisfaction: '',
        recommendation: '',
        additionalNotes: '',
        message: '',
      }));
      
      Alert.alert('Success', 'Thank you for your feedback! We appreciate your input.');
      
    } catch (error) {
      setFeedback(prev => ({ 
        ...prev, 
        loading: false, 
        error: 'Failed to submit feedback. Please try again.' 
      }));
      
      Alert.alert('Error', 'Failed to submit feedback. Please try again later.');
    }
  };

  // Reset data export form
  const resetDataExport = () => {
    setDataExport({
      email: '',
      loading: false,
      success: false,
      error: null
    });
  };

  // Reset feedback form
  const resetFeedback = () => {
    setFeedback(prev => ({
      ...prev,
      success: false,
      error: null
    }));
  };

  return (
    <RNView style={{ flex: 1, backgroundColor: '#FFF' }}>
      <ScrollView contentContainerStyle={styles.container} ref={scrollRef} style={{ backgroundColor: '#FFF' }}>
        
        <View style={styles.mascotContainer}>
          <Text style={styles.mascotText}>Ollie is here to help!</Text>
          <Image source={mascotImg} style={styles.mascotImage} resizeMode="contain" />
        </View>
        <View style={styles.topRow}>
          <View style={styles.badgeRow}>
            <TouchableOpacity style={styles.badge} onPress={() => scrollToSection(faqRef)}><Text style={styles.badgeText}>FAQ</Text></TouchableOpacity>
            <TouchableOpacity style={styles.badge} onPress={() => scrollToSection(feedbackRef)}><Text style={styles.badgeText}>Feedback</Text></TouchableOpacity>
            <TouchableOpacity style={styles.badge} onPress={() => scrollToSection(legalRef)}><Text style={styles.badgeText}>Legal</Text></TouchableOpacity>
            <TouchableOpacity style={styles.badge} onPress={() => scrollToSection(privacyRef)}><Text style={styles.badgeText}>Privacy Policy</Text></TouchableOpacity>
            <TouchableOpacity style={styles.badge} onPress={() => scrollToSection(exportRef)}><Text style={styles.badgeText}>Export Data</Text></TouchableOpacity>
          </View>
          <Text style={styles.versionText}>v1.0.0</Text>
        </View>
        {/* Support Section */}
        <Text style={styles.header} ref={faqRef}>Support</Text>
        
        <Text style={[styles.sectionTitle, {color: '#FF6B00'}]}>Help Center / FAQ</Text>
        <View style={[styles.faqCard, { backgroundColor: '#FFF3E6' }]}>
          {FAQS.map((item, idx) => (
            <Collapsible key={idx} title={item.q}>
              <Text style={styles.faqAnswer}>{item.a}</Text>
            </Collapsible>
          ))}
        </View>
        
        {/* Feedback Form */}
        <Text style={[styles.sectionTitle, {color: '#FF6B00'}]} ref={feedbackRef}>Send Feedback</Text>
        {feedback.success ? (
          <View style={styles.successContainer}>
            <Text style={styles.successMsg}>Thank you for your feedback!</Text>
            <TouchableOpacity style={styles.resetButton} onPress={resetFeedback}>
              <Text style={styles.resetButtonText}>Submit Another</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.card}>
            {feedback.error && <Text style={styles.errorText}>{feedback.error}</Text>}
            
            <FormField 
              label="Your Email" 
              placeholder="Enter your email address"
              value={feedback.email}
              onChangeText={(text) => setFeedback(prev => ({ ...prev, email: text }))}
              keyboardType="email-address"
              autoCapitalize="none"
              required
            />
            
            <RatingSelector
              label="How satisfied are you with our product?"
              value={feedback.satisfaction}
              onChange={(val) => setFeedback(prev => ({ ...prev, satisfaction: val }))}
            />
            <RatingSelector
              label="How likely are you to recommend us?"
              value={feedback.recommendation}
              onChange={(val) => setFeedback(prev => ({ ...prev, recommendation: val }))}
            />
            
            <FormField 
              label="Additional Comments (Optional)"
              placeholder="Any suggestions for improvement?"
              value={feedback.additionalNotes}
              onChangeText={(text) => setFeedback(prev => ({ ...prev, additionalNotes: text }))}
              multiline
              numberOfLines={3}
            />
            
            <TouchableOpacity 
              style={[styles.button, feedback.loading && styles.buttonDisabled]}
              onPress={handleFeedback}
              disabled={feedback.loading}
            >
              {feedback.loading ? (
                <ActivityIndicator color="#FFF" />
              ) : (
                <Text style={styles.buttonText}>Send Feedback</Text>
              )}
            </TouchableOpacity>
          </View>
        )}
        
        {/* App Version */}
        <SectionTitle title="App Version" />
        <Text style={styles.infoText}>v{CONSTANTS.APP_VERSION}</Text>
        
        {/* Legal Section */}
        <Text style={[styles.header, {color: '#FF6B00'}]} ref={legalRef}>Legal</Text>
        
        <Text style={[styles.sectionTitle, {color: '#FF6B00'}]}>Terms of Service</Text>
        <View style={styles.legalCard}>
          <Text style={styles.legalText}>{TERMS_TEXT}</Text>
        </View>
        
        <Text style={[styles.sectionTitle, {color: '#FF6B00'}]} ref={privacyRef}>Privacy Policy</Text>
        <View style={styles.legalCard}>
          <Text style={styles.legalText}>{PRIVACY_TEXT}</Text>
        </View>
        
        {/* Data Export Section */}
        <Text style={[styles.header, {color: '#FF6B00'}]} ref={exportRef}>Data Export / Download</Text>
        {dataExport.success ? (
          <View style={styles.successContainer}>
            <Text style={styles.successMsg}>Request received! You will receive your data via email within 48-72 working hours.</Text>
            <TouchableOpacity style={styles.resetButton} onPress={resetDataExport}>
              <Text style={styles.resetButtonText}>Make Another Request</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.card}>
            {dataExport.error && <Text style={styles.errorText}>{dataExport.error}</Text>}
            
            <FormField 
              label="Your Email"
              placeholder="Enter your email address"
              value={dataExport.email}
              onChangeText={(text) => setDataExport(prev => ({ ...prev, email: text }))}
              keyboardType="email-address"
              autoCapitalize="none"
              required
            />
            
            <TouchableOpacity 
              style={[styles.button, dataExport.loading && styles.buttonDisabled]}
              onPress={handleExport}
              disabled={dataExport.loading}
            >
              {dataExport.loading ? (
                <ActivityIndicator color="#FFF" />
              ) : (
                <Text style={styles.buttonText}>Request Data Export</Text>
              )}
            </TouchableOpacity>
          </View>
        )}
        
        {/* Bottom spacing */}
        <View style={{ height: 80 }} />
      </ScrollView>
      <FloatingTabBar />
    </RNView>
  );
}

// Component for section headers
const SectionHeader = ({ title }) => (
  <Text style={styles.header}>{title}</Text>
);

// Component for section titles
const SectionTitle = ({ title }) => (
  <Text style={styles.sectionTitle}>{title}</Text>
);

// Reusable form field component
const FormField = ({ label, required, ...props }) => (
  <View style={styles.formField}>
    <Text style={styles.label}>
      {label} {required && <Text style={styles.requiredStar}>*</Text>}
    </Text>
    <TextInput
      style={[
        styles.input,
        props.multiline && { height: props.numberOfLines * 24 }
      ]}
      {...props}
    />
  </View>
);

// Add a reusable RatingSelector component
const RatingSelector = ({ value, onChange, label }) => (
  <View style={styles.ratingRow}>
    <Text style={styles.label}>{label}</Text>
    <View style={styles.ratingOptions}>
      {[1,2,3,4,5].map((num) => (
        <TouchableOpacity
          key={num}
          style={[styles.ratingCircle, value == num && styles.ratingCircleSelected]}
          onPress={() => onChange(num.toString())}
        >
          <Text style={[styles.ratingNum, value == num && styles.ratingNumSelected]}>{num}</Text>
        </TouchableOpacity>
      ))}
    </View>
  </View>
);

const styles = StyleSheet.create({
  scrollView: {
    backgroundColor: '#FFFFFF',
  },
  container: {
    padding: 20,
  },
  header: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#FF6B00',
    marginTop: 24,
    marginBottom: 8,
    paddingBottom: 6,
    borderBottomWidth: 1,
    borderBottomColor: '#FFE0CC',
  },
  sectionTitle: {
    fontSize: 17,
    fontWeight: '600',
    marginTop: 16,
    marginBottom: 8,
    color: '#333',
  },
  card: {
    backgroundColor: '#FFF3E6',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  formField: {
    marginBottom: 12,
  },
  label: {
    fontWeight: '500',
    color: '#555',
    marginBottom: 4,
    fontSize: 15,
  },
  requiredStar: {
    color: '#FF6B00',
    fontWeight: 'bold',
  },
  input: {
    backgroundColor: '#FFF',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#FFB980',
    padding: 12,
    fontSize: 16,
  },
  faqAnswer: {
    color: '#444',
    fontSize: 15,
    paddingVertical: 6,
    paddingLeft: 6,
    lineHeight: 22,
  },
  button: {
    backgroundColor: '#FF6B00',
    borderRadius: 10,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 12,
  },
  buttonDisabled: {
    backgroundColor: '#FFB980',
  },
  buttonText: {
    color: '#FFF',
    fontWeight: 'bold',
    fontSize: 16,
  },
  successContainer: {
    backgroundColor: '#E6F7E9',
    borderRadius: 12,
    padding: 16,
    marginVertical: 12,
    alignItems: 'center',
  },
  successMsg: {
    color: '#2E7D32',
    fontWeight: '600',
    textAlign: 'center',
    fontSize: 16,
    marginBottom: 16,
  },
  resetButton: {
    backgroundColor: '#4CAF50',
    borderRadius: 8,
    paddingVertical: 10,
    paddingHorizontal: 20,
  },
  resetButtonText: {
    color: '#FFF',
    fontWeight: '600',
  },
  errorText: {
    color: '#D32F2F',
    marginBottom: 12,
    fontWeight: '500',
  },
  infoText: {
    color: '#666',
    marginBottom: 16,
    fontSize: 15,
  },
  legalCard: {
    backgroundColor: '#F8F9FA',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#FFE0CC',
  },
  legalText: {
    color: '#333',
    fontSize: 15,
    lineHeight: 22,
  },
  mascotContainer: {
    alignItems: 'center',
    marginBottom: 24,
    marginTop: 8,
  },
  mascotImage: {
    width: 80,
    height: 80,
  },
  mascotText: {
    fontSize: 18,
    color: '#FF6B00',
    fontWeight: '600',
    marginBottom: 4,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
    marginTop: 8,
  },
  badgeRow: {
    flexDirection: 'row',
    gap: 8,
    alignItems: 'center',
  },
  badge: {
    backgroundColor: '#FF6B00',
    borderRadius: 16,
    paddingHorizontal: 14,
    paddingVertical: 6,
    marginRight: 6,
    elevation: 2,
  },
  badgeText: {
    color: '#FFF',
    fontWeight: 'bold',
    fontSize: 13,
  },
  versionText: {
    color: '#888',
    fontWeight: 'bold',
    fontSize: 14,
    alignSelf: 'flex-end',
    marginRight: 2,
  },
  faqCard: {
    backgroundColor: '#FFF3E6',
    borderRadius: 10,
    padding: 10,
    marginBottom: 12,
    marginTop: 2,
  },
  ratingRow: {
    marginBottom: 12,
  },
  ratingOptions: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 6,
  },
  ratingCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 2,
    borderColor: '#FFB980',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFF',
    marginRight: 8,
  },
  ratingCircleSelected: {
    borderColor: '#FF6B00',
    backgroundColor: '#FFEDD5',
  },
  ratingNum: {
    fontSize: 16,
    color: '#888',
    fontWeight: '600',
  },
  ratingNumSelected: {
    color: '#FF6B00',
    fontWeight: 'bold',
  },
});