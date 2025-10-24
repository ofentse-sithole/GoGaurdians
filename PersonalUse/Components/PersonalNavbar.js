import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import Icon from 'react-native-vector-icons/Ionicons';
import Homepage from '../screens/Homepage';

const Tab = createBottomTabNavigator();

// Placeholder Screen Components for other tabs
const SmartRouteScreen = () => (
  <View style={styles.screen}>
    <Text style={styles.screenText}>Smart Route Screen</Text>
  </View>
);

const FamilyScreen = () => (
  <View style={styles.screen}>
    <Text style={styles.screenText}>Family Screen</Text>
  </View>
);

const ReportsScreen = () => (
  <View style={styles.screen}>
    <Text style={styles.screenText}>Reports Screen</Text>
  </View>
);

const ProfileScreen = () => (
  <View style={styles.screen}>
    <Text style={styles.screenText}>Profile Screen</Text>
  </View>
);

const PersonalBottomNavigation = ({ navigation }) => {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) => {
          let iconName;

          switch (route.name) {
            case 'Home':
              iconName = focused ? 'home' : 'home-outline';
              break;
            case 'SmartRoute':
              iconName = focused ? 'navigate' : 'navigate-outline';
              break;
            case 'Family':
              iconName = focused ? 'people' : 'people-outline';
              break;
            case 'Reports':
              iconName = focused ? 'document-text' : 'document-text-outline';
              break;
            case 'Profile':
              iconName = focused ? 'person' : 'person-outline';
              break;
            default:
              iconName = 'circle';
          }

          return <Icon name={iconName} size={size} color={color} />;
        },
        tabBarActiveTintColor: '#00D9FF',
        tabBarInactiveTintColor: '#8E8E93',
        tabBarStyle: {
          backgroundColor: '#FFFFFF',
          borderTopWidth: 1,
          borderTopColor: '#E5E5EA',
          height: 60,
          paddingBottom: 5,
          paddingTop: 5,
        },
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: '500',
        },
        headerShown: false,
      })}
    >
      <Tab.Screen 
        name="Home" 
        component={Homepage}
        options={{
          tabBarLabel: 'Home',
        }}
      />
      <Tab.Screen 
        name="SmartRoute" 
        component={SmartRouteScreen}
        options={{
          tabBarLabel: 'Smart Route',
        }}
      />
      <Tab.Screen 
        name="Family" 
        component={FamilyScreen}
        options={{
          tabBarLabel: 'Family',
        }}
      />
      <Tab.Screen 
        name="Reports" 
        component={ReportsScreen}
        options={{
          tabBarLabel: 'Reports',
        }}
      />
      <Tab.Screen 
        name="Profile" 
        component={ProfileScreen}
        options={{
          tabBarLabel: 'Profile',
        }}
      />
    </Tab.Navigator>
  );
};

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F2F2F7',
  },
  screenText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#000000',
  },
});

export default PersonalBottomNavigation;