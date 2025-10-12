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
// Import your icon library here, for example:
// import Icon from 'react-native-vector-icons/Feather';

export default function PersonalRegister({ navigation }) {
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [idNumber, setIdNumber] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  
  const [firstNameFocused, setFirstNameFocused] = useState(false);
  const [lastNameFocused, setLastNameFocused] = useState(false);
  const [idNumberFocused, setIdNumberFocused] = useState(false);
  const [emailFocused, setEmailFocused] = useState(false);
  const [passwordFocused, setPasswordFocused] = useState(false);
  const [confirmPasswordFocused, setConfirmPasswordFocused] = useState(false);

  const handleRegister = () => {
    // Validate passwords match
    if (password !== confirmPassword) {
      alert('Passwords do not match');
      return;
    }
    
    console.log('Register pressed', { firstName, lastName, idNumber, email, password });
    // Add your registration logic here
  };

  const handleLogin = () => {
    navigation?.navigate('PersonalLogin');
  };

  const handleBusinessRegister = () => {
    navigation?.navigate('BusinessRegister');
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
        {/* Background Gradient Elements */}
        <View style={styles.gradientCircle1} />
        <View style={styles.gradientCircle2} />

        {/* Business Register Button - Top Right */}
        <TouchableOpacity 
          style={styles.businessRegisterButton}
          onPress={handleBusinessRegister}
          activeOpacity={0.8}
        >
          <Text style={styles.businessRegisterText}>For Business</Text>
          {/* Replace with: <Icon name="arrow-right" size={16} color="#fff" /> */}
          <Text style={styles.arrow}>→</Text>
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
          <Text style={styles.title}>Create Account</Text>
          <Text style={styles.subtitle}>Sign up to get started with us</Text>
        </View>

        {/* Form Container */}
        <View style={styles.formContainer}>
          {/* First Name Input */}
          <View style={styles.inputContainer}>
            <Text style={styles.label}>First Name</Text>
            <View style={[
              styles.inputWrapper,
              firstNameFocused && styles.inputWrapperFocused
            ]}>
              <View style={styles.iconContainer}>
                {/* Replace with: <Icon name="user" size={20} color={firstNameFocused ? "#6366F1" : "#9CA3AF"} /> */}
                <View style={[styles.iconPlaceholder, firstNameFocused && styles.iconPlaceholderFocused]}>
                  <Text style={styles.iconText}>F</Text>
                </View>
              </View>
              <TextInput
                style={styles.input}
                placeholder="Enter your first name"
                placeholderTextColor="#999"
                value={firstName}
                onChangeText={setFirstName}
                onFocus={() => setFirstNameFocused(true)}
                onBlur={() => setFirstNameFocused(false)}
                autoCapitalize="words"
              />
            </View>
          </View>

          {/* Last Name Input */}
          <View style={styles.inputContainer}>
            <Text style={styles.label}>Last Name</Text>
            <View style={[
              styles.inputWrapper,
              lastNameFocused && styles.inputWrapperFocused
            ]}>
              <View style={styles.iconContainer}>
                {/* Replace with: <Icon name="user" size={20} color={lastNameFocused ? "#6366F1" : "#9CA3AF"} /> */}
                <View style={[styles.iconPlaceholder, lastNameFocused && styles.iconPlaceholderFocused]}>
                  <Text style={styles.iconText}>L</Text>
                </View>
              </View>
              <TextInput
                style={styles.input}
                placeholder="Enter your last name"
                placeholderTextColor="#999"
                value={lastName}
                onChangeText={setLastName}
                onFocus={() => setLastNameFocused(true)}
                onBlur={() => setLastNameFocused(false)}
                autoCapitalize="words"
              />
            </View>
          </View>

          {/* ID Number Input */}
          <View style={styles.inputContainer}>
            <Text style={styles.label}>ID Number</Text>
            <View style={[
              styles.inputWrapper,
              idNumberFocused && styles.inputWrapperFocused
            ]}>
              <View style={styles.iconContainer}>
                {/* Replace with: <Icon name="credit-card" size={20} color={idNumberFocused ? "#6366F1" : "#9CA3AF"} /> */}
                <View style={[styles.iconPlaceholder, idNumberFocused && styles.iconPlaceholderFocused]}>
                  <Text style={styles.iconText}>ID</Text>
                </View>
              </View>
              <TextInput
                style={styles.input}
                placeholder="Enter your ID number"
                placeholderTextColor="#999"
                value={idNumber}
                onChangeText={setIdNumber}
                onFocus={() => setIdNumberFocused(true)}
                onBlur={() => setIdNumberFocused(false)}
                keyboardType="numeric"
              />
            </View>
          </View>

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

          {/* Password Input */}
          <View style={styles.inputContainer}>
            <Text style={styles.label}>Password</Text>
            <View style={[
              styles.inputWrapper,
              passwordFocused && styles.inputWrapperFocused
            ]}>
              <View style={styles.iconContainer}>
                {/* Replace with: <Icon name="lock" size={20} color={passwordFocused ? "#6366F1" : "#9CA3AF"} /> */}
                <View style={[styles.iconPlaceholder, passwordFocused && styles.iconPlaceholderFocused]}>
                  <Text style={styles.iconText}>P</Text>
                </View>
              </View>
              <TextInput
                style={styles.input}
                placeholder="Create a strong password"
                placeholderTextColor="#999"
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
              <View style={styles.iconContainer}>
                {/* Replace with: <Icon name="shield" size={20} color={confirmPasswordFocused ? "#6366F1" : "#9CA3AF"} /> */}
                <View style={[styles.iconPlaceholder, confirmPasswordFocused && styles.iconPlaceholderFocused]}>
                  <Text style={styles.iconText}>C</Text>
                </View>
              </View>
              <TextInput
                style={styles.input}
                placeholder="Re-enter your password"
                placeholderTextColor="#999"
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
            activeOpacity={0.9}
          >
            <Text style={styles.registerButtonText}>Create Account</Text>
            <View style={styles.buttonShine} />
          </TouchableOpacity>

          {/* Divider */}
          <View style={styles.dividerContainer}>
            <View style={styles.divider} />
            <Text style={styles.dividerText}>or</Text>
            <View style={styles.divider} />
          </View>

          {/* Login Link */}
          <View style={styles.loginContainer}>
            <Text style={styles.loginText}>Already have an account? </Text>
            <TouchableOpacity onPress={handleLogin} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
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
    paddingBottom: 40,
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
  businessRegisterButton: {
    position: 'absolute',
    top: 20,
    right: 24,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1F2937',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 24,
    zIndex: 10,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 5,
  },
  businessRegisterText: {
    fontSize: 13,
    color: '#fff',
    fontWeight: '600',
    marginRight: 6,
    letterSpacing: 0.3,
  },
  arrow: {
    fontSize: 16,
    color: '#fff',
  },
  logoContainer: {
    alignItems: 'center',
    marginTop: 40,
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
    marginBottom: 8,
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 15,
    color: '#6B7280',
    textAlign: 'center',
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
    marginBottom: 18,
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
    fontSize: 12,
    fontWeight: '600',
    color: '#6B7280',
  },
  input: {
    flex: 1,
    fontSize: 16,
    color: '#1F2937',
    padding: 0,
  },
  termsText: {
    fontSize: 12,
    color: '#6B7280',
    textAlign: 'center',
    marginTop: 8,
    marginBottom: 24,
    lineHeight: 18,
  },
  termsLink: {
    color: '#6366F1',
    fontWeight: '600',
  },
  registerButton: {
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
  registerButtonText: {
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
});