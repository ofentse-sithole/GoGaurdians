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
  Animated,
  Alert,
  ActivityIndicator
} from 'react-native';
import { PanGestureHandler } from 'react-native-gesture-handler';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { auth, firestore } from '../../firebaseConfig';
import Icon from 'react-native-vector-icons/Ionicons'; // Using Ionicons for professional icons

export default function PersonalLogin({ navigation }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [emailFocused, setEmailFocused] = useState(false);
  const [passwordFocused, setPasswordFocused] = useState(false);
  const [sliderPosition] = useState(new Animated.Value(0));
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleLogin = async () => {
    if (!email.trim() || !password.trim()) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }

    setLoading(true);
    
    try {
      // Sign in with Firebase Auth
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;
      
      // Check if user document exists in Firestore
      const userDocRef = doc(firestore, 'users', user.uid);
      const userDoc = await getDoc(userDocRef);
      
      if (!userDoc.exists()) {
        // Create user document if it doesn't exist
        await setDoc(userDocRef, {
          email: user.email,
          uid: user.uid,
          accountType: 'personal',
          createdAt: new Date().toISOString(),
          lastLogin: new Date().toISOString(),
        });
      } else {
        // Update last login time
        await setDoc(userDocRef, {
          ...userDoc.data(),
          lastLogin: new Date().toISOString(),
        }, { merge: true });
      }

      console.log('Login successful:', user.email);
      
      // Navigate to your main app screen
      navigation?.reset({
        index: 0,
        routes: [{ name: 'MainApp' }],
      });
      
    } catch (error) {
      console.error('Login error:', error);
      
      let errorMessage = 'An error occurred during login';
      
      switch (error.code) {
        case 'auth/user-not-found':
          errorMessage = 'No account found with this email address';
          break;
        case 'auth/wrong-password':
          errorMessage = 'Incorrect password';
          break;
        case 'auth/invalid-email':
          errorMessage = 'Invalid email address';
          break;
        case 'auth/user-disabled':
          errorMessage = 'This account has been disabled';
          break;
        case 'auth/too-many-requests':
          errorMessage = 'Too many failed login attempts. Please try again later';
          break;
        case 'auth/network-request-failed':
          errorMessage = 'Network error. Please check your connection';
          break;
        default:
          errorMessage = error.message || 'Login failed. Please try again';
      }
      
      Alert.alert('Login Failed', errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = () => {
    navigation?.navigate('PersonalForgotPassword');
  };

  const handleSignUp = () => {
    navigation?.navigate('PersonalRegister');
  };

  const handleBusinessLogin = () => {
    navigation?.navigate('BusinessLogin');
  };

  const onSliderGestureEvent = Animated.event(
    [{ nativeEvent: { translationX: sliderPosition } }],
    { useNativeDriver: false }
  );

  const onSliderHandlerStateChange = (event) => {
    if (event.nativeEvent.state === 5) { // GESTURE_STATE_END
      const { translationX } = event.nativeEvent;
      
      if (translationX > 150) { // Threshold for successful swipe
        // Complete the slide animation
        Animated.timing(sliderPosition, {
          toValue: 280, // Full width minus button width
          duration: 200,
          useNativeDriver: false,
        }).start(() => {
          handleBusinessLogin();
        });
      } else {
        // Reset to original position
        Animated.timing(sliderPosition, {
          toValue: 0,
          duration: 200,
          useNativeDriver: false,
        }).start();
      }
    }
  };

  const handleSliderPress = () => {
    Animated.timing(sliderPosition, {
      toValue: 280,
      duration: 300,
      useNativeDriver: false,
    }).start(() => {
      handleBusinessLogin();
    });
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
          {/* Professional Logo */}
          <View style={styles.logoContainer}>
            <View style={styles.logoWrapper}>
              <View style={styles.logoCore}>
                <Icon name="shield-checkmark-outline" size={28} color="#ffffff" />
              </View>
              <View style={styles.logoRing} />
            </View>
          </View>

          {/* Professional Title */}
          <View style={styles.titleContainer}>
            <Text style={styles.welcomeTitle}>Welcome Back</Text>
            <Text style={styles.welcomeSubtitle}>
              Access your personal dashboard securely
            </Text>
          </View>
        </View>

        {/* Main Form Card */}
        <View style={styles.formCard}>
          <View style={styles.formHeader}>
            <Text style={styles.formTitle}>Sign In</Text>
            <Text style={styles.formSubtitle}>Enter your credentials to continue</Text>
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
            <View style={styles.labelRow}>
              <Text style={styles.inputLabel}>Password</Text>
              <TouchableOpacity 
                onPress={handleForgotPassword}
                style={styles.forgotButton}
                disabled={loading}
              >
                <Text style={styles.forgotText}>Forgot Password?</Text>
              </TouchableOpacity>
            </View>
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
                placeholder="Enter your password"
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
          </View>

          {/* Sign In Button */}
          <TouchableOpacity 
            style={[styles.signInButton, loading && styles.signInButtonDisabled]}
            onPress={handleLogin}
            activeOpacity={0.9}
            disabled={loading}
          >
            <View style={styles.buttonContent}>
              {loading ? (
                <ActivityIndicator color="#ffffff" size="small" />
              ) : (
                <>
                  <Text style={styles.signInButtonText}>Sign In</Text>
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

          {/* Sign Up Section */}
          <View style={styles.signUpSection}>
            <Text style={styles.signUpText}>New to our platform? </Text>
            <TouchableOpacity 
              onPress={handleSignUp}
              style={styles.signUpButton}
              disabled={loading}
            >
              <Text style={styles.signUpLink}>Create Account</Text>
              <Icon name="open-outline" size={16} color="#2563EB" />
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>

      {/* Professional Business Login Slider */}
      <View style={styles.businessSliderContainer}>
        <View style={styles.sliderWrapper}>
          <View style={styles.sliderTrack}>
            <View style={styles.sliderContent}>
              <Icon name="briefcase-outline" size={20} color="#6B7280" />
              <Text style={styles.sliderText}>Slide for Business Access</Text>
              <View style={styles.sliderArrows}>
                <Icon name="chevron-forward-outline" size={20} color="#9CA3AF" />
              </View>
            </View>
            
            <PanGestureHandler
              onGestureEvent={onSliderGestureEvent}
              onHandlerStateChange={onSliderHandlerStateChange}
              enabled={!loading}
            >
              <Animated.View
                style={[
                  styles.sliderButton,
                  {
                    transform: [
                      {
                        translateX: sliderPosition.interpolate({
                          inputRange: [0, 280],
                          outputRange: [0, 280],
                          extrapolate: 'clamp',
                        }),
                      },
                    ],
                  },
                ]}
              >
                <TouchableOpacity
                  style={styles.sliderButtonInner}
                  onPress={handleSliderPress}
                  activeOpacity={0.8}
                  disabled={loading}
                >
                  <Icon name="arrow-forward-outline" size={24} color="#ffffff" />
                </TouchableOpacity>
              </Animated.View>
            </PanGestureHandler>
          </View>
        </View>
      </View>
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
    paddingBottom: 140,
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
  logoContainer: {
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
  welcomeTitle: {
    fontSize: 36,
    fontWeight: '800',
    color: '#0F172A',
    marginBottom: 8,
    letterSpacing: -1,
    textAlign: 'center',
  },
  welcomeSubtitle: {
    fontSize: 16,
    color: '#64748B',
    textAlign: 'center',
    lineHeight: 24,
    letterSpacing: 0.1,
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
    marginBottom: 24,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
    letterSpacing: 0.1,
  },
  labelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  forgotButton: {
    padding: 4,
  },
  forgotText: {
    fontSize: 14,
    color: '#2563EB',
    fontWeight: '600',
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

  // Button Styles
  signInButton: {
    height: 56,
    borderRadius: 16,
    backgroundColor: '#2563EB',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 8,
    marginBottom: 32,
    shadowColor: '#2563EB',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 8,
    overflow: 'hidden',
    position: 'relative',
  },
  signInButtonDisabled: {
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
  signInButtonText: {
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

  // Sign Up Section
  signUpSection: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    flexWrap: 'wrap',
  },
  signUpText: {
    fontSize: 15,
    color: '#64748B',
  },
  signUpButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    padding: 4,
  },
  signUpLink: {
    fontSize: 15,
    color: '#2563EB',
    fontWeight: '700',
  },

  // Business Slider
  businessSliderContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#ffffff',
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
    paddingHorizontal: 24,
    paddingVertical: 20,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.05,
    shadowRadius: 12,
    elevation: 5,
  },
  sliderWrapper: {
    position: 'relative',
  },
  sliderTrack: {
    height: 64,
    backgroundColor: '#F1F5F9',
    borderRadius: 32,
    position: 'relative',
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  sliderContent: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingLeft: 72,
  },
  sliderText: {
    flex: 1,
    fontSize: 15,
    color: '#64748B',
    fontWeight: '600',
    marginLeft: 12,
  },
  sliderArrows: {
    marginRight: 8,
  },
  sliderButton: {
    position: 'absolute',
    top: 8,
    left: 8,
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#2563EB',
    shadowColor: '#2563EB',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  sliderButtonInner: {
    width: '100%',
    height: '100%',
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#2563EB',
  },
});