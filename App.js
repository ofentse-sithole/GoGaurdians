import { NavigationContainer } from "@react-navigation/native";
import { createStackNavigator } from "@react-navigation/stack";
import PersonalLogin from "./PersonalUse/Authentication/PersonalLogin";
import PersonalRegister from "./PersonalUse/Authentication/PersonalRegister";
import PersonalForgotPassword from "./PersonalUse/Authentication/PersonalForgotPassword";
import BusinessLogin from "./BusinessUse/Authentication/BusinessLogin";
import BusinessRegister from "./BusinessUse/Authentication/BusinessRegister";
import BusinessForgotPassword from "./BusinessUse/Authentication/BusinessForgotPassword";

const Stack = createStackNavigator();

const App = () => {
  return (
    <NavigationContainer>
      <Stack.Navigator initialRouteName="PersonalLogin">
        <Stack.Screen name="PersonalLogin" component={PersonalLogin} />
        <Stack.Screen name="PersonalRegister" component={PersonalRegister} />
        <Stack.Screen name="PersonalForgotPassword" component={PersonalForgotPassword} />
        <Stack.Screen name="BusinessLogin" component={BusinessLogin} />
        <Stack.Screen name="BusinessRegister" component={BusinessRegister} />
        <Stack.Screen name="BusinessForgotPassword" component={BusinessForgotPassword} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}

export default App;