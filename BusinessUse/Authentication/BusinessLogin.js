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
  Image,
  Animated,
  Alert,
  ActivityIndicator
} from 'react-native';
import { PanGestureHandler } from 'react-native-gesture-handler';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { ref, get, set, serverTimestamp } from 'firebase/database';
import { auth, realtimeDB } from '../../firebaseConfig';

export default function BusinessLogin({ navigation }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [emailFocused, setEmailFocused] = useState(false);
  const [passwordFocused, setPasswordFocused] = useState(false);
  const [sliderPosition] = useState(new Animated.Value(0));
  const [loading, setLoading] = useState(false);

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
      
      // Check if user has a business account in Realtime Database
      const businessUserRef = ref(realtimeDB, `businessUsers/${user.uid}`);
      const businessUserSnapshot = await get(businessUserRef);
      
      if (!businessUserSnapshot.exists()) {
        // User exists in auth but not as a business user
        Alert.alert(
          'Access Denied', 
          'This account is not registered as a business account. Please contact support or register a new business account.',
          [
            {
              text: 'OK',
              onPress: async () => {
                // Sign out the user since they don't have business access
                await auth.signOut();
              },
            },
          ]
        );
        return;
      }

      const businessData = businessUserSnapshot.val();
      
      // Check if business account is active
      if (businessData.status === 'suspended' || businessData.status === 'inactive') {
        Alert.alert(
          'Account Suspended', 
          'Your business account has been suspended. Please contact support for assistance.'
        );
        await auth.signOut();
        return;
      }

      // Update last login timestamp
      await set(ref(realtimeDB, `businessUsers/${user.uid}/lastLogin`), serverTimestamp());
      await set(ref(realtimeDB, `businessUsers/${user.uid}/loginCount`), (businessData.loginCount || 0) + 1);

      console.log('Business login successful:', user.email, businessData.companyName);
      
      // Navigate to business dashboard
      // TODO: Replace 'PersonalApp' with actual business app route once available
      navigation?.reset({
        index: 0,
        routes: [{ name: 'PersonalApp' }],
      });
      
    } catch (error) {
      console.error('Business login error:', error);
      
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
    navigation?.navigate('BusinessForgotPassword');
  };

  const handleSignUp = () => {
    navigation?.navigate('BusinessRegister');
  };

  const handlePersonalLogin = () => {
    navigation?.navigate('PersonalLogin');
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
          handlePersonalLogin();
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
      handlePersonalLogin();
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

        {/* Header Section with Accent */}
        <View style={styles.headerAccent} />

        {/* Logo Section */}
        <View style={styles.logoContainer}>
          <View style={styles.logoPlaceholder}>
            <View style={styles.logoInner}>
              <Image
                  source={require('../../assets/images/GoGraurdianLogo-removebg-preview.png')} 
                  style={styles.logoImage}
                  resizeMode="contain"
                />
            </View>
          </View>
          <Text style={styles.companyName}>Business Portal</Text>
        </View>

        {/* Title Section */}
        <View style={styles.titleSection}>
          <Text style={styles.title}>Welcome Back</Text>
          <Text style={styles.subtitle}>Access your business dashboard</Text>
        </View>

        {/* Login Form */}
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

          {/* Password Input */}
          <View style={styles.inputContainer}>
            <View style={styles.labelRow}>
              <Text style={styles.label}>Password</Text>
              <TouchableOpacity 
                onPress={handleForgotPassword}
                activeOpacity={0.7}
                disabled={loading}
              >
                <Text style={styles.forgotPasswordText}>Forgot Password?</Text>
              </TouchableOpacity>
            </View>
            <View style={[
              styles.inputWrapper,
              passwordFocused && styles.inputWrapperFocused
            ]}>
              <TextInput
                style={styles.input}
                placeholder="Enter your password"
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

          {/* Login Button */}
          <TouchableOpacity 
            style={[styles.loginButton, loading && styles.loginButtonDisabled]}
            onPress={handleLogin}
            activeOpacity={0.8}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#fff" size="small" />
            ) : (
              <Text style={styles.loginButtonText}>Sign In</Text>
            )}
          </TouchableOpacity>

          {/* Divider */}
          <View style={styles.dividerContainer}>
            <View style={styles.divider} />
            <Text style={styles.dividerText}>or</Text>
            <View style={styles.divider} />
          </View>

          {/* Sign Up Section */}
          <View style={styles.signUpContainer}>
            <Text style={styles.signUpText}>New to Business Portal?</Text>
            <TouchableOpacity 
              onPress={handleSignUp}
              activeOpacity={0.7}
              disabled={loading}
            >
              <Text style={styles.signUpLink}>Create Account</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Footer */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>
            Secure business access • Protected by encryption
          </Text>
        </View>
      </ScrollView>

      {/* Bottom Slider */}
      <View style={styles.sliderContainer}>
        <View style={styles.sliderTrack}>
          <Text style={styles.sliderText}>Slide for Personal Login</Text>
          <Text style={styles.sliderArrows}>→ → →</Text>
          
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
                <Text style={styles.sliderButtonText}>👤</Text>
              </TouchableOpacity>
            </Animated.View>
          </PanGestureHandler>
        </View>
      </View>
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
    paddingTop: -120,
    paddingBottom: 120, // Extra space for slider
  },
  headerAccent: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 200,
    backgroundColor: 'linear-gradient(135deg, #1E40AF 0%, #3B82F6 100%)',
    background: '#1E40AF',
  },
  personalLoginButton: {
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
  personalLoginText: {
    fontSize: 13,
    color: '#FFFFFF',
    fontWeight: '600',
    marginLeft: 4,
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
    backgroundColor: '#dcdfeaff',
    borderRadius: 45,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
  },
  logoInner: {
    width: 78,
    height: 78,
    backgroundColor: '#1E40AF',
    borderRadius: 39,
    justifyContent: 'center',
    alignItems: 'center',
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
    marginTop: -40,
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
  labelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
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
  forgotPasswordText: {
    fontSize: 13,
    color: '#1E40AF',
    fontWeight: '600',
  },
  loginButton: {
    height: 52,
    backgroundColor: '#1E40AF',
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 8,
    shadowColor: '#1E40AF',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  loginButtonDisabled: {
    backgroundColor: '#94A3B8',
    shadowOpacity: 0.1,
  },
  loginButtonText: {
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
  signUpContainer: {
    alignItems: 'center',
  },
  signUpText: {
    fontSize: 14,
    color: '#64748B',
    marginBottom: 8,
    fontWeight: '500',
  },
  signUpLink: {
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
  // Slider styles
  sliderContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 24,
    paddingVertical: 20,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
  },
  sliderTrack: {
    height: 60,
    backgroundColor: '#F1F5F9',
    borderRadius: 30,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 6,
    position: 'relative',
    overflow: 'hidden',
  },
  sliderText: {
    position: 'absolute',
    left: 70,
    fontSize: 14,
    color: '#64748B',
    fontWeight: '600',
  },
  sliderArrows: {
    position: 'absolute',
    right: 20,
    fontSize: 16,
    color: '#94A3B8',
    fontWeight: '600',
  },
  sliderButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#1E40AF',
    shadowColor: '#1E40AF',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 3,
  },
  sliderButtonInner: {
    width: '100%',
    height: '100%',
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sliderButtonText: {
    fontSize: 20,
  },
  logoImage: {
  width: 28,   // adjust to match your design
  height: 28,
  borderRadius: 14, // optional, if you want rounded edges
},

});