import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  TouchableOpacity,
  Alert,
  Linking
} from 'react-native';
import * as Contacts from 'expo-contacts';
import { MaterialCommunityIcons as Icon } from '@expo/vector-icons';

export default function EmergencyContactList() {
  const [contacts, setContacts] = useState([]);

  useEffect(() => {
    (async () => {
      const { status } = await Contacts.requestPermissionsAsync();
      if (status === 'granted') {
        const { data } = await Contacts.getContactsAsync({
          fields: [Contacts.Fields.PhoneNumbers, Contacts.Fields.Name],
        });
        
        const validContacts = data.filter(contact => 
          contact.phoneNumbers && contact.phoneNumbers.length > 0
        );
        setContacts(validContacts);
      }
    })();
  }, []);

  const handleContact = (contact) => {
    const phoneNumber = contact.phoneNumbers[0].number;
    Alert.alert(
      'Contact ' + contact.name,
      'Choose action',
      [
        {
          text: 'Call',
          onPress: () => Linking.openURL(`tel:${phoneNumber}`)
        },
        {
          text: 'Message',
          onPress: () => Linking.openURL(`sms:${phoneNumber}`)
        },
        {
          text: 'Cancel',
          style: 'cancel'
        }
      ]
    );
  };

  const renderContact = ({ item }) => (
    <TouchableOpacity 
      style={styles.contactItem}
      onPress={() => handleContact(item)}
    >
      <Icon name="account-circle" size={40} color="#007AFF" />
      <View style={styles.contactInfo}>
        <Text style={styles.contactName}>{item.name}</Text>
        {item.phoneNumbers && item.phoneNumbers[0] && (
          <Text style={styles.contactNumber}>
            {item.phoneNumbers[0].number}
          </Text>
        )}
      </View>
      <Icon name="chevron-right" size={24} color="#999" />
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <Text style={styles.header}>Emergency Contacts</Text>
      <FlatList
        data={contacts}
        renderItem={renderContact}
        keyExtractor={(item, index) => index.toString()}
        ItemSeparatorComponent={() => <View style={styles.separator} />}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    fontSize: 24,
    fontWeight: 'bold',
    padding: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  contactItem: {
    flexDirection: 'row',
    padding: 16,
    alignItems: 'center',
    backgroundColor: '#fff',
  },
  contactInfo: {
    flex: 1,
    marginLeft: 16,
  },
  contactName: {
    fontSize: 16,
    fontWeight: '600',
  },
  contactNumber: {
    fontSize: 14,
    color: '#666',
    marginTop: 4,
  },
  separator: {
    height: 1,
    backgroundColor: '#eee',
  }
});