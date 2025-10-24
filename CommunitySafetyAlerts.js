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

export default function CommunitySafetyAlerts({ navigation }) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [titleFocused, setTitleFocused] = useState(false);
  const [descriptionFocused, setDescriptionFocused] = useState(false);
  const [sliderPosition] = useState(new Animated.Value(0));

  const handleSubmitAlert = () => {
    console.log('Safety alert submitted:', { title, description });
    // Add logic to send alert to backend or local storage
    setTitle('');
    setDescription('');
  };

  const handleViewAlerts = () => {
    navigation.navigate('AlertFeed'); // Navigate to a screen showing recent alerts
  };

  const onSliderGestureEvent = Animated.event(
    [{ nativeEvent: { translationX: sliderPosition } }],
    { useNativeDriver: false }
  );

  const onSliderHandlerStateChange = (event) => {
    if (event.nativeEvent.state === 5) {
      const { translationX } = event.nativeEvent;
      if (translationX > 150) {
        Animated.timing(sliderPosition, {
          toValue: 280,
          duration: 200,
          useNativeDriver: false,
        }).start(() => {
          handleViewAlerts();
        });
      } else {
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
      handleViewAlerts();
    });
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      style={styles.container}
    >
      <ScrollView contentContainerStyle={styles.scrollContainer}>
        <Text style={styles.header}>Community Safety Alerts</Text>

        <TextInput
          style={[styles.input, titleFocused && styles.inputFocused]}
          placeholder="Alert Title"
          value={title}
          onChangeText={setTitle}
          onFocus={() => setTitleFocused(true)}
          onBlur={() => setTitleFocused(false)}
        />

        <TextInput
          style={[styles.textArea, descriptionFocused && styles.inputFocused]}
          placeholder="Describe the situation..."
          value={description}
          onChangeText={setDescription}
          multiline
          numberOfLines={4}
          onFocus={() => setDescriptionFocused(true)}
          onBlur={() => setDescriptionFocused(false)}
        />

        <TouchableOpacity style={styles.button} onPress={handleSubmitAlert}>
          <Text style={styles.buttonText}>Submit Alert</Text>
        </TouchableOpacity>

        <PanGestureHandler
          onGestureEvent={onSliderGestureEvent}
          onHandlerStateChange={onSliderHandlerStateChange}
        >
          <Animated.View style={[styles.slider, { transform: [{ translateX: sliderPosition }] }]}>
            <Text style={styles.sliderText}>Swipe to View Alerts</Text>
          </Animated.View>
        </PanGestureHandler>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f2f2f2',
  },
  scrollContainer: {
    padding: 20,
    alignItems: 'center',
  },
  header: {
    fontSize: 24,
    marginVertical: 20,
    fontWeight: 'bold',
    color: '#333',
  },
  input: {
    width: '100%',
    padding: 12,
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
    marginBottom: 15,
    backgroundColor: '#fff',
  },
  textArea: {
    width: '100%',
    padding: 12,
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
    height: 100,
    backgroundColor: '#fff',
    textAlignVertical: 'top',
    marginBottom: 15,
  },
  inputFocused: {
    borderColor: '#007AFF',
  },
  button: {
    backgroundColor: '#007AFF',
    paddingVertical: 12,
    paddingHorizontal: 30,
    borderRadius: 8,
    marginBottom: 20,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
  },
  slider: {
    backgroundColor: '#ddd',
    padding: 15,
    borderRadius: 8,
    width: 280,
    alignItems: 'center',
  },
  sliderText: {
    color: '#333',
    fontWeight: '600',
  },
});