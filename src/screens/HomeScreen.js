import React, { useState, useEffect } from 'react';
import { StyleSheet, View, Text, ScrollView, Alert } from 'react-native';
import { Card, Button } from 'react-native-paper';
import axios from 'axios';
import * as Location from 'expo-location';
import { useFocusEffect } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useNavigation } from '@react-navigation/native';
 

const HomeScreen = ({ navigation }) => {
  const [meters, setMeters] = useState([]);
  const [loading, setLoading] = useState(true);
  const [updatingMeter, setUpdatingMeter] = useState(null);

  const API_URL = 'http://172.20.10.14:5000/api/meters';

  const fetchMeters = async () => {
    try {
      setLoading(true);
      const token = await AsyncStorage.getItem('authToken');

      if (!token) throw new Error('No token found');

      const response = await axios.get(API_URL, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const fetchedMeters = response.data.data || [];
      const sortedMeters = sortMetersByProximity(fetchedMeters);
      setMeters(sortedMeters);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching meters:', error);
      setLoading(false);
      Alert.alert('Error', error.response?.data?.error || error.message || 'Failed to load meters');
    }
  };


  

useEffect(() => {
  const verifyToken = async () => {
    try {
      const token = await AsyncStorage.getItem('authToken');
      if (!token) {
        navigation.replace(routes.login); // redirect to login screen
      }
    } catch (err) {
      console.error('Auth check failed:', err);
      navigation.replace(routes.login);
    }
  };

    verifyToken();
  }, []);

  useEffect(() => {
    fetchMeters();
  }, []);

  const handleMeterPress = (meter) => {
    navigation.navigate('MeterDetails', { meter });
  };

  const markAsVisited = async (meter) => {
    try {
      const meterNumber = meter.meter_number;
      if (!meterNumber) {
        Alert.alert('Error', 'Missing meter number');
        return;
      }

      setUpdatingMeter(meterNumber);

      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission Denied', 'Location permission is required to mark meters as visited.');
        setUpdatingMeter(null);
        return;
      }

      const location = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.High });

      const token = await AsyncStorage.getItem('authToken');
      
      if (!token) throw new Error('No token found');

      const response = await axios.post(`${API_URL}/update-status`, {
        meter_number: meterNumber,
        status: 'Visited',
        reader_lat: location.coords.latitude,
        reader_lng: location.coords.longitude
      }, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      setMeters(meters.map(m =>
        m.meter_number === meterNumber ? {
          ...m,
          status: 'Visited',
          reader_location: {
            x: location.coords.latitude,
            y: location.coords.longitude
          },
          visited_timestamp: new Date().toISOString()
        } : m
      ));

      Alert.alert('Success', 'Meter marked as visited');
      setUpdatingMeter(null);
    } catch (error) {
      console.error('Error updating meter status:', error);
      Alert.alert('Error', error.response?.data?.error || error.message || 'Failed to update meter');
      setUpdatingMeter(null);
    }
  };

  const calculateDistance = (lat1, lon1, lat2, lon2) => {
    if (!lat1 || !lon1 || !lat2 || !lon2) return Infinity;
    const R = 6371e3;
    const φ1 = lat1 * Math.PI / 180;
    const φ2 = lat2 * Math.PI / 180;
    const Δφ = (lat2 - lat1) * Math.PI / 180;
    const Δλ = (lon2 - lon1) * Math.PI / 180;
    const a = Math.sin(Δφ/2) * Math.sin(Δφ/2) +
              Math.cos(φ1) * Math.cos(φ2) *
              Math.sin(Δλ/2) * Math.sin(Δλ/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
  };

  const isReaderCloseToMeter = (meter) => {
    if (!meter.reader_location || !meter.latitude || !meter.longitude) return null;
    let readerLat, readerLng;
    if (typeof meter.reader_location === 'string') {
      const [lat, lng] = meter.reader_location.split(',').map(coord => parseFloat(coord.trim()));
      readerLat = lat;
      readerLng = lng;
    } else {
      readerLat = meter.reader_location.x;
      readerLng = meter.reader_location.y;
    }
    const distance = calculateDistance(meter.latitude, meter.longitude, readerLat, readerLng);
    return distance <= 50;
  };

  const sortMetersByProximity = (metersToSort) => {
    if (!metersToSort || metersToSort.length <= 1) return metersToSort;
    const metersWithLocation = metersToSort.filter(m => m.latitude && m.longitude);
    const metersWithoutLocation = metersToSort.filter(m => !m.latitude || !m.longitude);
    if (metersWithLocation.length <= 1) return [...metersWithLocation, ...metersWithoutLocation];
    const sortedMeters = [metersWithLocation[0]];
    const remaining = metersWithLocation.slice(1);
    let currentMeter = sortedMeters[0];
    while (remaining.length > 0) {
      let closestIndex = 0;
      let minDistance = Infinity;
      for (let i = 0; i < remaining.length; i++) {
        const distance = calculateDistance(
          currentMeter.latitude, currentMeter.longitude,
          remaining[i].latitude, remaining[i].longitude
        );
        if (distance < minDistance) {
          minDistance = distance;
          closestIndex = i;
        }
      }
      const nextMeter = remaining.splice(closestIndex, 1)[0];
      sortedMeters.push(nextMeter);
      currentMeter = nextMeter;
    }
    return [...sortedMeters, ...metersWithoutLocation];
  };

  return (
    <View style={styles.container}>
      <ScrollView>
        {loading ? (
          <Text style={styles.message}>Loading meters...</Text>
        ) : meters.length > 0 ? (
          meters.map((meter, index) => (
            <Card 
              key={`${meter.meter_number}-${index}`}
              style={styles.card} 
              onPress={() => handleMeterPress(meter)}
            >
              <Card.Content>
                <Text style={styles.meterNumber}>Meter Number: {meter.meter_number}</Text>
                <Text>Account Number: {meter.account_number}</Text>
                <Text>Status: {meter.status || 'Unknown'}</Text>
                <Text>Location: Abuakwa district</Text>
                <Text style={styles.coordinates}>
                  Coordinates: {meter.latitude}, {meter.longitude}
                </Text>
                {meter.visited_timestamp && (
                  <Text style={styles.visitInfo}>
                    Visited: {new Date(meter.visited_timestamp).toLocaleString()}
                  </Text>
                )}
                {meter.status === 'Pending' && (
                  <Button
                    mode="contained"
                    style={styles.button}
                    loading={updatingMeter === meter.meter_number}
                    disabled={updatingMeter === meter.meter_number}
                    onPress={() => markAsVisited(meter)}
                  >
                    Mark as Visited
                  </Button>
                )}
              </Card.Content>
            </Card>
          ))
        ) : (
          <Text style={styles.message}>No meters found</Text>
        )}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 10,
    backgroundColor: '#f5f5f5',
  },
  card: {
    marginBottom: 15,
    borderRadius: 8,
    elevation: 2,
  },
  meterNumber: {
    fontWeight: 'bold',
    fontSize: 16,
    marginBottom: 5,
  },
  coordinates: {
    fontSize: 12,
    color: '#666',
    marginTop: 5,
  },
  visitInfo: {
    fontSize: 12,
    color: '#444',
    marginTop: 5,
    fontStyle: 'italic',
  },
  button: {
    marginTop: 10,
  },
  message: {
    textAlign: 'center',
    padding: 20,
    fontSize: 16,
  },
});

export default HomeScreen;
