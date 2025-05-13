import React, { useState } from 'react';
import { View, StyleSheet, Alert, Image } from 'react-native';
import { TextInput, Button, Title, ActivityIndicator, Paragraph, Switch } from 'react-native-paper';
import ecgLogo from '../../assets/images/ecg-logo.png';
import { routes } from '../navigation/routes';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useNavigation } from '@react-navigation/native';


const LoginScreen = ({ navigation }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [isSupervisor, setIsSupervisor] = useState(false);

  const handleLogin = async () => {
    if (!username || !password) {
      Alert.alert('Error', 'Please enter both username and password');
      return;
    }
  
    setLoading(true);
  
    try {
      const response = await fetch('http://172.20.10.14:5000/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      });
  
      const result = await response.json();
  
      if (!response.ok) {
        throw new Error(result.error || 'Login failed');
      }
  
      const { user, token } = result;
  
      if (!token || !user) {
        throw new Error('Invalid response from server');
      }
  
      // ✅ Store token and user in AsyncStorage
      await AsyncStorage.setItem('authToken', token);
      await AsyncStorage.setItem('user', JSON.stringify(user));
  
      console.log('Token and user stored successfully:', token);
  
      // ✅ Supervisor role validation
      if (isSupervisor && user.role !== 'supervisor') {
        Alert.alert('Access Denied', 'You are not authorized as a supervisor');
        return;
      }
  
      // ✅ Navigate based on role
      if (user.role === 'supervisor') {
        navigation.replace(routes.supervisor); // existing supervisor screen
      } else {
        navigation.replace(routes.home); // this routes to HomeScreen.js
      }
    } catch (error) {
      Alert.alert('Login Failed', error.message);
      console.error('Login error:', error);
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <View style={styles.container}>
      <Image source={ecgLogo} style={styles.logo} resizeMode="contain" />
      <Title style={styles.title}>Meter Reader App</Title>

      <TextInput
        label="Username"
        style={styles.input}
        value={username}
        onChangeText={setUsername}
        autoCapitalize="none"
      />

      <TextInput
        label="Password"
        style={styles.input}
        secureTextEntry
        value={password}
        onChangeText={setPassword}
      />

      <View style={styles.switchContainer}>
        <Paragraph>Supervisor Mode</Paragraph>
        <Switch value={isSupervisor} onValueChange={() => setIsSupervisor(!isSupervisor)} />
      </View>

      {loading ? (
        <ActivityIndicator animating={true} />
      ) : (
        <Button mode="contained" onPress={handleLogin} style={styles.button}>
          Login
        </Button>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    padding: 20,
  },
  logo: {
    width: 150,
    height: 150,
    alignSelf: 'center',
    marginBottom: 30,
  },
  title: {
    textAlign: 'center',
    marginBottom: 20,
    fontSize: 24,
  },
  input: {
    marginBottom: 15,
  },
  switchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 15,
    justifyContent: 'space-between',
  },
  button: {
    marginTop: 10,
    paddingVertical: 5,
  },
});

export default LoginScreen;
