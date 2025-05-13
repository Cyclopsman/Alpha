// src/navigation/AppNavigator.js
import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { NavigationContainer } from '@react-navigation/native';
import { Platform } from 'react-native';

import LoginScreen from '../screens/LoginScreen';
import SupervisorScreen from '../screens/SupervisorScreen';

import HomeScreen from '../screens/HomeScreen';
import MetersMapScreen from '../screens/MetersMapScreen';
import MeterDetailsScreen from '../screens/MeterDetailsScreen';

import { routes } from './routes';

const Stack = createNativeStackNavigator();

export default function AppNavigator() {
  return (
    <NavigationContainer>
      <Stack.Navigator initialRouteName={routes.login}>
        <Stack.Screen name={routes.login} component={LoginScreen} />
        <Stack.Screen name={routes.supervisor} component={SupervisorScreen} />
        
        {Platform.OS !== 'web' && (
          <>
            <Stack.Screen name={routes.home} component={HomeScreen} />
            <Stack.Screen name={routes.metersMap} component={MetersMapScreen} />
            <Stack.Screen name={routes.meterDetailsScreen} component={MeterDetailsScreen} />
          </>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}
