import React, { useState, useCallback } from 'react';
import { Linking, StyleSheet, View, Alert } from 'react-native';
import MapView, { Marker, Callout } from 'react-native-maps';
import { Button, Card, Paragraph, Title, ActivityIndicator } from 'react-native-paper';
import axios from 'axios';
import { useFocusEffect } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';


const MetersMapScreen = ({ navigation }) => {
  const [meters, setMeters] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const API_URL = 'http://172.20.10.14:5000/api/meters';

  const isValidCoordinate = (coord) =>
    coord !== undefined && coord !== null && !isNaN(coord);

  const fetchMeters = useCallback(async () => {
    try {
      setLoading(true);
  
      
      const token = await AsyncStorage.getItem('authToken');
      if (!token) throw new Error('No token found');
  
      
      const response = await axios.get(API_URL, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
  
      let metersArray = [];
  
      if (Array.isArray(response.data)) {
        metersArray = response.data;
      } else if (Array.isArray(response.data.data)) {
        metersArray = response.data.data;
      } else if (response.data.meters && Array.isArray(response.data.meters)) {
        metersArray = response.data.meters;
      } else {
        throw new Error('Unexpected data format');
      }
  
      const validMeters = metersArray.filter(
        (m) => isValidCoordinate(m.latitude) && isValidCoordinate(m.longitude)
      );
  
      setMeters(validMeters);
      setError(null);
    } catch (err) {
      setError(err.message || 'Error fetching meters');
    } finally {
      setLoading(false);
    }
  }, []);
  useFocusEffect(
    useCallback(() => {
      fetchMeters();
    }, [fetchMeters])
  );

  const updateMeterStatus = useCallback(async (meterId, newStatus) => {
    try {
      await axios.patch(`${API_URL}/${meterId}`, { status: newStatus });
      setMeters((prev) =>
        prev.map((m) => (m.id === meterId ? { ...m, status: newStatus } : m))
      );
      Alert.alert('Success', `Meter marked as ${newStatus}`);
    } catch (err) {
      Alert.alert('Error', 'Failed to update meter status');
    }
  }, []);

  const handleMarkAsVisited = useCallback(
    (id) => updateMeterStatus(id, 'Visited'),
    [updateMeterStatus]
  );

  const openDirections = useCallback((lat, lng) => {
    if (!isValidCoordinate(lat) || !isValidCoordinate(lng)) {
      Alert.alert('Error', 'Invalid coordinates');
      return;
    }
    const url = `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`;
    Linking.openURL(url).catch(() => Alert.alert('Error', 'Cannot open maps'));
  }, []);

  const getPinColor = (status) => {
    switch (status) {
      case 'Pending': return 'red';
      case 'Assigned': return 'orange';
      case 'Visited': return 'green';
      default: return 'blue';
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.errorContainer}>
        <Title>Error loading meters</Title>
        <Paragraph>{error}</Paragraph>
        <Button mode="contained" onPress={fetchMeters}>Retry</Button>
      </View>
    );
  }

  const initialRegion = {
    latitude: meters[0]?.latitude || 7.9,
    longitude: meters[0]?.longitude || -1.0,
    latitudeDelta: 0.08,
    longitudeDelta: 0.08,
  };

  return (
    <MapView style={styles.map} initialRegion={initialRegion}>
      {meters.map((meter) => (
        <Marker
          key={meter.id}
          coordinate={{
            latitude: meter.latitude,
            longitude: meter.longitude,
          }}
          pinColor={getPinColor(meter.status)}
        >
          <Callout>
            <Card>
              <Card.Content>
                <Title>Meter: {meter.meter_number}</Title>
                <Paragraph>Account: {meter.account_number}</Paragraph>
                <Paragraph>Status: {meter.status}</Paragraph>
                <Button onPress={() => openDirections(meter.latitude, meter.longitude)}>
                  Get Directions
                </Button>
                <Button onPress={() => handleMarkAsVisited(meter.id)}>
                  Mark as Visited
                </Button>
              </Card.Content>
            </Card>
          </Callout>
        </Marker>
      ))}
    </MapView>
  );
};

const styles = StyleSheet.create({
  map: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
});

export default MetersMapScreen;
