import React, { useState } from 'react';
import { 
  View, 
  Text, 
  TextInput, 
  TouchableOpacity, 
  StyleSheet, 
  ScrollView, 
  KeyboardAvoidingView, 
  Platform,
  Alert,
  ActivityIndicator
} from 'react-native';
import { sendPasswordResetEmail } from 'firebase/auth';
import { auth } from '../../firebaseConfig';

export default function BusinessForgotPassword({ navigation }) {
  const [email, setEmail] = useState('');
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [emailFocused, setEmailFocused] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleResetPassword = async () => {
    if (!email.trim()) {
      Alert.alert('Error', 'Please enter your business email address');
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      Alert.alert('Error', 'Please enter a valid email address');
      return;
    }

    setLoading(true);

    try {
      await sendPasswordResetEmail(auth, email);
      console.log('Business password reset email sent to:', email);
      setIsSubmitted(true);
    } catch (error) {
      console.error('Business password reset error:', error);
      
      let errorMessage = 'An error occurred while sending reset email';
      
      switch (error.code) {
        case 'auth/user-not-found':
          errorMessage = 'No business account found with this email address';
          break;
        case 'auth/invalid-email':
          errorMessage = 'Invalid email address';
          break;
        case 'auth/too-many-requests':
          errorMessage = 'Too many requests. Please try again later';
          break;
        case 'auth/network-request-failed':
          errorMessage = 'Network error. Please check your connection';
          break;
        default:
          errorMessage = error.message || 'Failed to send reset email';
      }
      
      Alert.alert('Error', errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleBackToLogin = () => {
    navigation?.navigate('BusinessLogin');
  };

  const handleResendEmail = async () => {
    setLoading(true);
    
    try {
      await sendPasswordResetEmail(auth, email);
      Alert.alert('Success', 'Reset link has been resent to your business email');
      console.log('Business reset email resent to:', email);
    } catch (error) {
      console.error('Resend error:', error);
      Alert.alert('Error', 'Failed to resend email. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (isSubmitted) {
    return (
      <KeyboardAvoidingView 
        style={styles.container} 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView 
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Header Section with Accent */}
          <View style={styles.headerAccent} />

          {/* Success Icon */}
          <View style={styles.successIconContainer}>
            <View style={styles.successIcon}>
              <Text style={styles.checkmark}>✓</Text>
            </View>
          </View>

          {/* Success Message */}
          <View style={styles.titleSection}>
            <Text style={styles.title}>Check Your Email</Text>
            <Text style={styles.successMessage}>
              We've sent a password reset link to
            </Text>
            <Text style={styles.emailText}>{email}</Text>
            <Text style={styles.instructionText}>
              Click the link in the email to reset your business account password. If you don't see it, check your spam folder.
            </Text>
          </View>

          {/* Action Buttons */}
          <View style={styles.formContainer}>
            <TouchableOpacity 
              style={[styles.resendButton, loading && styles.buttonDisabled]}
              onPress={handleResendEmail}
              activeOpacity={0.8}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="#1E40AF" size="small" />
              ) : (
                <Text style={styles.resendButtonText}>Resend Email</Text>
              )}
            </TouchableOpacity>

            <TouchableOpacity 
              style={[styles.backButton, loading && styles.backButtonDisabled]}
              onPress={handleBackToLogin}
              activeOpacity={0.8}
              disabled={loading}
            >
              <Text style={styles.backButtonText}>Back to Login</Text>
            </TouchableOpacity>
          </View>

          {/* Footer */}
          <View style={styles.footer}>
            <Text style={styles.footerText}>
              Secure password reset • Protected by encryption
            </Text>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    );
  }

  return (
    <KeyboardAvoidingView 
      style={styles.container} 
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView 
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* Back Button */}
        <TouchableOpacity 
          style={styles.backArrowButton}
          onPress={handleBackToLogin}
          activeOpacity={0.7}
          disabled={loading}
        >
          <Text style={styles.backArrow}>←</Text>
        </TouchableOpacity>

        {/* Header Section with Accent */}
        <View style={styles.headerAccent} />

        {/* Logo Section */}
        <View style={styles.logoContainer}>
          <View style={styles.logoPlaceholder}>
            <Text style={styles.logoText}>B</Text>
          </View>
          <Text style={styles.companyName}>Business Portal</Text>
        </View>

        {/* Title Section */}
        <View style={styles.titleSection}>
          <Text style={styles.title}>Forgot Password?</Text>
          <Text style={styles.subtitle}>
            Don't worry! Enter your business email address and we'll send you a link to reset your password.
          </Text>
        </View>

        {/* Reset Form */}
        <View style={styles.formContainer}>
          {/* Email Input */}
          <View style={styles.inputContainer}>
            <Text style={styles.label}>Business Email</Text>
            <View style={[
              styles.inputWrapper,
              emailFocused && styles.inputWrapperFocused
            ]}>
              <TextInput
                style={styles.input}
                placeholder="name@company.com"
                placeholderTextColor="#9CA3AF"
                value={email}
                onChangeText={setEmail}
                onFocus={() => setEmailFocused(true)}
                onBlur={() => setEmailFocused(false)}
                keyboardType="email-address"
                autoCapitalize="none"
                autoComplete="email"
                editable={!loading}
              />
            </View>
          </View>

          {/* Reset Password Button */}
          <TouchableOpacity 
            style={[styles.resetButton, loading && styles.resetButtonDisabled]}
            onPress={handleResetPassword}
            activeOpacity={0.8}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#fff" size="small" />
            ) : (
              <Text style={styles.resetButtonText}>Send Reset Link</Text>
            )}
          </TouchableOpacity>

          {/* Divider */}
          <View style={styles.dividerContainer}>
            <View style={styles.divider} />
            <Text style={styles.dividerText}>or</Text>
            <View style={styles.divider} />
          </View>

          {/* Back to Login Link */}
          <View style={styles.loginContainer}>
            <Text style={styles.loginText}>Remember your password? </Text>
            <TouchableOpacity 
              onPress={handleBackToLogin}
              activeOpacity={0.7}
              disabled={loading}
            >
              <Text style={styles.loginLink}>Sign In</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Footer */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>
            Secure password reset • Protected by encryption
          </Text>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
    paddingTop: 40,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 24,
    paddingBottom: 32,
  },
  headerAccent: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 200,
    backgroundColor: '#F8FAFC',
    borderBottomLeftRadius: 32,
    borderBottomRightRadius: 32,
  },
  backArrowButton: {
    position: 'absolute',
    top: 50,
    left: 24,
    width: 44,
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(108, 79, 79, 0.2)',
    borderRadius: 22,
    zIndex: 10,
    borderWidth: 1,
    borderColor: 'rgba(77, 13, 13, 0.3)',
  },
  backArrow: {
    fontSize: 24,
    color: '#1E40AF',
    fontWeight: '600',
  },
  logoContainer: {
    alignItems: 'center',
    marginTop: 40,
    marginBottom: 24,
    zIndex: 1,
  },
  logoPlaceholder: {
    width: 90,
    height: 90,
    backgroundColor: '#1E40AF',
    borderRadius: 45,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
  },
  logoText: {
    fontSize: 36,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  companyName: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1E40AF',
    marginTop: 12,
    letterSpacing: 0.5,
  },
  titleSection: {
    marginTop: -20,
    marginBottom: 32,
    zIndex: 1,
    alignItems: 'center',
  },
  title: {
    fontSize: 32,
    fontWeight: '700',
    color: '#0F172A',
    marginBottom: 12,
    letterSpacing: -0.5,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: '#64748B',
    textAlign: 'center',
    lineHeight: 24,
    paddingHorizontal: 20,
  },
  formContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  inputContainer: {
    marginBottom: 24,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1E293B',
    marginBottom: 8,
  },
  inputWrapper: {
    height: 52,
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    borderRadius: 10,
    backgroundColor: '#F8FAFC',
    justifyContent: 'center',
    transition: 'all 0.3s',
  },
  inputWrapperFocused: {
    borderColor: '#1E40AF',
    backgroundColor: '#FFFFFF',
    shadowColor: '#1E40AF',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  input: {
    flex: 1,
    paddingHorizontal: 16,
    fontSize: 15,
    color: '#0F172A',
    fontWeight: '500',
  },
  resetButton: {
    height: 52,
    backgroundColor: '#1E40AF',
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#1E40AF',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  resetButtonDisabled: {
    backgroundColor: '#94A3B8',
    shadowOpacity: 0.1,
  },
  resetButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: 0.5,
  },
  dividerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 24,
  },
  divider: {
    flex: 1,
    height: 1,
    backgroundColor: '#E2E8F0',
  },
  dividerText: {
    fontSize: 13,
    color: '#94A3B8',
    marginHorizontal: 16,
    fontWeight: '500',
  },
  loginContainer: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
  },
  loginText: {
    fontSize: 14,
    color: '#64748B',
    fontWeight: '500',
  },
  loginLink: {
    fontSize: 15,
    color: '#1E40AF',
    fontWeight: '700',
  },
  footer: {
    marginTop: 32,
    alignItems: 'center',
  },
  footerText: {
    fontSize: 12,
    color: '#94A3B8',
    textAlign: 'center',
    fontWeight: '500',
  },
  // Success screen styles
  successIconContainer: {
    alignItems: 'center',
    marginTop: 100,
    marginBottom: 32,
    zIndex: 1,
  },
  successIcon: {
    width: 100,
    height: 100,
    backgroundColor: '#10B981',
    borderRadius: 50,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#10B981',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 8,
  },
  checkmark: {
    fontSize: 50,
    color: '#FFFFFF',
    fontWeight: 'bold',
  },
  successMessage: {
    fontSize: 16,
    color: '#64748B',
    textAlign: 'center',
    marginBottom: 8,
    marginTop: 12,
  },
  emailText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1E40AF',
    textAlign: 'center',
    marginBottom: 16,
  },
  instructionText: {
    fontSize: 14,
    color: '#64748B',
    textAlign: 'center',
    lineHeight: 22,
    paddingHorizontal: 20,
  },
  resendButton: {
    height: 52,
    backgroundColor: '#FFFFFF',
    borderWidth: 2,
    borderColor: '#1E40AF',
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  resendButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1E40AF',
    letterSpacing: 0.5,
  },
  backButton: {
    height: 52,
    backgroundColor: '#1E40AF',
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#1E40AF',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  backButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: 0.5,
  },
  backButtonDisabled: {
    backgroundColor: '#94A3B8',
    shadowOpacity: 0.1,
  },
  buttonDisabled: {
    backgroundColor: '#F1F5F9',
    borderColor: '#D1D5DB',
  },
});