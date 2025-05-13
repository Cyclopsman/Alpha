import { createStackNavigator } from '@react-navigation/stack';
import { NavigationContainer } from '@react-navigation/native';
import LoginScreen from '../screens/LoginScreen';
import HomeScreen from '../screens/HomeScreen';
import MeterDetailsScreen from '../screens/MeterDetailsScreen';
import MetersMapScreen from '../screens/MetersMapScreen';
import SupervisorScreen from '../screens/SupervisorScreen';

const Stack = createStackNavigator();

export default function AppNavigator() {
  // Mock user role - in a real app, this would come from your auth context
  const isSupervisor = false; // Change to true to test supervisor flow

  return (
    <NavigationContainer>
      <Stack.Navigator initialRouteName="Login">
        <Stack.Screen 
          name="Login" 
          component={LoginScreen} 
          options={{ headerShown: false }}
        />
        
        {isSupervisor ? (
          // Supervisor Screens
          <>
            <Stack.Screen 
              name="Supervisor" 
              component={SupervisorScreen} 
              options={{ title: 'Supervisor Portal' }}
            />
          </>
        ) : (
          // Meter Reader Screens
          <>
            <Stack.Screen 
              name="Home" 
              component={HomeScreen} 
              options={{ title: 'Assigned Meters' }}
            />
            <Stack.Screen 
              name="MeterDetails" 
              component={MeterDetailsScreen} 
              options={{ title: 'Meter Details' }}
            />
            <Stack.Screen 
              name="MetersMap" 
              component={MetersMapScreen} 
              options={{ title: 'Meters Map' }}
            />
          </>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}