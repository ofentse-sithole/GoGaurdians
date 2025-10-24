import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Alert,
  Linking,
  Platform,
  Vibration
} from 'react-native';
import * as Contacts from 'expo-contacts';
import * as Location from 'expo-location';
import { MaterialCommunityIcons as Icon } from '@expo/vector-icons';
import { SA_EMERGENCY_CONTACTS } from '../constants/EmergencyContacts';

export default function EmergencyButton() {
  const [contacts, setContacts] = useState([]);
  const [location, setLocation] = useState(null);
  const [isEmergencyMode, setIsEmergencyMode] = useState(false);

  useEffect(() => {
    (async () => {
      const { status: contactStatus } = await Contacts.requestPermissionsAsync();
      const { status: locationStatus } = await Location.requestForegroundPermissionsAsync();

      if (contactStatus === 'granted') {
        const { data } = await Contacts.getContactsAsync({
          fields: [Contacts.Fields.PhoneNumbers, Contacts.Fields.Name],
        });
        setContacts(data.filter(contact => contact.phoneNumbers && contact.phoneNumbers.length > 0));
      }

      if (locationStatus === 'granted') {
        const currentLocation = await Location.getCurrentPositionAsync({});
        setLocation(currentLocation);
      }
    })();
  }, []);

  const activateEmergencyMode = () => {
    Vibration.vibrate([400, 100, 400]);
    setIsEmergencyMode(true);
    Alert.alert(
      'Emergency Mode Activated',
      'Choose who to contact',
      [
        { text: 'Emergency Services', onPress: showEmergencyContacts },
        { text: 'Personal Contacts', onPress: showPersonalContacts },
        { text: 'Cancel', style: 'cancel' }
      ],
      { cancelable: true }
    );
  };

  const showEmergencyContacts = () => {
    Alert.alert(
      'Emergency Services',
      'Select service to contact',
      SA_EMERGENCY_CONTACTS.map(contact => ({
        text: contact.name,
        onPress: () => makeCall(contact.number)
      }))
    );
  };

  const showPersonalContacts = () => {
    const contactOptions = contacts.slice(0, 5).map(contact => ({
      text: contact.name,
      onPress: () => sendEmergencyMessage(contact)
    }));

    Alert.alert(
      'Personal Contacts',
      'Select contact to notify',
      contactOptions
    );
  };

  const makeCall = async (number) => {
    try {
      await Linking.openURL(`tel:${number}`);
    } catch (error) {
      Alert.alert('Error', 'Could not initiate call');
    }
  };

  const sendEmergencyMessage = async (contact) => {
    const locationStr = location 
      ? `\nMy location: https://maps.google.com/?q=${location.coords.latitude},${location.coords.longitude}`
      : '';
    
    const messageBody = `EMERGENCY: I need help! ${locationStr}`;

    try {
      const phoneNumber = contact.phoneNumbers[0].number;
      if (Platform.OS === 'ios') {
        await Linking.openURL(`sms:${phoneNumber}&body=${messageBody}`);
      } else {
        await Linking.openURL(`sms:${phoneNumber}?body=${messageBody}`);
      }
    } catch (error) {
      Alert.alert('Error', 'Could not send message');
    }
  };

  return (
    <View style={styles.container}>
      <TouchableOpacity
        style={[styles.panicButton, isEmergencyMode && styles.panicButtonActive]}
        onPress={activateEmergencyMode}
      >
        <Icon name="alert-circle" size={40} color="white" />
        <Text style={styles.buttonText}>PANIC BUTTON</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 30,
    right: 30,
  },
  panicButton: {
    backgroundColor: '#ff1744',
    width: 100,
    height: 100,
    borderRadius: 50,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  panicButtonActive: {
    backgroundColor: '#d50000',
  },
  buttonText: {
    color: 'white',
    fontSize: 12,
    fontWeight: 'bold',
    textAlign: 'center',
    marginTop: 5,
  }
});