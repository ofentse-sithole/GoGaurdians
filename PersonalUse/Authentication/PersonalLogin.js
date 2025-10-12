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
  Animated
} from 'react-native';
import { PanGestureHandler } from 'react-native-gesture-handler';

export default function PersonalLogin({ navigation }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [emailFocused, setEmailFocused] = useState(false);
  const [passwordFocused, setPasswordFocused] = useState(false);
  const [sliderPosition] = useState(new Animated.Value(0));

  const handleLogin = () => {
    console.log('Login pressed', { email, password });
    // Add your login logic here
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
        {/* Background Gradient Elements */}
        <View style={styles.gradientCircle1} />
        <View style={styles.gradientCircle2} />


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
          <Text style={styles.title}>Welcome Back</Text>
          <Text style={styles.subtitle}>Log in to your account to continue</Text>
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
              <Text style={styles.inputIcon}>✉</Text>
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
            <View style={styles.labelRow}>
              <Text style={styles.label}>Password</Text>
              <TouchableOpacity 
                onPress={handleForgotPassword}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              >
                <Text style={styles.forgotPasswordText}>Forgot Password?</Text>
              </TouchableOpacity>
            </View>
            <View style={[
              styles.inputWrapper,
              passwordFocused && styles.inputWrapperFocused
            ]}>
              <Text style={styles.inputIcon}>🔒</Text>
              <TextInput
                style={styles.input}
                placeholder="Enter your password"
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

          {/* Login Button */}
          <TouchableOpacity 
            style={styles.loginButton}
            onPress={handleLogin}
            activeOpacity={0.9}
          >
            <Text style={styles.loginButtonText}>Sign In</Text>
            <View style={styles.buttonShine} />
          </TouchableOpacity>

          {/* Divider */}
          <View style={styles.dividerContainer}>
            <View style={styles.divider} />
            <Text style={styles.dividerText}>or</Text>
            <View style={styles.divider} />
          </View>

          {/* Sign Up Link */}
          <View style={styles.signUpContainer}>
            <Text style={styles.signUpText}>Don't have an account? </Text>
            <TouchableOpacity onPress={handleSignUp} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
              <Text style={styles.signUpLink}>Create Account</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>

      {/* Bottom Slider */}
      <View style={styles.sliderContainer}>
        <View style={styles.sliderTrack}>
          <Text style={styles.sliderText}>Slide for Business Login</Text>
          <Text style={styles.sliderArrows}>→ → →</Text>
          
          <PanGestureHandler
            onGestureEvent={onSliderGestureEvent}
            onHandlerStateChange={onSliderHandlerStateChange}
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
              >
                <Text style={styles.sliderButtonText}>🏢</Text>
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
    backgroundColor: '#FAFAFA',

  },
  scrollContent: {
    flexGrow: 1,
    padding: 24,
    paddingTop: -40,
    paddingBottom: 140, // Extra space for slider
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
  businessLoginButton: {
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
  businessLoginText: {
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
    marginBottom: 40,
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
    color: '#374151',
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
    transition: 'all 0.2s',
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
  inputIcon: {
    fontSize: 18,
    marginRight: 12,
    opacity: 0.6,
  },
  input: {
    flex: 1,
    fontSize: 16,
    color: '#1F2937',
    padding: 0,
  },
  forgotPasswordText: {
    fontSize: 13,
    color: '#6366F1',
    fontWeight: '600',
  },
  loginButton: {
    height: 56,
    backgroundColor: '#6366F1',
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 8,
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
  loginButtonText: {
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
  signUpContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  signUpText: {
    fontSize: 15,
    color: '#6B7280',
  },
  signUpLink: {
    fontSize: 15,
    color: '#6366F1',
    fontWeight: '700',
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
    borderTopColor: '#E5E7EB',
  },
  sliderTrack: {
    height: 60,
    backgroundColor: '#F3F4F6',
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
    color: '#6B7280',
    fontWeight: '600',
  },
  sliderArrows: {
    position: 'absolute',
    right: 20,
    fontSize: 16,
    color: '#9CA3AF',
    fontWeight: '600',
  },
  sliderButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#6366F1',
    shadowColor: '#6366F1',
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
});