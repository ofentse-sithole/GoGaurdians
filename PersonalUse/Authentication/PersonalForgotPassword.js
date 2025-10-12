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
  Alert 
} from 'react-native';
// Import your icon library here, for example:
// import Icon from 'react-native-vector-icons/Feather';

export default function ForgotPassword({ navigation }) {
  const [email, setEmail] = useState('');
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [emailFocused, setEmailFocused] = useState(false);

  const handleResetPassword = () => {
    if (!email) {
      Alert.alert('Error', 'Please enter your email address');
      return;
    }

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      Alert.alert('Error', 'Please enter a valid email address');
      return;
    }

    console.log('Reset password for:', email);
    // Add your password reset logic here (e.g., API call)
    
    setIsSubmitted(true);
  };

  const handleBackToLogin = () => {
    navigation?.navigate('PersonalLogin');
  };

  const handleResendEmail = () => {
    console.log('Resend email to:', email);
    Alert.alert('Success', 'Reset link has been resent to your email');
    // Add your resend logic here
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
          {/* Background Gradient Elements */}
          <View style={styles.gradientCircle1} />
          <View style={styles.gradientCircle2} />

          {/* Success Icon */}
          <View style={styles.successIconContainer}>
            <View style={styles.successIconOuter}>
              <View style={styles.successIcon}>
                {/* Replace with: <Icon name="check" size={48} color="#fff" /> */}
                <Text style={styles.checkmark}>✓</Text>
              </View>
            </View>
          </View>

          {/* Success Message */}
          <View style={styles.headerContainer}>
            <Text style={styles.title}>Check Your Email</Text>
            <Text style={styles.successMessage}>
              We've sent a password reset link to
            </Text>
            <Text style={styles.emailText}>{email}</Text>
            <Text style={styles.instructionText}>
              Click the link in the email to reset your password. If you don't see it, check your spam folder.
            </Text>
          </View>

          {/* Buttons Container */}
          <View style={styles.buttonsContainer}>
            {/* Resend Button */}
            <TouchableOpacity 
              style={styles.resendButton}
              onPress={handleResendEmail}
              activeOpacity={0.9}
            >
              <Text style={styles.resendButtonText}>Resend Email</Text>
            </TouchableOpacity>

            {/* Back to Login */}
            <TouchableOpacity 
              style={styles.backButton}
              onPress={handleBackToLogin}
              activeOpacity={0.9}
            >
              <Text style={styles.backButtonText}>Back to Login</Text>
              <View style={styles.buttonShine} />
            </TouchableOpacity>
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
        {/* Background Gradient Elements */}
        <View style={styles.gradientCircle1} />
        <View style={styles.gradientCircle2} />

        {/* Back Button */}
        <TouchableOpacity 
          style={styles.backArrowButton}
          onPress={handleBackToLogin}
          activeOpacity={0.8}
        >
          {/* Replace with: <Icon name="arrow-left" size={20} color="#1F2937" /> */}
          <Text style={styles.backArrow}>←</Text>
        </TouchableOpacity>

        {/* Logo */}
        <View style={styles.logoContainer}>
          <View style={styles.logoPlaceholder}>
            <View style={styles.logoInner}>
              {/* Replace with your logo or icon */}
              <Text style={styles.logoText}>◆</Text>
            </View>
          </View>
        </View>

        {/* Title */}
        <View style={styles.headerContainer}>
          <Text style={styles.title}>Forgot Password?</Text>
          <Text style={styles.subtitle}>
            Don't worry! Enter your email address and we'll send you a link to reset your password.
          </Text>
        </View>

        {/* Form Container */}
        <View style={styles.formContainer}>
          {/* Email Input */}
          <View style={styles.inputContainer}>
            <Text style={styles.label}>Email Address</Text>
            <View style={[
              styles.inputWrapper,
              emailFocused && styles.inputWrapperFocused
            ]}>
              <View style={styles.iconContainer}>
                {/* Replace with: <Icon name="mail" size={20} color={emailFocused ? "#6366F1" : "#9CA3AF"} /> */}
                <View style={[styles.iconPlaceholder, emailFocused && styles.iconPlaceholderFocused]}>
                  <Text style={styles.iconText}>@</Text>
                </View>
              </View>
              <TextInput
                style={styles.input}
                placeholder="you@example.com"
                placeholderTextColor="#999"
                value={email}
                onChangeText={setEmail}
                onFocus={() => setEmailFocused(true)}
                onBlur={() => setEmailFocused(false)}
                keyboardType="email-address"
                autoCapitalize="none"
                autoComplete="email"
              />
            </View>
          </View>

          {/* Reset Password Button */}
          <TouchableOpacity 
            style={styles.resetButton}
            onPress={handleResetPassword}
            activeOpacity={0.9}
          >
            <Text style={styles.resetButtonText}>Send Reset Link</Text>
            <View style={styles.buttonShine} />
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
            <TouchableOpacity onPress={handleBackToLogin} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
              <Text style={styles.loginLink}>Sign In</Text>
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
    backgroundColor: '#FAFAFA',
  },
  scrollContent: {
    flexGrow: 1,
    padding: 24,
    paddingTop: 60,
  },
  gradientCircle1: {
    position: 'absolute',
    width: 300,
    height: 300,
    borderRadius: 150,
    backgroundColor: 'rgba(99, 102, 241, 0.08)',
    top: -100,
    right: -100,
  },
  gradientCircle2: {
    position: 'absolute',
    width: 200,
    height: 200,
    borderRadius: 100,
    backgroundColor: 'rgba(236, 72, 153, 0.06)',
    bottom: 100,
    left: -50,
  },
  backArrowButton: {
    position: 'absolute',
    top: 20,
    left: 24,
    width: 44,
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 22,
    zIndex: 10,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  backArrow: {
    fontSize: 20,
    color: '#1F2937',
    fontWeight: '600',
  },
   logoContainer: {
    alignItems: 'center',
    marginTop: 0,
    marginBottom: 24,
  },
  logoPlaceholder: {
    width: 80,
    height: 80,
    backgroundColor: '#fff',
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#6366F1',
    shadowOffset: {
      width: 0,
      height: 8,
    },
    shadowOpacity: 0.2,
    shadowRadius: 16,
    elevation: 8,
  },
  logoInner: {
    width: 60,
    height: 60,
    backgroundColor: '#6366F1',
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  logoText: {
    fontSize: 32,
    color: '#fff',
  },
  headerContainer: {
    alignItems: 'center',
    marginBottom: 32,
  },
  title: {
    fontSize: 32,
    fontWeight: '800',
    color: '#1F2937',
    textAlign: 'center',
    marginBottom: 12,
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 15,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 24,
    paddingHorizontal: 20,
    letterSpacing: 0.2,
  },
  formContainer: {
    backgroundColor: '#fff',
    borderRadius: 24,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.05,
    shadowRadius: 20,
    elevation: 3,
  },
  inputContainer: {
    marginBottom: 24,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
    letterSpacing: 0.2,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 56,
    borderWidth: 1.5,
    borderColor: '#E5E7EB',
    borderRadius: 14,
    paddingHorizontal: 16,
    backgroundColor: '#F9FAFB',
  },
  inputWrapperFocused: {
    borderColor: '#6366F1',
    backgroundColor: '#fff',
    shadowColor: '#6366F1',
    shadowOffset: {
      width: 0,
      height: 0,
    },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 2,
  },
  iconContainer: {
    marginRight: 12,
  },
  iconPlaceholder: {
    width: 24,
    height: 24,
    borderRadius: 6,
    backgroundColor: '#E5E7EB',
    justifyContent: 'center',
    alignItems: 'center',
  },
  iconPlaceholderFocused: {
    backgroundColor: '#EEF2FF',
  },
  iconText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6B7280',
  },
  input: {
    flex: 1,
    fontSize: 16,
    color: '#1F2937',
    padding: 0,
  },
  resetButton: {
    height: 56,
    backgroundColor: '#6366F1',
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
    shadowColor: '#6366F1',
    shadowOffset: {
      width: 0,
      height: 8,
    },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 8,
    overflow: 'hidden',
  },
  buttonShine: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: '50%',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  resetButtonText: {
    fontSize: 17,
    fontWeight: '700',
    color: '#fff',
    letterSpacing: 0.5,
  },
  dividerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 24,
  },
  divider: {
    flex: 1,
    height: 1,
    backgroundColor: '#E5E7EB',
  },
  dividerText: {
    fontSize: 13,
    color: '#9CA3AF',
    marginHorizontal: 16,
    fontWeight: '500',
  },
  loginContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  loginText: {
    fontSize: 15,
    color: '#6B7280',
  },
  loginLink: {
    fontSize: 15,
    color: '#6366F1',
    fontWeight: '700',
  },
  // Success screen styles
  successIconContainer: {
    alignItems: 'center',
    marginTop: 80,
    marginBottom: 40,
  },
  successIconOuter: {
    width: 120,
    height: 120,
    backgroundColor: '#fff',
    borderRadius: 60,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#10B981',
    shadowOffset: {
      width: 0,
      height: 8,
    },
    shadowOpacity: 0.2,
    shadowRadius: 16,
    elevation: 8,
  },
  successIcon: {
    width: 100,
    height: 100,
    backgroundColor: '#10B981',
    borderRadius: 50,
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkmark: {
    fontSize: 56,
    color: '#fff',
    fontWeight: '700',
  },
  successMessage: {
    fontSize: 16,
    color: '#6B7280',
    textAlign: 'center',
    marginBottom: 8,
    letterSpacing: 0.2,
  },
  emailText: {
    fontSize: 17,
    fontWeight: '700',
    color: '#1F2937',
    textAlign: 'center',
    marginBottom: 16,
    letterSpacing: 0.2,
  },
  instructionText: {
    fontSize: 15,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 24,
    paddingHorizontal: 20,
    letterSpacing: 0.2,
  },
  buttonsContainer: {
    backgroundColor: '#fff',
    borderRadius: 24,
    padding: 24,
    marginTop: 32,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.05,
    shadowRadius: 20,
    elevation: 3,
  },
  resendButton: {
    height: 56,
    backgroundColor: '#fff',
    borderWidth: 2,
    borderColor: '#6366F1',
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  resendButtonText: {
    fontSize: 17,
    fontWeight: '700',
    color: '#6366F1',
    letterSpacing: 0.5,
  },
  backButton: {
    height: 56,
    backgroundColor: '#6366F1',
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#6366F1',
    shadowOffset: {
      width: 0,
      height: 8,
    },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 8,
    overflow: 'hidden',
  },
  backButtonText: {
    fontSize: 17,
    fontWeight: '700',
    color: '#fff',
    letterSpacing: 0.5,
  },
});