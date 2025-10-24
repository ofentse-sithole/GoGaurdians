import 'react-native-gesture-handler';
import { NavigationContainer } from "@react-navigation/native";
import { createStackNavigator } from "@react-navigation/stack";
import PersonalLogin from "./PersonalUse/Authentication/PersonalLogin";
import PersonalRegister from "./PersonalUse/Authentication/PersonalRegister";
import PersonalForgotPassword from "./PersonalUse/Authentication/PersonalForgotPassword";
import BusinessLogin from "./BusinessUse/Authentication/BusinessLogin";
import BusinessRegister from "./BusinessUse/Authentication/BusinessRegister";
import BusinessForgotPassword from "./BusinessUse/Authentication/BusinessForgotPassword";
import CommunitySafetyAlerts from "./components/CommunitySafetyAlerts";
import EmergencyButton from "./components/EmergencyButton";
import EmergencyContactList from "./components/EmergencyContactList";

const Stack = createStackNavigator();

const App = () => {
  return (
    <NavigationContainer>
      <Stack.Navigator initialRouteName="PersonalLogin">
        <Stack.Screen name="PersonalLogin" component={PersonalLogin} options={{ headerShown: false }} />
        <Stack.Screen name="PersonalRegister" component={PersonalRegister} options={{ headerShown: false }} />
        <Stack.Screen name="PersonalForgotPassword" component={PersonalForgotPassword} options={{ headerShown: false }} />
        <Stack.Screen name="BusinessLogin" component={BusinessLogin} options={{ headerShown: false }} />
        <Stack.Screen name="BusinessRegister" component={BusinessRegister} options={{ headerShown: false }} />
        <Stack.Screen name="BusinessForgotPassword" component={BusinessForgotPassword} options={{ headerShown: false }} />
        <Stack.Screen name="CommunitySafetyAlerts" component={CommunitySafetyAlerts} options={{ headerShown: false }} />
        <Stack.Screen name="EmergencyContacts" component={EmergencyContactList} options={{ headerShown: true, title: 'Emergency Contacts' }} />
      </Stack.Navigator>
      <EmergencyButton />
    </NavigationContainer>
  );
}

export default App;