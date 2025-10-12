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

  const handleRegister = () => {
    // Validate passwords match
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
    // Add your business registration logic here
  };

  const handleLogin = () => {
    // Navigate back to business login screen
    navigation.navigate('BusinessLogin');
  };

  const handlePersonalRegister = () => {
    // Navigate to personal register screen
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
      >
        {/* Personal Register Arrow */}
        <TouchableOpacity 
          style={styles.personalRegisterButton}
          onPress={handlePersonalRegister}
        >
          <Text style={styles.arrow}>←</Text>
          <Text style={styles.personalRegisterText}>Personal Sign Up</Text>
        </TouchableOpacity>

        {/* Logo */}
        <View style={styles.logoContainer}>
          {/* Option 1: Use Image component with your logo */}
          {/* <Image 
            source={require('./assets/logo.png')} 
            style={styles.logo}
            resizeMode="contain"
          /> */}
          
          {/* Option 2: Placeholder (remove when you add actual logo) */}
          <View style={styles.logoPlaceholder}>
            <Text style={styles.logoText}>LOGO</Text>
          </View>
        </View>

        {/* Title */}
        <Text style={styles.title}>Create Business Account</Text>
        <Text style={styles.subtitle}>Register your business today</Text>

        {/* Business Name Input */}
        <View style={styles.inputContainer}>
          <Text style={styles.label}>Business Name</Text>
          <TextInput
            style={styles.input}
            placeholder="Enter your business name"
            value={businessName}
            onChangeText={setBusinessName}
            autoCapitalize="words"
          />
        </View>

        {/* Registration Number Input */}
        <View style={styles.inputContainer}>
          <Text style={styles.label}>Registration Number</Text>
          <TextInput
            style={styles.input}
            placeholder="Enter business registration number"
            value={registrationNumber}
            onChangeText={setRegistrationNumber}
          />
        </View>

        {/* Email Input */}
        <View style={styles.inputContainer}>
          <Text style={styles.label}>Business Email</Text>
          <TextInput
            style={styles.input}
            placeholder="Enter your business email"
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
            autoComplete="email"
          />
        </View>

        {/* Password Input */}
        <View style={styles.inputContainer}>
          <Text style={styles.label}>Password</Text>
          <TextInput
            style={styles.input}
            placeholder="Create a password"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
            autoCapitalize="none"
          />
        </View>

        {/* Confirm Password Input */}
        <View style={styles.inputContainer}>
          <Text style={styles.label}>Confirm Password</Text>
          <TextInput
            style={styles.input}
            placeholder="Confirm your password"
            value={confirmPassword}
            onChangeText={setConfirmPassword}
            secureTextEntry
            autoCapitalize="none"
          />
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
        >
          <Text style={styles.registerButtonText}>Sign Up</Text>
        </TouchableOpacity>

        {/* Login Link */}
        <View style={styles.loginContainer}>
          <Text style={styles.loginText}>Already have a business account? </Text>
          <TouchableOpacity onPress={handleLogin}>
            <Text style={styles.loginLink}>Login</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  scrollContent: {
    flexGrow: 1,
    padding: 24,
    paddingTop: 60,
    paddingBottom: 40,
  },
  personalRegisterButton: {
    position: 'absolute',
    top: 20,
    left: 24,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f0f0f0',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    zIndex: 10,
  },
  personalRegisterText: {
    fontSize: 14,
    color: '#333',
    fontWeight: '500',
    marginLeft: 4,
  },
  arrow: {
    fontSize: 18,
    color: '#333',
  },
  logoContainer: {
    alignItems: 'center',
    marginTop: 40,
    marginBottom: 32,
  },
  logo: {
    width: 120,
    height: 120,
  },
  logoPlaceholder: {
    width: 120,
    height: 120,
    backgroundColor: '#FF6B35',
    borderRadius: 60,
    justifyContent: 'center',
    alignItems: 'center',
  },
  logoText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#333',
    textAlign: 'center',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginBottom: 32,
  },
  inputContainer: {
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  input: {
    height: 50,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    paddingHorizontal: 16,
    fontSize: 16,
    backgroundColor: '#f9f9f9',
  },
  termsText: {
    fontSize: 12,
    color: '#666',
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 18,
  },
  termsLink: {
    color: '#FF6B35',
    fontWeight: '600',
  },
  registerButton: {
    height: 50,
    backgroundColor: '#FF6B35',
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
  },
  registerButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#fff',
  },
  loginContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  loginText: {
    fontSize: 14,
    color: '#666',
  },
  loginLink: {
    fontSize: 14,
    color: '#FF6B35',
    fontWeight: '600',
  },
});