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

export default function PersonalRegister({ navigation }) {
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [idNumber, setIdNumber] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  
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
        // Add any additional fields you need
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
              // Navigate back to login screen
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
        {/* Background Gradient Elements */}
        <View style={styles.gradientCircle1} />
        <View style={styles.gradientCircle2} />

        {/* Back Button */}
        <TouchableOpacity 
          style={styles.backArrowButton}
          onPress={handleBackToLogin}
          activeOpacity={0.7}
          disabled={loading}
        >
          <Text style={styles.backArrow}>←</Text>
        </TouchableOpacity>

        {/* Logo */}
        <View style={styles.logoContainer}>
          <View style={styles.logoPlaceholder}>
            <View style={styles.logoInner}>
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
                editable={!loading}
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
                editable={!loading}
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
                <View style={[styles.iconPlaceholder, idNumberFocused && styles.iconPlaceholderFocused]}>
                  <Text style={styles.iconText}>ID</Text>
                </View>
              </View>
              <TextInput
                style={styles.input}
                placeholder="Enter your 13-digit ID number"
                placeholderTextColor="#999"
                value={idNumber}
                onChangeText={setIdNumber}
                onFocus={() => setIdNumberFocused(true)}
                onBlur={() => setIdNumberFocused(false)}
                keyboardType="numeric"
                maxLength={13}
                editable={!loading}
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
                editable={!loading}
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
                <View style={[styles.iconPlaceholder, passwordFocused && styles.iconPlaceholderFocused]}>
                  <Text style={styles.iconText}>P</Text>
                </View>
              </View>
              <TextInput
                style={styles.input}
                placeholder="Create a strong password (min 6 chars)"
                placeholderTextColor="#999"
                value={password}
                onChangeText={setPassword}
                onFocus={() => setPasswordFocused(true)}
                onBlur={() => setPasswordFocused(false)}
                secureTextEntry
                autoCapitalize="none"
                editable={!loading}
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
                editable={!loading}
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
            style={[styles.registerButton, loading && styles.registerButtonDisabled]}
            onPress={handleRegister}
            activeOpacity={0.9}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#fff" size="small" />
            ) : (
              <>
                <Text style={styles.registerButtonText}>Create Account</Text>
                <View style={styles.buttonShine} />
              </>
            )}
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
            <TouchableOpacity 
              onPress={handleLogin} 
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              disabled={loading}
            >
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
    paddingTop: 40,
  },
  scrollContent: {
    flexGrow: 1,
    padding: 24,
    paddingTop: -20,
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
  registerButtonDisabled: {
    backgroundColor: '#9CA3AF',
    shadowOpacity: 0.1,
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
  backArrowButton: {
    position: 'absolute',
    top: 50,
    left: 24,
    width: 44,
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(79, 80, 108, 0.2)',
    borderRadius: 22,
    zIndex: 10,
    borderWidth: 1,
    borderColor: 'rgba(13, 13, 77, 0.3)',
  },
  backArrow: {
    fontSize: 24,
    color: '#1F2937',
    fontWeight: 'bold',
  },
});