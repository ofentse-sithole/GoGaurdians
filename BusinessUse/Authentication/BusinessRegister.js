import React, { useState } from 'react';
import { 
  View, 
  Text, 
  TextInput, 
  TouchableOpacity, 
  StyleSheet, 
  ScrollView, 
  KeyboardAvoidingView, 
  Platform 
} from 'react-native';

export default function BusinessRegister({ navigation }) {
  const [businessName, setBusinessName] = useState('');
  const [registrationNumber, setRegistrationNumber] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [businessNameFocused, setBusinessNameFocused] = useState(false);
  const [registrationNumberFocused, setRegistrationNumberFocused] = useState(false);
  const [emailFocused, setEmailFocused] = useState(false);
  const [passwordFocused, setPasswordFocused] = useState(false);
  const [confirmPasswordFocused, setConfirmPasswordFocused] = useState(false);

  const handleRegister = () => {
    if (password !== confirmPassword) {
      alert('Passwords do not match');
      return;
    }
    
    console.log('Business register pressed', { 
      businessName, 
      registrationNumber, 
      email, 
      password 
    });
  };

  const handleBackToLogin = () => {
    navigation.navigate('BusinessLogin');
  };

  const handleLogin = () => {
    navigation.navigate('BusinessLogin');
  };

  const handlePersonalRegister = () => {
    navigation.navigate('PersonalRegister');
  };

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
        {/* Back Button */}
                <TouchableOpacity 
                  style={styles.backArrowButton}
                  onPress={handleBackToLogin}
                  activeOpacity={0.7}
                >
                  <Text style={styles.backArrow}>←</Text>
                </TouchableOpacity>

        {/* Logo Section */}
        <View style={styles.logoContainer}>
          <View style={styles.logoPlaceholder}>
            <Text style={styles.logoText}>B</Text>
          </View>
          <Text style={styles.companyName}>Business Portal</Text>
        </View>

        {/* Title Section */}
        <View style={styles.titleSection}>
          <Text style={styles.title}>Create Business Account</Text>
          <Text style={styles.subtitle}>Register your business today</Text>
        </View>

        {/* Registration Form */}
        <View style={styles.formContainer}>
          {/* Business Name Input */}
          <View style={styles.inputContainer}>
            <Text style={styles.label}>Business Name</Text>
            <View style={[
              styles.inputWrapper,
              businessNameFocused && styles.inputWrapperFocused
            ]}>
              <TextInput
                style={styles.input}
                placeholder="Enter your business name"
                placeholderTextColor="#9CA3AF"
                value={businessName}
                onChangeText={setBusinessName}
                onFocus={() => setBusinessNameFocused(true)}
                onBlur={() => setBusinessNameFocused(false)}
                autoCapitalize="words"
              />
            </View>
          </View>

          {/* Registration Number Input */}
          <View style={styles.inputContainer}>
            <Text style={styles.label}>Registration Number</Text>
            <View style={[
              styles.inputWrapper,
              registrationNumberFocused && styles.inputWrapperFocused
            ]}>
              <TextInput
                style={styles.input}
                placeholder="Enter business registration number"
                placeholderTextColor="#9CA3AF"
                value={registrationNumber}
                onChangeText={setRegistrationNumber}
                onFocus={() => setRegistrationNumberFocused(true)}
                onBlur={() => setRegistrationNumberFocused(false)}
              />
            </View>
          </View>

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
              />
            </View>
          </View>

          {/* Password Input */}
          <View style={styles.inputContainer}>
            <Text style={styles.label}>Password</Text>
            <View style={[
              styles.inputWrapper,
              passwordFocused && styles.inputWrapperFocused
            ]}>
              <TextInput
                style={styles.input}
                placeholder="Create a password"
                placeholderTextColor="#9CA3AF"
                value={password}
                onChangeText={setPassword}
                onFocus={() => setPasswordFocused(true)}
                onBlur={() => setPasswordFocused(false)}
                secureTextEntry
                autoCapitalize="none"
              />
            </View>
          </View>

          {/* Confirm Password Input */}
          <View style={styles.inputContainer}>
            <Text style={styles.label}>Confirm Password</Text>
            <View style={[
              styles.inputWrapper,
              confirmPasswordFocused && styles.inputWrapperFocused
            ]}>
              <TextInput
                style={styles.input}
                placeholder="Confirm your password"
                placeholderTextColor="#9CA3AF"
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                onFocus={() => setConfirmPasswordFocused(true)}
                onBlur={() => setConfirmPasswordFocused(false)}
                secureTextEntry
                autoCapitalize="none"
              />
            </View>
          </View>

          {/* Terms and Conditions */}
          <Text style={styles.termsText}>
            By signing up, you agree to our{' '}
            <Text style={styles.termsLink}>Terms of Service</Text>
            {' '}and{' '}
            <Text style={styles.termsLink}>Privacy Policy</Text>
          </Text>

          {/* Register Button */}
          <TouchableOpacity 
            style={styles.registerButton}
            onPress={handleRegister}
            activeOpacity={0.8}
          >
            <Text style={styles.registerButtonText}>Create Account</Text>
          </TouchableOpacity>

          {/* Divider */}
          <View style={styles.dividerContainer}>
            <View style={styles.divider} />
            <Text style={styles.dividerText}>or</Text>
            <View style={styles.divider} />
          </View>

          {/* Login Section */}
          <View style={styles.loginContainer}>
            <Text style={styles.loginText}>Already have a business account?</Text>
            <TouchableOpacity 
              onPress={handleLogin}
              activeOpacity={0.7}
            >
              <Text style={styles.loginLink}>Sign In</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Footer */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>
            Secure business registration • Protected by encryption
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
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 24,
    paddingBottom: 32,
  },
  personalRegisterButton: {
    position: 'absolute',
    top: 50,
    left: 24,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    zIndex: 10,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  personalRegisterText: {
    fontSize: 13,
    color: '#FFFFFF',
    fontWeight: '600',
    marginLeft: 4,
  },
  arrow: {
    fontSize: 18,
    color: '#313f5fff',
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
    color: '#FFFFFF',
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
    marginBottom: 8,
    letterSpacing: -0.5,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: '#64748B',
    fontWeight: '400',
    textAlign: 'center',
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
    marginBottom: 20,
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
  termsText: {
    fontSize: 12,
    color: '#64748B',
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 18,
  },
  termsLink: {
    color: '#1E40AF',
    fontWeight: '600',
  },
  registerButton: {
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
  registerButtonText: {
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
  },
  loginText: {
    fontSize: 14,
    color: '#64748B',
    marginBottom: 8,
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
  backArrowButton: {
    position: 'absolute',
    top: 50,
    left: 24,
    width: 44,
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(79, 83, 108, 0.2)',
    borderRadius: 22,
    zIndex: 10,
    borderWidth: 1,
    borderColor: 'rgba(13, 13, 77, 0.3)',
  },
});