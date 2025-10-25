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
import { createUserWithEmailAndPassword, updateProfile } from 'firebase/auth';
import { doc, setDoc } from 'firebase/firestore';
import { auth, firestore } from '../../firebaseConfig';
import Icon from 'react-native-vector-icons/Ionicons'; // Using Ionicons for professional icons

export default function PersonalRegister({ navigation }) {
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [idNumber, setIdNumber] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  
  const [firstNameFocused, setFirstNameFocused] = useState(false);
  const [lastNameFocused, setLastNameFocused] = useState(false);
  const [idNumberFocused, setIdNumberFocused] = useState(false);
  const [emailFocused, setEmailFocused] = useState(false);
  const [passwordFocused, setPasswordFocused] = useState(false);
  const [confirmPasswordFocused, setConfirmPasswordFocused] = useState(false);

  const validateForm = () => {
    // Check if all fields are filled
    if (!firstName.trim() || !lastName.trim() || !idNumber.trim() || !email.trim() || !password.trim() || !confirmPassword.trim()) {
      Alert.alert('Error', 'Please fill in all fields');
      return false;
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      Alert.alert('Error', 'Please enter a valid email address');
      return false;
    }

    // Validate password length
    if (password.length < 6) {
      Alert.alert('Error', 'Password must be at least 6 characters long');
      return false;
    }

    // Check if passwords match
    if (password !== confirmPassword) {
      Alert.alert('Error', 'Passwords do not match');
      return false;
    }

    // Validate ID number (South African ID number is 13 digits)
    if (idNumber.length !== 13 || !/^\d+$/.test(idNumber)) {
      Alert.alert('Error', 'Please enter a valid 13-digit ID number');
      return false;
    }

    return true;
  };

  const handleRegister = async () => {
    if (!validateForm()) {
      return;
    }

    setLoading(true);
    
    try {
      // Create user with Firebase Auth
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      // Update user profile with display name
      await updateProfile(user, {
        displayName: `${firstName} ${lastName}`,
      });

      // Create user document in Firestore
      const userDocRef = doc(firestore, 'users', user.uid);
      await setDoc(userDocRef, {
        uid: user.uid,
        email: email.toLowerCase(),
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        idNumber: idNumber.trim(),
        displayName: `${firstName.trim()} ${lastName.trim()}`,
        accountType: 'personal',
        createdAt: new Date().toISOString(),
        lastLogin: new Date().toISOString(),
        isEmailVerified: user.emailVerified,
        profileCompleted: true,
        profileData: {
          avatar: null,
          dateOfBirth: null,
          phoneNumber: null,
          address: null,
          emergencyContact: null,
        },
        preferences: {
          notifications: true,
          emailUpdates: true,
          theme: 'light',
        },
      });

      console.log('Registration successful:', user.email);
      
      Alert.alert(
        'Registration Successful!', 
        'Your account has been created successfully. You can now log in.',
        [
          {
            text: 'OK',
            onPress: () => {
              navigation?.navigate('PersonalLogin');
            },
          },
        ]
      );
      
    } catch (error) {
      console.error('Registration error:', error);
      
      let errorMessage = 'An error occurred during registration';
      
      switch (error.code) {
        case 'auth/email-already-in-use':
          errorMessage = 'An account with this email already exists';
          break;
        case 'auth/invalid-email':
          errorMessage = 'Invalid email address';
          break;
        case 'auth/operation-not-allowed':
          errorMessage = 'Email/password accounts are not enabled';
          break;
        case 'auth/weak-password':
          errorMessage = 'Password is too weak. Please choose a stronger password';
          break;
        case 'auth/network-request-failed':
          errorMessage = 'Network error. Please check your connection';
          break;
        default:
          errorMessage = error.message || 'Registration failed. Please try again';
      }
      
      Alert.alert('Registration Failed', errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleBackToLogin = () => {
    navigation?.navigate('PersonalLogin');
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
                <Icon name="person-add-outline" size={28} color="#ffffff" />
              </View>
              <View style={styles.logoRing} />
            </View>
          </View>

          {/* Title Section */}
          <View style={styles.titleContainer}>
            <Text style={styles.mainTitle}>Create Account</Text>
            <Text style={styles.mainSubtitle}>
              Join us today and start your journey with a secure personal account
            </Text>
          </View>
        </View>

        {/* Form Card */}
        <View style={styles.formCard}>
          <View style={styles.formHeader}>
            <Text style={styles.formTitle}>Personal Registration</Text>
            <Text style={styles.formSubtitle}>Please fill in your details to create your account</Text>
          </View>

          {/* Name Fields Row */}
          <View style={styles.nameRow}>
            {/* First Name Input */}
            <View style={[styles.inputGroup, styles.nameInput]}>
              <Text style={styles.inputLabel}>First Name</Text>
              <View style={[
                styles.inputContainer,
                firstNameFocused && styles.inputContainerFocused
              ]}>
                <View style={styles.inputIconContainer}>
                  <Icon 
                    name="person-outline" 
                    size={20} 
                    color={firstNameFocused ? '#2563EB' : '#6B7280'} 
                  />
                </View>
                <TextInput
                  style={styles.textInput}
                  placeholder="First name"
                  placeholderTextColor="#9CA3AF"
                  value={firstName}
                  onChangeText={setFirstName}
                  onFocus={() => setFirstNameFocused(true)}
                  onBlur={() => setFirstNameFocused(false)}
                  autoCapitalize="words"
                  editable={!loading}
                />
              </View>
            </View>

            {/* Last Name Input */}
            <View style={[styles.inputGroup, styles.nameInput]}>
              <Text style={styles.inputLabel}>Last Name</Text>
              <View style={[
                styles.inputContainer,
                lastNameFocused && styles.inputContainerFocused
              ]}>
                <View style={styles.inputIconContainer}>
                  <Icon 
                    name="person-outline" 
                    size={20} 
                    color={lastNameFocused ? '#2563EB' : '#6B7280'} 
                  />
                </View>
                <TextInput
                  style={styles.textInput}
                  placeholder="Last name"
                  placeholderTextColor="#9CA3AF"
                  value={lastName}
                  onChangeText={setLastName}
                  onFocus={() => setLastNameFocused(true)}
                  onBlur={() => setLastNameFocused(false)}
                  autoCapitalize="words"
                  editable={!loading}
                />
              </View>
            </View>
          </View>

          {/* ID Number Input */}
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>ID Number</Text>
            <View style={[
              styles.inputContainer,
              idNumberFocused && styles.inputContainerFocused
            ]}>
              <View style={styles.inputIconContainer}>
                <Icon 
                  name="card-outline" 
                  size={20} 
                  color={idNumberFocused ? '#2563EB' : '#6B7280'} 
                />
              </View>
              <TextInput
                style={styles.textInput}
                placeholder="Enter your 13-digit ID number"
                placeholderTextColor="#9CA3AF"
                value={idNumber}
                onChangeText={setIdNumber}
                onFocus={() => setIdNumberFocused(true)}
                onBlur={() => setIdNumberFocused(false)}
                keyboardType="numeric"
                maxLength={13}
                editable={!loading}
              />
              {idNumber.length === 13 && (
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
            </View>
          </View>

          {/* Password Input */}
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Password</Text>
            <View style={[
              styles.inputContainer,
              passwordFocused && styles.inputContainerFocused
            ]}>
              <View style={styles.inputIconContainer}>
                <Icon 
                  name="lock-closed-outline" 
                  size={20} 
                  color={passwordFocused ? '#2563EB' : '#6B7280'} 
                />
              </View>
              <TextInput
                style={styles.textInput}
                placeholder="Create a secure password"
                placeholderTextColor="#9CA3AF"
                value={password}
                onChangeText={setPassword}
                onFocus={() => setPasswordFocused(true)}
                onBlur={() => setPasswordFocused(false)}
                secureTextEntry={!showPassword}
                autoCapitalize="none"
                editable={!loading}
              />
              <TouchableOpacity
                onPress={() => setShowPassword(!showPassword)}
                style={styles.passwordToggle}
                disabled={loading}
              >
                <Icon 
                  name={showPassword ? "eye-off-outline" : "eye-outline"} 
                  size={20} 
                  color="#6B7280" 
                />
              </TouchableOpacity>
            </View>
            <View style={styles.passwordStrength}>
              <Text style={styles.passwordHint}>
                Minimum 6 characters required
              </Text>
            </View>
          </View>

          {/* Confirm Password Input */}
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Confirm Password</Text>
            <View style={[
              styles.inputContainer,
              confirmPasswordFocused && styles.inputContainerFocused
            ]}>
              <View style={styles.inputIconContainer}>
                <Icon 
                  name="lock-closed-outline" 
                  size={20} 
                  color={confirmPasswordFocused ? '#2563EB' : '#6B7280'} 
                />
              </View>
              <TextInput
                style={styles.textInput}
                placeholder="Confirm your password"
                placeholderTextColor="#9CA3AF"
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                onFocus={() => setConfirmPasswordFocused(true)}
                onBlur={() => setConfirmPasswordFocused(false)}
                secureTextEntry={!showConfirmPassword}
                autoCapitalize="none"
                editable={!loading}
              />
              <TouchableOpacity
                onPress={() => setShowConfirmPassword(!showConfirmPassword)}
                style={styles.passwordToggle}
                disabled={loading}
              >
                <Icon 
                  name={showConfirmPassword ? "eye-off-outline" : "eye-outline"} 
                  size={20} 
                  color="#6B7280" 
                />
              </TouchableOpacity>
            </View>
          </View>

          {/* Terms and Conditions */}
          <View style={styles.termsSection}>
            <Text style={styles.termsText}>
              By creating an account, you agree to our{' '}
              <Text style={styles.termsLink}>Terms of Service</Text>
              {' '}and{' '}
              <Text style={styles.termsLink}>Privacy Policy</Text>
            </Text>
          </View>

          {/* Create Account Button */}
          <TouchableOpacity 
            style={[styles.registerButton, loading && styles.registerButtonDisabled]}
            onPress={handleRegister}
            activeOpacity={0.9}
            disabled={loading}
          >
            <View style={styles.buttonContent}>
              {loading ? (
                <ActivityIndicator color="#ffffff" size="small" />
              ) : (
                <>
                  <Text style={styles.registerButtonText}>Create Account</Text>
                  <Icon name="arrow-forward-outline" size={20} color="#ffffff" />
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

          {/* Sign In Section */}
          <View style={styles.loginSection}>
            <Text style={styles.loginText}>Already have an account? </Text>
            <TouchableOpacity 
              onPress={handleLogin}
              style={styles.loginLinkButton}
              disabled={loading}
            >
              <Text style={styles.loginLink}>Sign In</Text>
              <Icon name="log-in-outline" size={16} color="#2563EB" />
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
    marginBottom: 32,
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
  businessRegisterButton: {
    position: 'absolute',
    top: 0,
    right: 0,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1F2937',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 24,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 5,
    zIndex: 20,
  },
  businessRegisterText: {
    fontSize: 14,
    color: '#ffffff',
    fontWeight: '600',
    marginLeft: 8,
    letterSpacing: 0.2,
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
  nameRow: {
    flexDirection: 'row',
    gap: 16,
    marginBottom: 24,
  },
  nameInput: {
    flex: 1,
    marginBottom: 0,
  },
  inputGroup: {
    marginBottom: 24,
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
  passwordToggle: {
    padding: 8,
    marginLeft: 8,
  },
  inputIndicator: {
    marginLeft: 8,
  },
  passwordStrength: {
    marginTop: 8,
  },
  passwordHint: {
    fontSize: 12,
    color: '#6B7280',
    fontStyle: 'italic',
  },

  // Terms Section
  termsSection: {
    marginBottom: 32,
  },
  termsText: {
    fontSize: 13,
    color: '#64748B',
    textAlign: 'center',
    lineHeight: 20,
    letterSpacing: 0.1,
  },
  termsLink: {
    color: '#2563EB',
    fontWeight: '600',
  },

  // Button Styles
  registerButton: {
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
  registerButtonDisabled: {
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
  registerButtonText: {
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
});