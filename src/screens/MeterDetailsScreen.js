import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Button, Alert, ActivityIndicator, Linking } from 'react-native';
import axios from 'axios';
import { useRoute, useNavigation } from '@react-navigation/native'; // Add useNavigation
import { Card, Title, Paragraph } from 'react-native-paper';

const MeterDetailsScreen = () => {
  const { params } = useRoute();
  const { meter } = params;
  const navigation = useNavigation();  // Initialize useNavigation hook

  const [loading, setLoading] = useState(false);
  const [address, setAddress] = useState(null);

  // Use your existing Google Maps API key here
  const apiKey = 'AIzaSyD9uRKIODHV2It2j5ShPXswVU0uIEfNBPA';  // Make sure to replace this with your actual API key

  // Helper function to fetch the address using Google Maps Geocoding API
  const getAddress = async (latitude, longitude) => {
    const url = `https://maps.googleapis.com/maps/api/geocode/json?latlng=${latitude},${longitude}&key=${apiKey}`;
    
    try {
      const response = await axios.get(url);
      if (response.data.results.length > 0) {
        setAddress(response.data.results[0].formatted_address);
      } else {
        setAddress('Address not found');
      }
    } catch (error) {
      setAddress('Error fetching address');
      console.error(error);
    }
  };

  useEffect(() => {
    if (meter.latitude && meter.longitude) {
      getAddress(meter.latitude, meter.longitude);
    }
  }, [meter]);

  const handleOpenMap = () => {
    const url = `https://www.google.com/maps/dir/?api=1&destination=${meter.latitude},${meter.longitude}`;
    Linking.openURL(url).catch(err => Alert.alert('Error', 'Unable to open Google Maps'));
  };

  const handleNavigateToMap = () => {
    navigation.navigate('MetersMap');  // Navigate to MetersMapScreen using the correct route name
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator animating={true} size="large" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Card>
        <Card.Content>
          <Title>Meter Number: {meter.meter_number}</Title>
          <Paragraph>Account Number: {meter.account_number}</Paragraph>
          <Paragraph>Status: {meter.status}</Paragraph>

          {/* Show address if available */}
          <Paragraph>Location: {address ? address : 'Fetching location...'}</Paragraph>

          {/* Show coordinates if address not available */}
          <Paragraph>Coordinates: {meter.latitude}, {meter.longitude}</Paragraph>

          <Button title="Open Directions" onPress={handleOpenMap} />

          {/* Button to navigate to Meters Map */}
          <Button title="Go to Meters Map" onPress={handleNavigateToMap} />
        </Card.Content>
      </Card>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default MeterDetailsScreen;


