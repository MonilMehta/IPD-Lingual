import React, { useState, useRef } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import axios from 'axios';
import { router } from 'expo-router';
import { showMessage } from 'react-native-flash-message';

const FORGOT_ENDPOINT = 'https://lingual-yn5c.onrender.com/forgot_password';
const RESET_ENDPOINT = 'https://lingual-yn5c.onrender.com/reset_password';

const ForgotPasswordScreen = () => {
  const [step, setStep] = useState(1);
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [resendTimer, setResendTimer] = useState(0);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const handleSendEmail = async () => {
    if (!email) {
      showMessage({
        message: 'Error',
        description: 'Please enter your email',
        type: 'danger',
        icon: 'danger',
        duration: 2500,
      });
      return;
    }
    setLoading(true);
    try {
      await axios.post(FORGOT_ENDPOINT, { email });
      setStep(2);
      setResendTimer(60);
      timerRef.current = setInterval(() => {
        setResendTimer(prev => {
          if (prev <= 1) {
            if (timerRef.current) clearInterval(timerRef.current);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
      showMessage({
        message: 'OTP Sent',
        description: 'Check your email for the OTP.',
        type: 'success',
        icon: 'success',
        duration: 2500,
      });
    } catch (e) {
      showMessage({
        message: 'Error',
        description: 'Failed to send OTP. Please try again.',
        type: 'danger',
        icon: 'danger',
        duration: 2500,
      });
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async () => {
    if (!otp || !newPassword) {
      showMessage({
        message: 'Error',
        description: 'Please enter OTP and new password',
        type: 'danger',
        icon: 'danger',
        duration: 2500,
      });
      return;
    }
    setLoading(true);
    try {
      await axios.post(RESET_ENDPOINT, { email, otp, new_password: newPassword });
      showMessage({
        message: 'Success',
        description: 'Password reset! Please login.',
        type: 'success',
        icon: 'success',
        duration: 2500,
        onHide: () => router.replace('/(auth)/login'),
      });
    } catch (e) {
      showMessage({
        message: 'Error',
        description: 'Invalid OTP or password.',
        type: 'danger',
        icon: 'danger',
        duration: 2500,
      });
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    if (resendTimer > 0) return;
    setLoading(true);
    try {
      await axios.post(FORGOT_ENDPOINT, { email });
      setResendTimer(60);
      timerRef.current = setInterval(() => {
        setResendTimer(prev => {
          if (prev <= 1) {
            if (timerRef.current) clearInterval(timerRef.current);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
      showMessage({
        message: 'OTP resent!',
        description: 'A new OTP has been sent to your email.',
        type: 'success',
        icon: 'success',
        duration: 2500,
      });
    } catch (e) {
      showMessage({
        message: 'Error',
        description: 'Failed to resend OTP.',
        type: 'danger',
        icon: 'danger',
        duration: 2500,
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.centered}>
        <View style={styles.card}>
          <Text style={styles.title}>Forgot Password</Text>
          {step === 1 && (
            <>
              <Text style={styles.subtitle}>Enter your email to receive an OTP</Text>
              <View style={styles.inputWrapper}>
                <Ionicons name="mail-outline" size={22} color="#FF6B00" style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder="Email"
                  value={email}
                  onChangeText={setEmail}
                  autoCapitalize="none"
                  keyboardType="email-address"
                  placeholderTextColor="#aaa"
                />
              </View>
              <TouchableOpacity
                style={[styles.button, loading && styles.disabledButton]}
                onPress={handleSendEmail}
                disabled={loading}
              >
                <Text style={styles.buttonText}>{loading ? 'Sending...' : 'Send OTP'}</Text>
              </TouchableOpacity>
            </>
          )}
          {step === 2 && (
            <>
              <Text style={styles.subtitle}>Enter the OTP sent to your email and set a new password</Text>
              <View style={styles.inputWrapper}>
                <Ionicons name="key-outline" size={22} color="#FF6B00" style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder="OTP"
                  value={otp}
                  onChangeText={setOtp}
                  keyboardType="number-pad"
                  placeholderTextColor="#aaa"
                />
              </View>
              <View style={styles.inputWrapper}>
                <Ionicons name="lock-closed-outline" size={22} color="#FF6B00" style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder="New Password"
                  value={newPassword}
                  onChangeText={setNewPassword}
                  secureTextEntry
                  placeholderTextColor="#aaa"
                />
              </View>
              <TouchableOpacity
                style={[styles.button, loading && styles.disabledButton]}
                onPress={handleResetPassword}
                disabled={loading}
              >
                <Text style={styles.buttonText}>{loading ? 'Resetting...' : 'Reset Password'}</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.resendButton, resendTimer > 0 && styles.disabledButton]}
                onPress={handleResend}
                disabled={resendTimer > 0}
              >
                <Text style={styles.resendText}>
                  {resendTimer > 0 ? `Resend OTP in ${resendTimer}s` : 'Resend OTP'}
                </Text>
              </TouchableOpacity>
            </>
          )}
        </View>
        <TouchableOpacity style={styles.backLink} onPress={() => router.replace('/(auth)/login')}>
          <Text style={styles.backText}>Back to Login</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFF6F0',
  },
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 20,
  },
  card: {
    width: '100%',
    backgroundColor: '#fff',
    borderRadius: 18,
    padding: 28,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 16,
    elevation: 6,
    alignItems: 'stretch',
    maxWidth: 400,
  },
  title: {
    fontSize: 26,
    fontWeight: 'bold',
    color: '#222',
    marginBottom: 2,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginBottom: 18,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8F8F8',
    borderRadius: 12,
    paddingHorizontal: 16,
    marginBottom: 18,
    borderWidth: 1,
    borderColor: '#eee',
    height: 56,
  },
  inputIcon: {
    marginRight: 8,
  },
  input: {
    flex: 1,
    fontSize: 18,
    color: '#222',
    paddingVertical: 12,
    backgroundColor: 'transparent',
  },
  button: {
    padding: 16,
    borderRadius: 10,
    backgroundColor: '#FF6B00',
    alignItems: 'center',
    marginTop: 4,
  },
  buttonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 17,
  },
  disabledButton: {
    backgroundColor: '#transparent',
  },
  resendButton: {
    alignItems: 'center',
    marginTop: 16,
    backgroundColor: 'transparent',
  },
  resendText: {
    color: '#FF6B00',
    fontWeight: '500',
    fontSize: 15,
  },
  backLink: {
    alignItems: 'center',
    marginTop: 32,
  },
  backText: {
    color: '#666',
    fontSize: 15,
  },
});

export default ForgotPasswordScreen;
