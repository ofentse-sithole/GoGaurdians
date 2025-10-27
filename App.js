import 'react-native-gesture-handler';
import React from "react";
import { NavigationContainer } from "@react-navigation/native";
import { createStackNavigator } from "@react-navigation/stack";
import { SafeAreaProvider } from "react-native-safe-area-context";

import PersonalLogin from "./PersonalUse/Authentication/PersonalLogin";
import PersonalRegister from "./PersonalUse/Authentication/PersonalRegister";
import PersonalForgotPassword from "./PersonalUse/Authentication/PersonalForgotPassword";
import GatedPersonalApp from "./PersonalUse/screens/Homepage";
import AISafetyAssistantScreen from "./PersonalUse/screens/AISafetyAssistantScreen";

const Stack = createStackNavigator();

const App = () => {
  return (
    <SafeAreaProvider>
      <NavigationContainer>
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
            name="PersonalApp" 
            component={GatedPersonalApp} 
            options={{ headerShown: false }} 
          />
          <Stack.Screen 
            name="AIAssistant" 
            component={AISafetyAssistantScreen} 
            options={{ headerShown: false }} 
          />
        </Stack.Navigator>
      </NavigationContainer>
    </SafeAreaProvider>
  );
};

export default App;
