import React from 'react';
import { View, Text, StyleSheet, Platform } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { MaterialIcons } from '@expo/vector-icons';
import Homepage from '../screens/Homepage';
import FamilyScreen from '../screens/FamilyScreen';
import SmartRouteScreen from '../screens/SmartRouteScreen';
import ReportsScreen from '../screens/ReportsScreen';
import ProfileScreen from '../screens/ProfileScreen';

const Tab = createBottomTabNavigator();

const PersonalBottomNavigation = () => {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color }) => {
          let iconName;
          let IconComponent = MaterialIcons;

          switch (route.name) {
            case 'Home':
              // MaterialIcons does not have 'home-outlined'; use 'home' for both states
              iconName = 'home';
              break;
            case 'SmartRoute':
              iconName = focused ? 'route' : 'route';
              break;
            case 'Family':
              iconName = focused ? 'family-restroom' : 'family-restroom';
              break;
            case 'Reports':
              iconName = focused ? 'assessment' : 'assessment';
              break;
            case 'Profile':
              // 'person-outline' exists, but to avoid family mismatch issues keep consistent
              iconName = 'person';
              break;
            default:
              iconName = 'circle';
          }

          return <IconComponent name={iconName} size={focused ? 28 : 24} color={color} />;
        },
        tabBarLabel: ({ focused, color }) => {
          const labels = {
            'Home': 'Home',
            'SmartRoute': 'Route',
            'Family': 'Family',
            'Reports': 'Reports',
            'Profile': 'Profile',
          };
          return (
            <Text style={[
              styles.tabLabel,
              { 
                color, 
                fontWeight: focused ? '600' : '400',
                fontSize: focused ? 12 : 11,
              }
            ]}>
              {labels[route.name]}
            </Text>
          );
        },
        tabBarActiveTintColor: '#007AFF',
        tabBarInactiveTintColor: '#999999',
        tabBarStyle: {
          backgroundColor: '#FFFFFF',
          borderTopWidth: 0,
          borderTopColor: 'transparent',
          height: Platform.OS === 'ios' ? 84 : 65,
          paddingBottom: Platform.OS === 'ios' ? 20 : 8,
          paddingTop: 12,
          paddingHorizontal: 0,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: -1 },
          shadowOpacity: 0.08,
          shadowRadius: 3,
          elevation: 8,
        },
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: '500',
          marginTop: 4,
        },
        headerShown: false,
        tabBarItemStyle: {
          paddingVertical: 6,
          paddingHorizontal: 4,
          justifyContent: 'center',
          alignItems: 'center',
        },
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
          tabBarLabel: 'Route',
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
  tabLabel: {
    fontSize: 11,
    fontWeight: '500',
  },
});

export default PersonalBottomNavigation;