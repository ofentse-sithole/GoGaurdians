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
import { ref, set, serverTimestamp } from 'firebase/database';
import { auth, realtimeDB } from './firebaseConfig'; // Adjust path as needed

export default function BusinessRegister({ navigation }) {
  const [businessName, setBusinessName] = useState('');
  const [registrationNumber, setRegistrationNumber] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  
  const [businessNameFocused, setBusinessNameFocused] = useState(false);
  const [registrationNumberFocused, setRegistrationNumberFocused] = useState(false);
  const [emailFocused, setEmailFocused] = useState(false);
  const [passwordFocused, setPasswordFocused] = useState(false);
  const [confirmPasswordFocused, setConfirmPasswordFocused] = useState(false);

  const validateForm = () => {
    // Check if all fields are filled
    if (!businessName.trim() || !registrationNumber.trim() || !email.trim() || !password.trim() || !confirmPassword.trim()) {
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

    // Validate business name length
    if (businessName.trim().length < 2) {
      Alert.alert('Error', 'Business name must be at least 2 characters long');
      return false;
    }

    // Validate registration number format (basic validation)
    if (registrationNumber.trim().length < 5) {
      Alert.alert('Error', 'Please enter a valid registration number');
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

      // Update user profile with business name as display name
      await updateProfile(user, {
        displayName: businessName.trim(),
      });

      // Create business user document in Realtime Database
      const businessUserRef = ref(realtimeDB, `businessUsers/${user.uid}`);
      await set(businessUserRef, {
        uid: user.uid,
        email: email.toLowerCase(),
        businessName: businessName.trim(),
        registrationNumber: registrationNumber.trim(),
        accountType: 'business',
        status: 'active',
        createdAt: serverTimestamp(),
        lastLogin: serverTimestamp(),
        loginCount: 0,
        isEmailVerified: user.emailVerified,
        profileCompleted: true,
        // Business-specific data
        businessData: {
          industry: null,
          employeeCount: null,
          address: null,
          phoneNumber: null,
          website: null,
          taxNumber: null,
          bankDetails: null,
        },
        // Subscription and billing
        subscription: {
          plan: 'basic',
          status: 'trial',
          trialEndsAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(), // 30 days trial
          billingCycle: 'monthly',
          paymentMethod: null,
        },
        // Settings and preferences
        settings: {
          notifications: {
            email: true,
            push: true,
            marketing: false,
          },
          privacy: {
            dataSharing: false,
            analytics: true,
          },
          dashboard: {
            theme: 'light',
            currency: 'USD',
            timezone: 'UTC',
          },
        },
        // Permissions and roles
        permissions: {
          isOwner: true,
          canManageUsers: true,
          canManageBilling: true,
          canViewAnalytics: true,
        },
        // Business metrics (initialize empty)
        metrics: {
          totalUsers: 0,
          totalRevenue: 0,
          monthlyActiveUsers: 0,
          lastActivityAt: serverTimestamp(),
        },
      });

      // Also create a business profile entry for easier querying
      const businessProfileRef = ref(realtimeDB, `businesses/${user.uid}`);
      await set(businessProfileRef, {
        businessId: user.uid,
        businessName: businessName.trim(),
        registrationNumber: registrationNumber.trim(),
        email: email.toLowerCase(),
        status: 'active',
        createdAt: serverTimestamp(),
        ownerId: user.uid,
      });

      console.log('Business registration successful:', user.email, businessName);
      
      Alert.alert(
        'Registration Successful!', 
        `Welcome to Business Portal! Your business account for "${businessName}" has been created successfully. You can now access your business dashboard.`,
        [
          {
            text: 'Continue',
            onPress: () => {
              // Navigate to business dashboard or login
              navigation?.reset({
                index: 0,
                routes: [{ name: 'BusinessDashboard' }], // or BusinessLogin if you want them to login first
              });
            },
          },
        ]
      );
      
    } catch (error) {
      console.error('Business registration error:', error);
      
      let errorMessage = 'An error occurred during registration';
      
      switch (error.code) {
        case 'auth/email-already-in-use':
          errorMessage = 'A business account with this email already exists';
          break;
        case 'auth/invalid-email':
          errorMessage = 'Invalid email address';
          break;
        case 'auth/operation-not-allowed':
          errorMessage = 'Business account registration is not enabled';
          break;
        case 'auth/weak-password':
          errorMessage = 'Password is too weak. Please choose a stronger password';
          break;
        case 'auth/network-request-failed':
          errorMessage = 'Network error. Please check your connection';
          break;
        case 'permission-denied':
          errorMessage = 'Permission denied. Please contact support';
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
    navigation?.navigate('BusinessLogin');
  };

  const handleLogin = () => {
    navigation?.navigate('BusinessLogin');
  };

  const handlePersonalRegister = () => {
    navigation?.navigate('PersonalRegister');
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

        {/* Back Button */}
        <TouchableOpacity 
          style={styles.backArrowButton}
          onPress={handleBackToLogin}
          activeOpacity={0.7}
          disabled={loading}
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
                editable={!loading}
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
                editable={!loading}
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
              <TextInput
                style={styles.input}
                placeholder="Create a password (min 6 chars)"
                placeholderTextColor="#9CA3AF"
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
            activeOpacity={0.8}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#fff" size="small" />
            ) : (
              <Text style={styles.registerButtonText}>Create Account</Text>
            )}
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
              disabled={loading}
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
    paddingTop: 40,
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
  registerButtonDisabled: {
    backgroundColor: '#94A3B8',
    shadowOpacity: 0.1,
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
  backArrow: {
    fontSize: 24,
    color: '#1E40AF',
    fontWeight: 'bold',
  },
});