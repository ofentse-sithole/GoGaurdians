import React, { useState, useEffect } from 'react';
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
  Image,
  Alert,
} from 'react-native';
import { PanGestureHandler } from 'react-native-gesture-handler';
import * as ImagePicker from 'expo-image-picker';
import * as Location from 'expo-location';

export default function CommunitySafetyAlerts({ navigation }) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [titleFocused, setTitleFocused] = useState(false);
  const [descriptionFocused, setDescriptionFocused] = useState(false);
  const [sliderPosition] = useState(new Animated.Value(0));

  // New states for image and location
  const [imageUri, setImageUri] = useState(null);
  const [location, setLocation] = useState(null);
  const [address, setAddress] = useState(null);

  useEffect(() => {
    // Request permissions on mount
    (async () => {
      try {
        const mediaPerm = await ImagePicker.requestMediaLibraryPermissionsAsync();
        const cameraPerm = await ImagePicker.requestCameraPermissionsAsync();
        const locPerm = await Location.requestForegroundPermissionsAsync();

        if (!mediaPerm.granted && !cameraPerm.granted) {
          console.warn('Image permissions not granted');
        }
        if (!locPerm.granted) {
          console.warn('Location permission not granted');
        }
      } catch (e) {
        console.warn('Permission request error', e);
      }
    })();
  }, []);

  const handleSubmitAlert = () => {
    const payload = {
      title,
      description,
      image: imageUri,
      location,
      address,
    };
    console.log('Safety alert submitted:', payload);
    // Add logic to send alert to backend or local storage
    setTitle('');
    setDescription('');
    setImageUri(null);
    setLocation(null);
    setAddress(null);
    Alert.alert('Submitted', 'Your safety alert has been submitted.');
  };

  const handleViewAlerts = () => {
    navigation.navigate('AlertFeed'); // Navigate to a screen showing recent alerts
  };

  const pickImage = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        quality: 0.7,
      });

      // handle both SDK versions (result.cancelled / result.canceled / result.assets)
      if (result.cancelled === false || result.canceled === false || (result.assets && result.assets.length)) {
        const uri = result.assets ? result.assets[0].uri : result.uri;
        setImageUri(uri);
      }
    } catch (e) {
      console.warn('Image pick error', e);
    }
  };

  const takePhoto = async () => {
    try {
      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        quality: 0.7,
      });

      if (result.cancelled === false || result.canceled === false || (result.assets && result.assets.length)) {
        const uri = result.assets ? result.assets[0].uri : result.uri;
        setImageUri(uri);
      }
    } catch (e) {
      console.warn('Camera error', e);
    }
  };

  const getLocation = async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission denied', 'Location permission is required to get current location.');
        return;
      }
      const loc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Highest });
      setLocation(loc.coords);

      // Reverse geocode for a readable address (best-effort)
      const geocode = await Location.reverseGeocodeAsync({
        latitude: loc.coords.latitude,
        longitude: loc.coords.longitude,
      });
      if (geocode && geocode.length > 0) {
        const place = geocode[0];
        const parts = [
          place.name,
          place.street,
          place.city,
          place.region,
          place.postalCode,
          place.country,
        ].filter(Boolean);
        setAddress(parts.join(', '));
      } else {
        setAddress(null);
      }
    } catch (e) {
      console.warn('Location error', e);
    }
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

        {/* Image upload UI */}
        <View style={styles.row}>
          <TouchableOpacity style={styles.smallButton} onPress={pickImage}>
            <Text style={styles.smallButtonText}>Choose Image</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.smallButton} onPress={takePhoto}>
            <Text style={styles.smallButtonText}>Take Photo</Text>
          </TouchableOpacity>
        </View>
        {imageUri ? (
          <Image source={{ uri: imageUri }} style={styles.imagePreview} />
        ) : null}

        {/* Location UI */}
        <View style={styles.row}>
          <TouchableOpacity style={styles.smallButton} onPress={getLocation}>
            <Text style={styles.smallButtonText}>Get Current Location</Text>
          </TouchableOpacity>
        </View>
        {location ? (
          <View style={styles.locationBox}>
            <Text style={styles.locationText}>
              Lat: {location.latitude.toFixed(6)}  Lon: {location.longitude.toFixed(6)}
            </Text>
            {address ? <Text style={styles.locationText}>{address}</Text> : null}
          </View>
        ) : null}

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

  // New styles
  row: {
    flexDirection: 'row',
    width: '100%',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  smallButton: {
    flex: 1,
    backgroundColor: '#fff',
    borderColor: '#007AFF',
    borderWidth: 1,
    paddingVertical: 10,
    marginHorizontal: 6,
    borderRadius: 8,
    alignItems: 'center',
  },
  smallButtonText: {
    color: '#007AFF',
    fontWeight: '600',
  },
  imagePreview: {
    width: 200,
    height: 140,
    borderRadius: 8,
    marginBottom: 12,
  },
  locationBox: {
    backgroundColor: '#fff',
    padding: 10,
    borderRadius: 8,
    borderColor: '#ccc',
    borderWidth: 1,
    width: '100%',
    marginBottom: 12,
  },
  locationText: {
    color: '#333',
  },
});
