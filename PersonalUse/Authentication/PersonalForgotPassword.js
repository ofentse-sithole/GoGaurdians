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
import Icon from 'react-native-vector-icons/Ionicons'; // Using Ionicons for professional icons

export default function PersonalForgotPassword({ navigation }) {
  const [email, setEmail] = useState('');
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [emailFocused, setEmailFocused] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleResetPassword = async () => {
    if (!email.trim()) {
      Alert.alert('Error', 'Please enter your email address');
      return;
    }

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      Alert.alert('Error', 'Please enter a valid email address');
      return;
    }

    setLoading(true);

    try {
      await sendPasswordResetEmail(auth, email);
      console.log('Password reset email sent to:', email);
      setIsSubmitted(true);
    } catch (error) {
      console.error('Password reset error:', error);
      
      let errorMessage = 'An error occurred while sending reset email';
      
      switch (error.code) {
        case 'auth/user-not-found':
          errorMessage = 'No account found with this email address';
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
    navigation?.navigate('PersonalLogin');
  };

  const handleResendEmail = async () => {
    setLoading(true);
    
    try {
      await sendPasswordResetEmail(auth, email);
      Alert.alert('Success', 'Reset link has been resent to your email');
      console.log('Reset email resent to:', email);
    } catch (error) {
      console.error('Resend error:', error);
      Alert.alert('Error', 'Failed to resend email. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Success Screen
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
          {/* Background Elements */}
          <View style={styles.backgroundPattern}>
            <View style={styles.gradientOrb1} />
            <View style={styles.gradientOrb2} />
            <View style={styles.gradientOrb3} />
          </View>

          {/* Success Icon */}
          <View style={styles.successSection}>
            <View style={styles.successIconContainer}>
              <View style={styles.successIconWrapper}>
                <View style={styles.successIconCore}>
                  <Icon name="checkmark-outline" size={48} color="#ffffff" />
                </View>
                <View style={styles.successIconRing} />
              </View>
            </View>

            {/* Success Message */}
            <View style={styles.successContent}>
              <Text style={styles.successTitle}>Check Your Email</Text>
              <Text style={styles.successMessage}>
                We've sent a password reset link to
              </Text>
              <View style={styles.emailContainer}>
                <Icon name="mail-outline" size={20} color="#2563EB" />
                <Text style={styles.emailText}>{email}</Text>
              </View>
              <Text style={styles.instructionText}>
                Click the link in the email to reset your password. If you don't see it, check your spam folder.
              </Text>
            </View>
          </View>

          {/* Action Buttons */}
          <View style={styles.actionsCard}>
            <TouchableOpacity 
              style={[styles.resendButton, loading && styles.buttonDisabled]}
              onPress={handleResendEmail}
              activeOpacity={0.8}
              disabled={loading}
            >
              <View style={styles.buttonContent}>
                {loading ? (
                  <ActivityIndicator color="#2563EB" size="small" />
                ) : (
                  <>
                    <Icon name="refresh-outline" size={20} color="#2563EB" />
                    <Text style={styles.resendButtonText}>Resend Email</Text>
                  </>
                )}
              </View>
            </TouchableOpacity>

            <TouchableOpacity 
              style={[styles.backToLoginButton, loading && styles.backToLoginButtonDisabled]}
              onPress={handleBackToLogin}
              activeOpacity={0.9}
              disabled={loading}
            >
              <View style={styles.buttonContent}>
                <Icon name="arrow-back-outline" size={20} color="#ffffff" />
                <Text style={styles.backToLoginButtonText}>Back to Login</Text>
              </View>
              <View style={styles.buttonGradientOverlay} />
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    );
  }

  // Reset Password Form Screen
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
        {/* Background Elements */}
        <View style={styles.backgroundPattern}>
          <View style={styles.gradientOrb1} />
          <View style={styles.gradientOrb2} />
          <View style={styles.gradientOrb3} />
        </View>

        {/* Header Section */}
        <View style={styles.headerSection}>
          {/* Back Button */}
          <TouchableOpacity 
            style={styles.backButton}
            onPress={handleBackToLogin}
            activeOpacity={0.8}
            disabled={loading}
          >
            <Icon name="arrow-back-outline" size={24} color="#64748B" />
          </TouchableOpacity>

          {/* Professional Logo */}
          <View style={styles.logoContainer}>
            <View style={styles.logoWrapper}>
              <View style={styles.logoCore}>
                <Icon name="key-outline" size={28} color="#ffffff" />
              </View>
              <View style={styles.logoRing} />
            </View>
          </View>

          {/* Title Section */}
          <View style={styles.titleContainer}>
            <Text style={styles.mainTitle}>Forgot Password?</Text>
            <Text style={styles.mainSubtitle}>
              Don't worry! Enter your email address and we'll send you a secure link to reset your password.
            </Text>
          </View>
        </View>

        {/* Form Card */}
        <View style={styles.formCard}>
          <View style={styles.formHeader}>
            <Text style={styles.formTitle}>Reset Password</Text>
            <Text style={styles.formSubtitle}>Enter your email to receive reset instructions</Text>
          </View>

          {/* Email Input */}
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Email Address</Text>
            <View style={[
              styles.inputContainer,
              emailFocused && styles.inputContainerFocused
            ]}>
              <View style={styles.inputIconContainer}>
                <Icon 
                  name="mail-outline" 
                  size={20} 
                  color={emailFocused ? '#2563EB' : '#6B7280'} 
                />
              </View>
              <TextInput
                style={styles.textInput}
                placeholder="Enter your email address"
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
              {email.length > 0 && (
                <View style={styles.inputIndicator}>
                  <Icon 
                    name="checkmark-circle-outline" 
                    size={20} 
                    color="#10B981" 
                  />
                </View>
              )}
            </View>
          </View>

          {/* Send Reset Link Button */}
          <TouchableOpacity 
            style={[styles.resetButton, loading && styles.resetButtonDisabled]}
            onPress={handleResetPassword}
            activeOpacity={0.9}
            disabled={loading}
          >
            <View style={styles.buttonContent}>
              {loading ? (
                <ActivityIndicator color="#ffffff" size="small" />
              ) : (
                <>
                  <Text style={styles.resetButtonText}>Send Reset Link</Text>
                  <Icon name="send-outline" size={20} color="#ffffff" />
                </>
              )}
            </View>
            <View style={styles.buttonGradientOverlay} />
          </TouchableOpacity>

          {/* Divider */}
          <View style={styles.dividerSection}>
            <View style={styles.dividerLine} />
            <Text style={styles.dividerText}>or</Text>
            <View style={styles.dividerLine} />
          </View>

          {/* Back to Login Section */}
          <View style={styles.loginSection}>
            <Text style={styles.loginText}>Remember your password? </Text>
            <TouchableOpacity 
              onPress={handleBackToLogin}
              style={styles.loginLinkButton}
              disabled={loading}
            >
              <Text style={styles.loginLink}>Sign In</Text>
              <Icon name="arrow-forward-outline" size={16} color="#2563EB" />
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 24,
    paddingTop: Platform.OS === 'ios' ? 60 : 40,
    paddingBottom: 40,
  },

  // Background Elements
  backgroundPattern: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    overflow: 'hidden',
  },
  gradientOrb1: {
    position: 'absolute',
    width: 280,
    height: 280,
    borderRadius: 140,
    backgroundColor: 'rgba(37, 99, 235, 0.06)',
    top: -80,
    right: -60,
    opacity: 0.8,
  },
  gradientOrb2: {
    position: 'absolute',
    width: 180,
    height: 180,
    borderRadius: 90,
    backgroundColor: 'rgba(168, 85, 247, 0.04)',
    bottom: 200,
    left: -40,
    opacity: 0.6,
  },
  gradientOrb3: {
    position: 'absolute',
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: 'rgba(59, 130, 246, 0.08)',
    top: '50%',
    right: -20,
    opacity: 0.5,
  },

  // Header Section
  headerSection: {
    alignItems: 'center',
    marginBottom: 40,
    zIndex: 10,
  },
  backButton: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#ffffff',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
    borderWidth: 1,
    borderColor: 'rgba(226, 232, 240, 0.5)',
    zIndex: 20,
  },
  logoContainer: {
    marginTop: 60,
    marginBottom: 32,
  },
  logoWrapper: {
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoCore: {
    width: 72,
    height: 72,
    borderRadius: 20,
    backgroundColor: '#2563EB',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#2563EB',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 10,
    zIndex: 2,
  },
  logoRing: {
    position: 'absolute',
    width: 88,
    height: 88,
    borderRadius: 24,
    borderWidth: 2,
    borderColor: 'rgba(37, 99, 235, 0.2)',
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
    zIndex: 1,
  },
  titleContainer: {
    alignItems: 'center',
  },
  mainTitle: {
    fontSize: 36,
    fontWeight: '800',
    color: '#0F172A',
    marginBottom: 12,
    letterSpacing: -1,
    textAlign: 'center',
  },
  mainSubtitle: {
    fontSize: 16,
    color: '#64748B',
    textAlign: 'center',
    lineHeight: 26,
    letterSpacing: 0.1,
    paddingHorizontal: 16,
  },

  // Form Card
  formCard: {
    backgroundColor: '#ffffff',
    borderRadius: 24,
    padding: 32,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 24,
    elevation: 8,
    borderWidth: 1,
    borderColor: 'rgba(226, 232, 240, 0.5)',
  },
  formHeader: {
    marginBottom: 32,
    alignItems: 'center',
  },
  formTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#0F172A',
    marginBottom: 6,
    letterSpacing: -0.3,
  },
  formSubtitle: {
    fontSize: 15,
    color: '#64748B',
    textAlign: 'center',
  },

  // Input Styles
  inputGroup: {
    marginBottom: 32,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
    letterSpacing: 0.1,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 56,
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    borderRadius: 16,
    backgroundColor: '#F8FAFC',
    paddingHorizontal: 16,
    transition: 'all 0.2s ease',
  },
  inputContainerFocused: {
    borderColor: '#2563EB',
    backgroundColor: '#ffffff',
    shadowColor: '#2563EB',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 4,
  },
  inputIconContainer: {
    marginRight: 12,
    width: 24,
    alignItems: 'center',
  },
  textInput: {
    flex: 1,
    fontSize: 16,
    color: '#0F172A',
    padding: 0,
    lineHeight: 24,
  },
  inputIndicator: {
    marginLeft: 8,
  },

  // Button Styles
  resetButton: {
    height: 56,
    borderRadius: 16,
    backgroundColor: '#2563EB',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 32,
    shadowColor: '#2563EB',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 8,
    overflow: 'hidden',
    position: 'relative',
  },
  resetButtonDisabled: {
    backgroundColor: '#94A3B8',
    shadowOpacity: 0.1,
  },
  buttonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    zIndex: 2,
  },
  resetButtonText: {
    fontSize: 17,
    fontWeight: '700',
    color: '#ffffff',
    letterSpacing: 0.3,
  },
  buttonGradientOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: '50%',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    zIndex: 1,
  },

  // Divider
  dividerSection: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 24,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: '#E2E8F0',
  },
  dividerText: {
    fontSize: 14,
    color: '#94A3B8',
    marginHorizontal: 16,
    fontWeight: '500',
  },

  // Login Section
  loginSection: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    flexWrap: 'wrap',
  },
  loginText: {
    fontSize: 15,
    color: '#64748B',
  },
  loginLinkButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    padding: 4,
  },
  loginLink: {
    fontSize: 15,
    color: '#2563EB',
    fontWeight: '700',
  },

  // Success Screen Styles
  successSection: {
    alignItems: 'center',
    marginTop: 40,
    marginBottom: 40,
  },
  successIconContainer: {
    marginBottom: 40,
  },
  successIconWrapper: {
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
  },
  successIconCore: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#10B981',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#10B981',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 10,
    zIndex: 2,
  },
  successIconRing: {
    position: 'absolute',
    width: 120,
    height: 120,
    borderRadius: 60,
    borderWidth: 2,
    borderColor: 'rgba(16, 185, 129, 0.2)',
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
    zIndex: 1,
  },
  successContent: {
    alignItems: 'center',
  },
  successTitle: {
    fontSize: 32,
    fontWeight: '800',
    color: '#0F172A',
    marginBottom: 16,
    letterSpacing: -1,
    textAlign: 'center',
  },
  successMessage: {
    fontSize: 16,
    color: '#64748B',
    textAlign: 'center',
    marginBottom: 16,
    letterSpacing: 0.1,
  },
  emailContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EEF2FF',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: 'rgba(37, 99, 235, 0.2)',
  },
  emailText: {
    fontSize: 17,
    fontWeight: '700',
    color: '#2563EB',
    marginLeft: 8,
    letterSpacing: 0.2,
  },
  instructionText: {
    fontSize: 15,
    color: '#64748B',
    textAlign: 'center',
    lineHeight: 24,
    paddingHorizontal: 20,
    letterSpacing: 0.1,
  },

  // Action Buttons Card
  actionsCard: {
    backgroundColor: '#ffffff',
    borderRadius: 24,
    padding: 24,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 24,
    elevation: 8,
    borderWidth: 1,
    borderColor: 'rgba(226, 232, 240, 0.5)',
  },
  resendButton: {
    height: 56,
    backgroundColor: '#ffffff',
    borderWidth: 2,
    borderColor: '#2563EB',
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  resendButtonText: {
    fontSize: 17,
    fontWeight: '700',
    color: '#2563EB',
    letterSpacing: 0.3,
  },
  backToLoginButton: {
    height: 56,
    borderRadius: 16,
    backgroundColor: '#2563EB',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#2563EB',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 8,
    overflow: 'hidden',
    position: 'relative',
  },
  backToLoginButtonText: {
    fontSize: 17,
    fontWeight: '700',
    color: '#ffffff',
    letterSpacing: 0.3,
  },
  backToLoginButtonDisabled: {
    backgroundColor: '#94A3B8',
    shadowOpacity: 0.1,
  },
  buttonDisabled: {
    backgroundColor: '#F3F4F6',
    borderColor: '#D1D5DB',
  },
});