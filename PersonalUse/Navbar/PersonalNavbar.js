import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import Icon from 'react-native-vector-icons/Ionicons';

const Tab = createBottomTabNavigator();

// Screen Components
const HomeScreen = () => (
  <View style={styles.screen}>
    <Text style={styles.screenText}>Home Screen</Text>
  </View>
);

const SearchScreen = () => (
  <View style={styles.screen}>
    <Text style={styles.screenText}>Search Screen</Text>
  </View>
);

const FavoritesScreen = () => (
  <View style={styles.screen}>
    <Text style={styles.screenText}>Favorites Screen</Text>
  </View>
);

const NotificationsScreen = () => (
  <View style={styles.screen}>
    <Text style={styles.screenText}>Notifications Screen</Text>
  </View>
);

const ProfileScreen = () => (
  <View style={styles.screen}>
    <Text style={styles.screenText}>Profile Screen</Text>
  </View>
);

const PersonalBottomNavigation = () => {
  return (
    <NavigationContainer>
      <Tab.Navigator
        screenOptions={({ route }) => ({
          tabBarIcon: ({ focused, color, size }) => {
            let iconName;

            switch (route.name) {
              case 'Home':
                iconName = focused ? 'home' : 'home-outline';
                break;
              case 'Search':
                iconName = focused ? 'search' : 'search-outline';
                break;
              case 'Favorites':
                iconName = focused ? 'heart' : 'heart-outline';
                break;
              case 'Notifications':
                iconName = focused ? 'notifications' : 'notifications-outline';
                break;
              case 'Profile':
                iconName = focused ? 'person' : 'person-outline';
                break;
              default:
                iconName = 'circle';
            }

            return <Icon name={iconName} size={size} color={color} />;
          },
          tabBarActiveTintColor: '#007AFF',
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
          component={HomeScreen}
          options={{
            tabBarLabel: 'Home',
          }}
        />
        <Tab.Screen 
          name="Smart Route" 
          component={SearchScreen}
          options={{
            tabBarLabel: 'Smart Route',
          }}
        />
        <Tab.Screen 
          name="Family" 
          component={FavoritesScreen}
          options={{
            tabBarLabel: 'Family',
          }}
        />
        <Tab.Screen 
          name="Reports" 
          component={NotificationsScreen}
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
    </NavigationContainer>
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