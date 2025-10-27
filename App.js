<<<<<<< HEAD
import 'react-native-gesture-handler';
import React from "react";
import { NavigationContainer } from "@react-navigation/native";
import { createStackNavigator } from "@react-navigation/stack";
import { SafeAreaProvider } from "react-native-safe-area-context";

=======
import React, { useEffect, useState } from "react";
import { NavigationContainer } from "@react-navigation/native";
import { createStackNavigator } from "@react-navigation/stack";
import { View, ActivityIndicator } from "react-native";
>>>>>>> b0e64e3679b7ce96eee49279dbc6acfe3335e152
import PersonalLogin from "./PersonalUse/Authentication/PersonalLogin";
import PersonalRegister from "./PersonalUse/Authentication/PersonalRegister";
import PersonalForgotPassword from "./PersonalUse/Authentication/PersonalForgotPassword";
import BusinessLogin from "./BusinessUse/Authentication/BusinessLogin";
import BusinessRegister from "./BusinessUse/Authentication/BusinessRegister";
import BusinessForgotPassword from "./BusinessUse/Authentication/BusinessForgotPassword";
import PersonalNavbar from "./PersonalUse/Components/PersonalNavbar";
import AISafetyAssistantScreen from "./PersonalUse/screens/AISafetyAssistantScreen";
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { auth } from "./firebaseConfig";
import { onAuthStateChanged } from "firebase/auth";


const Stack = createStackNavigator();

const App = () => {
  const [initializing, setInitializing] = useState(true);
  const [user, setUser] = useState(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (u) => {
      setUser(u);
      setInitializing(false);
    });
    return unsubscribe;
  }, []);

  if (initializing) {
    return (
      <SafeAreaProvider>
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: '#0F1419' }}>
          <ActivityIndicator size="large" color="#00D9FF" />
        </View>
      </SafeAreaProvider>
    );
  }

  const GatedPersonalApp = () => (
    <PersonalNavbar />
  );

  return (
    <SafeAreaProvider>
      <NavigationContainer>
<<<<<<< HEAD
        <Stack.Navigator initialRouteName="PersonalLogin">
          <Stack.Screen 
            name="PersonalLogin" 
            component={PersonalLogin} 
            options={{ headerShown: false }} 
          />
          <Stack.Screen 
            name="PersonalRegister" 
            component={PersonalRegister} 
            options={{ headerShown: false }} 
          />
          <Stack.Screen 
            name="PersonalForgotPassword" 
            component={PersonalForgotPassword} 
            options={{ headerShown: false }} 
          />
          <Stack.Screen 
            name="BusinessLogin" 
            component={BusinessLogin} 
            options={{ headerShown: false }} 
          />
          <Stack.Screen 
            name="BusinessRegister" 
            component={BusinessRegister} 
            options={{ headerShown: false }} 
          />
          <Stack.Screen 
            name="BusinessForgotPassword" 
            component={BusinessForgotPassword} 
            options={{ headerShown: false }} 
          />
          <Stack.Screen 
            name="CommunitySafetyAlerts" 
            component={CommunitySafetyAlerts} 
            options={{ headerShown: false }} 
          />
          <Stack.Screen 
            name="EmergencyContacts" 
            component={EmergencyContactList} 
            options={{ headerShown: true, title: 'Emergency Contacts' }} 
          />
        </Stack.Navigator>
        <EmergencyButton />
=======
        <Stack.Navigator screenOptions={{ headerShown: false }}>
          {user ? (
            <>
              <Stack.Screen name="PersonalApp" component={GatedPersonalApp} />
              <Stack.Screen name="AIAssistant" component={AISafetyAssistantScreen} />
            </>
          ) : (
            <>
              <Stack.Screen name="PersonalLogin" component={PersonalLogin} />
              <Stack.Screen name="PersonalRegister" component={PersonalRegister} />
              <Stack.Screen name="PersonalForgotPassword" component={PersonalForgotPassword} />
              <Stack.Screen name="BusinessLogin" component={BusinessLogin} />
              <Stack.Screen name="BusinessRegister" component={BusinessRegister} />
              <Stack.Screen name="BusinessForgotPassword" component={BusinessForgotPassword} />
            </>
          )}
        </Stack.Navigator>
>>>>>>> b0e64e3679b7ce96eee49279dbc6acfe3335e152
      </NavigationContainer>
    </SafeAreaProvider>
  );
};

export default App;
