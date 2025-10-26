import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Animated,
  Easing,
  Vibration,
  Alert,
  Platform,
  Linking,
} from 'react-native';
import * as Contacts from 'expo-contacts';
import * as Location from 'expo-location';
import { MaterialCommunityIcons as Icon } from '@expo/vector-icons';

const SA_EMERGENCY_CONTACTS = [
  { id: 'police', name: 'Police', number: '10111', icon: 'police-badge', color: '#1a237e' },
  { id: 'ambulance', name: 'Ambulance', number: '10177', icon: 'ambulance', color: '#b71c1c' },
  { id: 'fire', name: 'Fire', number: '998', icon: 'fire-truck', color: '#e65100' },
  { id: 'crime', name: 'Crime Stop', number: '0860010111', icon: 'alert-circle', color: '#311b92' },
  { id: 'gender', name: 'Gender Violence', number: '0800428428', icon: 'hand-heart', color: '#4a148c' },
];

export default function EmergencyPanicButton({ maxPersonal = 4 }) {
  const [open, setOpen] = useState(false);
  const [contacts, setContacts] = useState([]);
  const [location, setLocation] = useState(null);

  const animation = useRef(new Animated.Value(0)).current; // 0 closed, 1 opened

  useEffect(() => {
    (async () => {
      try {
        const { status: contactStatus } = await Contacts.requestPermissionsAsync();
        if (contactStatus === 'granted') {
          const { data } = await Contacts.getContactsAsync({
            fields: [Contacts.Fields.PhoneNumbers, Contacts.Fields.Name],
          });
          const usable = (data || []).filter(c => c.phoneNumbers && c.phoneNumbers.length);
          setContacts(usable);
        }
      } catch (e) {
        console.warn('Contacts error', e);
      }

      try {
        const { status: locStatus } = await Location.requestForegroundPermissionsAsync();
        if (locStatus === 'granted') {
          const loc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Highest });
          setLocation(loc);
        }
      } catch (e) {
        console.warn('Location error', e);
      }
    })();
  }, []);

  const toggle = () => {
    Vibration.vibrate(100);
    const toValue = open ? 0 : 1;
    Animated.timing(animation, {
      toValue,
      duration: 300,
      easing: Easing.out(Easing.ease),
      useNativeDriver: true,
    }).start();
    setOpen(!open);
  };

  const makeCall = async (number) => {
    try {
      await Linking.openURL(`tel:${number}`);
    } catch {
      Alert.alert('Call failed', 'Unable to make call on this device.');
    }
  };

  const sendSMS = async (number, text) => {
    const body = encodeURIComponent(text);
    const separator = Platform.OS === 'ios' ? '&' : '?';
    try {
      await Linking.openURL(`sms:${number}${separator}body=${body}`);
    } catch {
      Alert.alert('SMS failed', 'Unable to open messaging app.');
    }
  };

  const notifyContact = (contact) => {
    if (!contact || !contact.phoneNumbers || !contact.phoneNumbers.length) {
      Alert.alert('No number', 'Selected contact has no phone number.');
      return;
    }
    const number = contact.phoneNumbers[0].number.replace(/\s+/g, '');
    const locStr = location
      ? `My location: https://maps.google.com/?q=${location.coords.latitude},${location.coords.longitude}`
      : 'Location not available';
    const message = `EMERGENCY: I need help!\n${locStr}`;
    sendSMS(number, message);
  };

  const notifyEmergencyService = (number) => {
    // Ask user whether to call or SMS
    Alert.alert(
      'Contact Service',
      `Call ${number} or send SMS?`,
      [
        { text: 'Call', onPress: () => makeCall(number) },
        { text: 'SMS', onPress: () => sendSMS(number, `EMERGENCY: please respond to my location`) },
        { text: 'Cancel', style: 'cancel' },
      ],
      { cancelable: true }
    );
  };

  // Build radial items: first SA services then personal contacts (limited)
  const personal = contacts.slice(0, maxPersonal);
  const items = [
    ...SA_EMERGENCY_CONTACTS.map(c => ({ type: 'service', ...c })),
    ...personal.map((c, i) => ({ type: 'person', id: `p-${i}`, name: c.name, contact: c, icon: 'account', color: '#007AFF' })),
  ];

  const radius = 120;
  const angleStep = (Math.PI * 2) / items.length;

  return (
    <View pointerEvents="box-none" style={styles.container}>
      {items.map((item, i) => {
        // calculate position around center
        const angle = -Math.PI / 2 + i * angleStep; // start top and go clockwise
        const x = Math.cos(angle) * radius;
        const y = Math.sin(angle) * radius;

        const translateX = animation.interpolate({
          inputRange: [0, 1],
          outputRange: [0, x],
        });
        const translateY = animation.interpolate({
          inputRange: [0, 1],
          outputRange: [0, y],
        });
        const scale = animation.interpolate({ inputRange: [0, 1], outputRange: [0.01, 1] });

        return (
          <Animated.View
            key={item.id ?? item.name + i}
            style={[
              styles.actionContainer,
              {
                transform: [{ translateX }, { translateY }, { scale }],
                opacity: animation,
              },
            ]}
          >
            <TouchableOpacity
              activeOpacity={0.8}
              style={[styles.actionButton, { backgroundColor: item.color || '#444' }]}
              onPress={() => {
                // close after action
                toggle();
                setTimeout(() => {
                  if (item.type === 'service') notifyEmergencyService(item.number);
                  else notifyContact(item.contact);
                }, 350);
              }}
            >
              <Icon name={item.icon} size={20} color="white" />
              <Text style={styles.actionLabel} numberOfLines={1}>{item.name}</Text>
            </TouchableOpacity>
          </Animated.View>
        );
      })}

      <Animated.View style={[styles.centerButtonContainer, { transform: [{ rotate: animation.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '45deg'] }) }] }]}>
        <TouchableOpacity style={styles.centerButton} onPress={toggle} activeOpacity={0.9}>
          <Icon name="alert" size={28} color="#fff" />
          <Text style={styles.centerText}>PANIC</Text>
        </TouchableOpacity>
      </Animated.View>
    </View>
  );
}

const BUTTON_SIZE = 68;
const ACTION_SIZE = 64;

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    right: 28,
    bottom: 28,
    width: BUTTON_SIZE * 4,
    height: BUTTON_SIZE * 4,
    alignItems: 'center',
    justifyContent: 'center',
    // pointerEvents allow touches to pass to buttons outside bounds on some Android versions
  },
  centerButtonContainer: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
  },
  centerButton: {
    width: BUTTON_SIZE,
    height: BUTTON_SIZE,
    borderRadius: BUTTON_SIZE / 2,
    backgroundColor: '#ff1744',
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
  },
  centerText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: '700',
    marginTop: 4,
  },
  actionContainer: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionButton: {
    width: ACTION_SIZE,
    height: ACTION_SIZE,
    borderRadius: ACTION_SIZE / 2,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 6,
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3,
  },
  actionLabel: {
    color: '#fff',
    fontSize: 10,
    marginTop: 4,
    textAlign: 'center',
    maxWidth: 70,
  },
});