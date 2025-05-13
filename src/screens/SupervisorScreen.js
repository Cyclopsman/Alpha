import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Alert, FlatList, ActivityIndicator, SafeAreaView, StatusBar, TouchableOpacity, Modal, TextInput, Platform } from 'react-native';
import { Card, Title, Paragraph, Button, Surface, Divider, Avatar, Badge, FAB, Portal, Dialog, Provider as PaperProvider } from 'react-native-paper';
import { MaterialIcons, Ionicons } from '@expo/vector-icons';
import axios from 'axios';
import * as DocumentPicker from 'expo-document-picker';
import * as FileSystem from 'expo-file-system';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Location from 'expo-location';

const SupervisorScreen = () => {
  const [meters, setMeters] = useState([]);
  const [readers, setReaders] = useState([]);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState(null);
  const [refreshing, setRefreshing] = useState(false);
  const [showReaders, setShowReaders] = useState(false);
  const [selectedReader, setSelectedReader] = useState(null);
  const [readerMeters, setReaderMeters] = useState([]);
  const [readerLocation, setReaderLocation] = useState(null);
  const [assignDialogVisible, setAssignDialogVisible] = useState(false);
  const [numberOfMetersToAssign, setNumberOfMetersToAssign] = useState('10');
  const [meterStats, setMeterStats] = useState({
    total: 0,
    assigned: 0,
    unassigned: 0,
    visited: 0
  });
  const [viewAllMeters, setViewAllMeters] = useState(true);
  const [clearDialogVisible, setClearDialogVisible] = useState(false);

  const API_URL = Platform.OS === 'web' ? 'http://localhost:5000/api/meters' : 'http://172.20.10.14:5000/api/meters';
  const STORAGE_KEY_METERS = 'meter_data';
  const STORAGE_KEY_READER_ASSIGNMENTS = 'reader_assignments';
  const STORAGE_KEY_AUTH_TOKEN = 'authToken';

  // Function to calculate distance between two coordinates in meters
  const calculateDistance = (lat1, lon1, lat2, lon2) => {
    if (!lat1 || !lon1 || !lat2 || !lon2) return Infinity;
    
    const R = 6371e3; // Earth's radius in meters
    const φ1 = lat1 * Math.PI / 180;
    const φ2 = lat2 * Math.PI / 180;
    const Δφ = (lat2 - lat1) * Math.PI / 180;
    const Δλ = (lon2 - lon1) * Math.PI / 180;

    const a = Math.sin(Δφ/2) * Math.sin(Δφ/2) +
              Math.cos(φ1) * Math.cos(φ2) *
              Math.sin(Δλ/2) * Math.sin(Δλ/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    
    return R * c; // Distance in meters
  };
  // Sort meters by proximity to each other
const sortMetersByProximity = (metersToSort) => {
  if (!metersToSort || metersToSort.length <= 1) return metersToSort;
  
  // Filter out meters without location data
  const metersWithLocation = metersToSort.filter(
    m => m.latitude && m.longitude
  );
  
  // Meters without location data
  const metersWithoutLocation = metersToSort.filter(
    m => !m.latitude || !m.longitude
  );
  
  if (metersWithLocation.length <= 1) {
    return [...metersWithLocation, ...metersWithoutLocation];
  }
  
  // Start with the first meter as reference
  const sortedMeters = [metersWithLocation[0]];
  const remaining = metersWithLocation.slice(1);
  
  let currentMeter = sortedMeters[0];
  
  // Keep finding the closest meter until all are sorted
  while (remaining.length > 0) {
    let closestIndex = 0;
    let minDistance = Infinity;
    
    // Find the closest meter to the current one
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
    
    // Add the closest meter to sorted list and remove from remaining
    const nextMeter = remaining.splice(closestIndex, 1)[0];
    sortedMeters.push(nextMeter);
    currentMeter = nextMeter;
  }
  
  // Add meters without location data at the end
  return [...sortedMeters, ...metersWithoutLocation];
};
  // Add this function to handle completely removing all meters
  const clearAllMeters = async () => {
    try {
      // Completely empty the meters array
      setMeters([]);
  
      // Reset meter stats
      setMeterStats({
        total: 0,
        assigned: 0,
        unassigned: 0,
        visited: 0
      });
  
      // Update reader stats to show no assigned meters
      const updatedReaders = readers.map(reader => ({
        ...reader,
        metersAssigned: 0,
        metersVisited: 0
      }));
      setReaders(updatedReaders);
  
      // If a reader was selected, clear their assigned meters too
      if (selectedReader) {
        setReaderMeters([]);
        // Update the selected reader's stats
        const updatedSelectedReader = updatedReaders.find(r => r.id === selectedReader.id);
        if (updatedSelectedReader) {
          setSelectedReader(updatedSelectedReader);
        }
      }
  
      // Fetch auth token for secure delete
      const token = await AsyncStorage.getItem(STORAGE_KEY_AUTH_TOKEN);
      if (!token) throw new Error("No auth token");
  
      // Clear data from backend with auth header
      await axios.delete(`${API_URL}/all`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
  
      // Clear all stored data
      await AsyncStorage.removeItem(STORAGE_KEY_METERS);
      await AsyncStorage.removeItem(STORAGE_KEY_READER_ASSIGNMENTS);
  
      Alert.alert(
        'Success',
        'All meters have been completely removed from the system.'
      );
  
      setClearDialogVisible(false);
    } catch (err) {
      console.error('Error clearing meters:', err);
      Alert.alert('Operation Failed', 'Could not remove all meters.');
    }
  };
  

// Update the clear dialog text to reflect complete removal
const renderClearDialog = () => (
  <Dialog
    visible={clearDialogVisible}
    onDismiss={() => setClearDialogVisible(false)}
  >
    <Dialog.Title>Remove All Meters</Dialog.Title>
    <Dialog.Content>
      <Paragraph>Are you sure you want to remove ALL meters from the system? This will delete all meter records completely.</Paragraph>
      <Paragraph style={{color: '#f44336', marginTop: 10, fontWeight: 'bold'}}>
        This action cannot be undone.
      </Paragraph>
    </Dialog.Content>
    <Dialog.Actions>
      <Button onPress={() => setClearDialogVisible(false)}>Cancel</Button>
      <Button onPress={clearAllMeters} color="#f44336">Remove All</Button>
    </Dialog.Actions>
  </Dialog>
);
  // Check and refresh auth token if needed
const getAuthToken = async () => {
  try {
    let token = await AsyncStorage.getItem(STORAGE_KEY_AUTH_TOKEN);
    
    // If token is missing or expired, attempt to get a new one
    if (!token) {
      console.log("No auth token found, attempting to login");
      // You might need to implement a silent login or redirect to login screen
      // This is a placeholder - implement according to your auth system
      
      // For testing purposes, you could set a default token
      // token = "your_default_test_token";
      // await AsyncStorage.setItem(STORAGE_KEY_AUTH_TOKEN, token);
    }
    
    return token;
  } catch (err) {
    console.error("Error retrieving auth token:", err);
    return null;
  }
};
// Function to determine if reader is close to meter
  // Function to determine if reader is close to meter
  const isReaderCloseToMeter = (meter) => {
    if (!readerLocation || !meter.latitude || !meter.longitude) return false;
  
    const distance = calculateDistance(
      meter.latitude,
      meter.longitude,
      readerLocation.latitude,
      readerLocation.longitude
    );
  
    return distance <= 50;
  };
  
  
  // Load saved data from AsyncStorage
  // Load saved data from AsyncStorage
  const loadSavedData = async () => {
    try {
      const savedMeters = await AsyncStorage.getItem(STORAGE_KEY_METERS);
      const savedAssignments = await AsyncStorage.getItem(STORAGE_KEY_READER_ASSIGNMENTS);
      
      if (savedMeters) {
        const parsedMeters = JSON.parse(savedMeters);
        // Sort meters by proximity
        const sortedMeters = sortMetersByProximity(parsedMeters);
        setMeters(sortedMeters);
        // Calculate meter statistics
        updateMeterStats(sortedMeters);
        // Calculate reader stats based on saved meter data
        updateReaderStats(sortedMeters);
      }
      
      // If a reader is selected, restore their meters
      if (selectedReader && savedAssignments) {
        const assignments = JSON.parse(savedAssignments);
        const readerAssignments = assignments[selectedReader.id] || [];
        
        // Match the reader's assignments with the meters
        if (savedMeters) {
          const parsedMeters = JSON.parse(savedMeters);
          const filteredMeters = parsedMeters.filter(meter => 
            readerAssignments.includes(meter.meter_number)
          );
          // Sort reader's meters by proximity
          const sortedReaderMeters = sortMetersByProximity(filteredMeters);
          setReaderMeters(sortedReaderMeters);
        }
      }
    } catch (err) {
      console.error('Error loading saved data:', err);
      setError('Failed to load saved data. Please refresh.');
    }
  };
  // Update meter statistics
  const updateMeterStats = (meterData) => {
    const stats = {
      total: meterData.length,
      assigned: 0,
      unassigned: 0,
      visited: 0
    };
    
    meterData.forEach(meter => {
      if (meter.reader_id) {
        stats.assigned++;
      } else {
        stats.unassigned++;
      }
      
      if (meter.status?.toLowerCase() === 'visited') {
        stats.visited++;
      }
    });
    
    setMeterStats(stats);
  };

  // Save current meter data and reader assignments to AsyncStorage
  const saveData = async (updatedMeters) => {
    try {
      const metersToSave = updatedMeters || meters;
      
      // Ensure we have data to save
      if (!metersToSave || metersToSave.length === 0) {
        console.log('No meters to save');
        return;
      }
      
      await AsyncStorage.setItem(STORAGE_KEY_METERS, JSON.stringify(metersToSave));
      console.log('Saved meters data to AsyncStorage', metersToSave.length);
      
      // Create a map of reader IDs to their assigned meter numbers
      const readerAssignments = {};
      metersToSave.forEach(meter => {
        if (meter.reader_id) {
          if (!readerAssignments[meter.reader_id]) {
            readerAssignments[meter.reader_id] = [];
          }
          readerAssignments[meter.reader_id].push(meter.meter_number);
        }
      });
      
      await AsyncStorage.setItem(STORAGE_KEY_READER_ASSIGNMENTS, JSON.stringify(readerAssignments));
      console.log('Saved reader assignments to AsyncStorage');
    } catch (err) {
      console.error('Error saving data:', err);
      Alert.alert('Error', 'Failed to save data locally. Some changes might not persist.');
    }
  };

  const fetchMeters = async () => {
    if (refreshing) return;
  
    setLoading(true);
    setError(null);
  
    try {
      const token = await AsyncStorage.getItem(STORAGE_KEY_AUTH_TOKEN);
      console.log("Retrieved token:", token);
      
      if (!token) throw new Error("Authentication token not available");
      
      const response = await axios.get("http://172.20.10.14:5000/api/meters", {
        headers: { Authorization: `Bearer ${token}` },
      });
      
      if (response.data && response.data.data) {  
        const meterData = response.data.data;
        
        
        const savedMetersStr = await AsyncStorage.getItem(STORAGE_KEY_METERS);
        const existingMeters = savedMetersStr ? JSON.parse(savedMetersStr) : [];
        
        // Create a map of existing meters by meter_number for quick lookup
        const existingMetersMap = {};
        existingMeters.forEach(meter => {
          existingMetersMap[meter.meter_number] = meter;
        });
        
        // Merge new meters with existing data
        const mergedMeterData = meterData.map(newMeter => {
          const existingMeter = existingMetersMap[newMeter.meter_number];
          if (existingMeter) {
            // Preserve reader assignments and status from existing data
            return {
              ...newMeter,
              reader_id: existingMeter.reader_id || newMeter.reader_id,
              status: existingMeter.status || newMeter.status,
              visited_timestamp: existingMeter.visited_timestamp || newMeter.visited_timestamp,
              reader_location: existingMeter.reader_location || newMeter.reader_location
            };
          }
          return newMeter;
        });
        
        // Also include any meters in our existing data that aren't in the new data
        // This ensures we don't lose old meters if the API returns only a subset
        meterData.forEach(newMeter => {
          existingMetersMap[newMeter.meter_number] = null; // Mark as processed
        });
        
        // Add meters that were in local storage but not in the API response
        Object.keys(existingMetersMap).forEach(meterNumber => {
          if (existingMetersMap[meterNumber]) {
            mergedMeterData.push(existingMetersMap[meterNumber]);
          }
        });
        
        // Sort meters by proximity
        const updatedMeterData = sortMetersByProximity(mergedMeterData);
        
        setMeters(updatedMeterData);
        
        // Calculate meter statistics
        updateMeterStats(updatedMeterData);
        
        // Save the combined data to persist between app sessions
        await saveData(updatedMeterData);
        
        // Calculate reader stats based on actual meter data
        updateReaderStats(updatedMeterData);
        
        // If a reader is selected, also update their specific meters
        if (selectedReader) {
          const filteredMeters = updatedMeterData.filter(meter => 
            meter.reader_id === selectedReader.id
          );
          // Sort reader's meters by proximity too
          const sortedReaderMeters = sortMetersByProximity(filteredMeters);
          setReaderMeters(sortedReaderMeters);
        }
      } else {
        // If API returns no data, try to load from local storage
        await loadSavedData();
      }
    } catch (err) {
      console.error('Error fetching meters:', err);
      setError('Failed to fetch data. Loading saved data...');
      // Try to load from local storage on API failure
      await loadSavedData();
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchMeters();
  }, []);
  useEffect(() => {
    (async () => {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') return;
  
      const location = await Location.getCurrentPositionAsync({});
      setReaderLocation(location.coords);
    })();
  }, []);

  // Update reader stats based on actual meter data
  const updateReaderStats = (meterData) => {
    // Group meters by reader
    const metersByReader = {};
    meterData.forEach(meter => {
      const readerId = meter.reader_id || null;
      
      if (readerId) {
        if (!metersByReader[readerId]) {
          metersByReader[readerId] = {
            assigned: 0,
            visited: 0
          };
        }
        
        metersByReader[readerId].assigned++;
        
        if (meter.status?.toLowerCase() === 'visited') {
          metersByReader[readerId].visited++;
        }
      }
    });
    
    
    // Add this function to handle completely removing all meters
    const clearAllMeters = async () => {
      try {
        // Completely empty the meters array
        setMeters([]);
        
        // Reset meter stats
        setMeterStats({
          total: 0,
          assigned: 0,
          unassigned: 0,
          visited: 0
        });
    
        // Update reader stats to show no assigned meters
        const updatedReaders = readers.map(reader => ({
          ...reader,
          metersAssigned: 0,
          metersVisited: 0
        }));
        setReaders(updatedReaders);
    
        if (selectedReader) {
          setReaderMeters([]);
          const updatedSelectedReader = updatedReaders.find(r => r.id === selectedReader.id);
          if (updatedSelectedReader) {
            setSelectedReader(updatedSelectedReader);
          }
        }
    
        // ✅ Delete all meters from backend
        const token = await getAuthToken();
        if (!token) {
          throw new Error("Authentication token not available");
        }
        await axios.delete(`${API_URL}/all`, {
          headers: {
            Authorization: `Bearer ${token}`,
           },
        });
    
        // ✅ Clear from AsyncStorage
        await AsyncStorage.removeItem(STORAGE_KEY_METERS);
        await AsyncStorage.removeItem(STORAGE_KEY_READER_ASSIGNMENTS);
    
        Alert.alert('Success', 'All meters have been completely removed from the system.');
        setClearDialogVisible(false);
      } catch (err) {
        console.error('Error clearing meters:', err);
        Alert.alert('Operation Failed', 'Could not remove all meters.');
      }
    };
    

// Update the clear dialog text to reflect complete removal
const renderClearDialog = () => (
  <Dialog
    visible={clearDialogVisible}
    onDismiss={() => setClearDialogVisible(false)}
  >
    <Dialog.Title>Remove All Meters</Dialog.Title>
    <Dialog.Content>
      <Paragraph>Are you sure you want to remove ALL meters from the system? This will delete all meter records completely.</Paragraph>
      <Paragraph style={{color: '#f44336', marginTop: 10, fontWeight: 'bold'}}>
        This action cannot be undone.
      </Paragraph>
    </Dialog.Content>
    <Dialog.Actions>
      <Button onPress={() => setClearDialogVisible(false)}>Cancel</Button>
      <Button onPress={clearAllMeters} color="#f44336">Remove All</Button>
    </Dialog.Actions>
  </Dialog>
);
    
    
    // Update mock reader data with actual stats
    const updatedReaders = [
      { id: 1, name: 'John Duah', department: 'Field Operations', metersAssigned: 0, metersVisited: 0 },
      { id: 2, name: 'Mary Asante', department: 'Technical Support', metersAssigned: 0, metersVisited: 0 },
      { id: 3, name: 'Robert Asare', department: 'Field Operations', metersAssigned: 0, metersVisited: 0 },
    ].map(reader => {
      const stats = metersByReader[reader.id] || { assigned: 0, visited: 0 };
      return {
        ...reader,
        metersAssigned: stats.assigned,
        metersVisited: stats.visited
      };
    });
    
    setReaders(updatedReaders);
    
    // Also update the selected reader if one is active
    if (selectedReader) {
      const updatedSelectedReader = updatedReaders.find(reader => reader.id === selectedReader.id);
      if (updatedSelectedReader) {
        setSelectedReader(updatedSelectedReader);
      }
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    fetchMeters();
  };

 useEffect(() => {
  loadSavedData();
  fetchMeters();
}, []);



  // Fetch meters for a specific reader
  // Fetch meters for a specific reader
  const fetchMetersByReader = (readerId) => {
    setLoading(true);
    
    try {
      // Filter meters to only show those assigned to this reader
      const filteredMeters = meters.filter(meter => meter.reader_id === readerId);
      // Sort reader's meters by proximity
      const sortedMeters = sortMetersByProximity(filteredMeters);
      setReaderMeters(sortedMeters);
    } catch (err) {
      console.error('Error filtering meters by reader:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    (async () => {
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        console.warn('Permission to access location was denied');
        return;
      }
  
      let location = await Location.getCurrentPositionAsync({});
      setReaderLocation(location.coords);
    })();
  }, []);
  
  const handleFileUpload = async (readerId) => {
    console.log("Starting file upload for reader ID:", readerId);
    if (uploading) return;
  
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      });
  
      if (result.canceled === false && result.assets && result.assets.length > 0) {
        const file = result.assets[0];
        const fileUri = file.uri;
  
        setUploading(true);
  
        const formData = new FormData();
        formData.append('file', {
          uri: fileUri,
          name: file.name || 'meters.xlsx',
          type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        });
  
        const uploadUrl = `${API_URL}/upload`;
  
        const token = await getAuthToken();
        if (!token) {
          throw new Error("Authentication token not available");
        }

        const response = await axios.post(uploadUrl, formData, {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'multipart/form-data',
          },
        });
      
  
        if (response.data?.success) {
          Alert.alert('Success', response.data.message || 'Meters uploaded successfully.');
          fetchMeters(); // Refresh after upload
        } else {
          Alert.alert('Upload Failed', response.data?.error || 'Upload failed.');
        }
      }
    } catch (err) {
      console.error('Error during file upload:', err.message);
      Alert.alert('Upload Failed', 'Could not upload the meter data file. Please try again.');
    } finally {
      setUploading(false);
    }
  };
  
  // Assign specific number of meters to a reader
  const assignMetersToReader = async () => {
    if (!selectedReader) return;
    
    try {
      const numMeters = parseInt(numberOfMetersToAssign);
      if (isNaN(numMeters) || numMeters <= 0) {
        Alert.alert('Invalid Number', 'Please enter a valid positive number of meters to assign.');
        return;
      }
      
      // Get unassigned meters
      const unassignedMeters = meters.filter(meter => !meter.reader_id);
      
      if (unassignedMeters.length === 0) {
        Alert.alert('No Unassigned Meters', 'There are no unassigned meters available for assignment.');
        return;
      }
      
      // Limit to the number requested or available
      const metersToAssign = unassignedMeters.slice(0, numMeters);
      
      // Update the meters with the reader's ID
      const updatedMeters = meters.map(meter => {
        const meterToAssign = metersToAssign.find(m => m.meter_number === meter.meter_number);
        if (meterToAssign) {
          return { 
            ...meter, 
            reader_id: selectedReader.id
            // No simulated location here — will be set when marked as visited
          };
        }
        return meter;
      });
      
      
      setMeters(updatedMeters);
      
      // Update reader-specific meters
      const updatedReaderMeters = [...readerMeters, ...metersToAssign.map(meter => ({
        ...meter,
        reader_id: selectedReader.id,
        reader_location: {
          x: meter.latitude ? (meter.latitude + (Math.random() > 0.5 ? 0.0001 : -0.0001)) : null,
          y: meter.longitude ? (meter.longitude + (Math.random() > 0.5 ? 0.0001 : -0.0001)) : null
        }
      }))];
      setReaderMeters(updatedReaderMeters);
      
      // Update meter statistics
      updateMeterStats(updatedMeters);
      
      // Update reader stats
      updateReaderStats(updatedMeters);
      
      // Save changes
      await saveData(updatedMeters);
      
      Alert.alert(
        'Assignment Successful', 
        `${metersToAssign.length} meters have been assigned to ${selectedReader.name}.`
      );
      
    } catch (err) {
      console.error('Error assigning meters:', err);
      Alert.alert('Assignment Failed', 'Could not assign meters to the reader.');
    } finally {
      setAssignDialogVisible(false);
    }
  };

  // Update meter status and persist changes
  const updateMeterStatus = async (meterNumber, newStatus) => {
    try {
      const meter = meters.find(m => m.meter_number === meterNumber);
      if (!meter) return;
  
      // If changing to visited status, update reader location to be close to meter
      // This simulates the reader being physically present at the meter
      const updatedMeter = { ...meter, status: newStatus };
      
      if (newStatus.toLowerCase() === 'visited') {
        // Update reader location to be very close to meter location when marking as visited
        // Small offset to simulate the reader standing right next to the meter
        updatedMeter.reader_location = {
          x: meter.latitude ? meter.latitude + 0.00001 : null, // Very small offset
          y: meter.longitude ? meter.longitude + 0.00001 : null // Very small offset
        };
        updatedMeter.visited_timestamp = new Date().toISOString();
      } else if (newStatus.toLowerCase() === 'pending') {
        // For pending status, simulate reader being far from meter
        updatedMeter.reader_location = {
          x: meter.latitude ? meter.latitude + 0.005 : null, // Larger offset (farther away)
          y: meter.longitude ? meter.longitude + 0.005 : null // Larger offset (farther away)
        };
      }
  
      const payload = {
        meter_number: meterNumber,
        status: newStatus,
        reader_lat: updatedMeter.reader_location?.x || meter.latitude,
        reader_lng: updatedMeter.reader_location?.y || meter.longitude,
      };
  
      try {
        // Try to update on server
        const token = await getAuthToken();
        if (!token) {
          throw new Error("Authentication token not available");
        }
        const response = await axios.post(`${API_URL}/update-status`, payload, {
        headers: { Authorization: `Bearer ${token}` },
        });
        
        
        if (response.data?.success) {
          // Use server response if successful
          updatedMeter.reader_location = response.data.updatedMeter.reader_location || updatedMeter.reader_location;
        }
      } catch (error) {
        console.log("Server update failed, using local update only:", error);
        // Continue with local update only
      }
  
      // Update locally regardless of server response
      const updatedMeters = meters.map(m => 
        m.meter_number === meterNumber ? updatedMeter : m
      );
      
      setMeters(updatedMeters);
      updateMeterStats(updatedMeters);
      updateReaderStats(updatedMeters);
      await saveData(updatedMeters);
  
      if (selectedReader) {
        const updatedReaderMeters = readerMeters.map(m => 
          m.meter_number === meterNumber ? updatedMeter : m
        );
        setReaderMeters(updatedReaderMeters);
      }
    } catch (err) {
      console.error('Error updating meter status:', err);
      Alert.alert('Update Failed', 'Could not update meter status.');
    }
  };

  const getStatusColor = (status) => {
    switch(status?.toLowerCase()) {
      case 'visited':
        return '#4CAF50';
      case 'pending':
        return '#FFC107';
      case 'issue':
        return '#F44336';
      default:
        return '#9E9E9E';
    }
  };

  const renderMeter = ({ item }) => {
    // Check proximity
    const isClose = isReaderCloseToMeter(item);
    
    return (
      <Surface style={styles.surface}>
        <Card style={styles.card}>
          <Card.Content style={styles.cardContent}>
            <View style={styles.cardHeader}>
              <Avatar.Icon 
                size={40} 
                icon="gauge" 
                backgroundColor="#e0e0e0" 
                color="#424242" 
              />
              <View style={styles.meterInfo}>
                <Title style={styles.meterTitle}>Meter #{item.meter_number}</Title>
                <Paragraph style={styles.accountNumber}>Account: {item.account_number}</Paragraph>
              </View>
              {/* Add flag indicator for proximity */}
              {isClose !== null && item.reader_id && (
                <MaterialIcons 
                  name="flag" 
                  size={20} 
                  color={isClose ? "#4CAF50" : "#F44336"}
                  style={styles.flagIcon}
                />
              )}
              <TouchableOpacity 
                style={[styles.statusBadge, {backgroundColor: getStatusColor(item.status)}]}
                onPress={() => {
                  // Simple status toggle feature - in a real app, you'd have a dropdown menu
                  const currentStatus = item.status?.toLowerCase() || 'unknown';
                  const newStatus = currentStatus === 'visited' ? 'pending' : 'visited';
                  updateMeterStatus(item.meter_number, newStatus);
                }}
              >
                <Text style={styles.statusText}>{item.status || 'Unknown'}</Text>
              </TouchableOpacity>
            </View>

            <Divider style={styles.divider} />

            <View style={styles.detailsContainer}>
              {item.district && (
                <View style={styles.detailItem}>
                  <MaterialIcons name="business" size={16} color="#616161" />
                  <Text style={styles.detailText}>{item.district}</Text>
                </View>
              )}
              {item.reader_id && (
                <View style={styles.detailItem}>
                  <MaterialIcons name="person" size={16} color="#3f51b5" />
                  <Text style={styles.detailText}>
                    Assigned to Reader #{item.reader_id}
                  </Text>
                </View>
              )}
              {item.last_updated && (
                <View style={styles.detailItem}>
                  <MaterialIcons name="update" size={16} color="#616161" />
                  <Text style={styles.detailText}>
                    Last updated: {new Date(item.last_updated).toLocaleString()}
                  </Text>
                </View>
              )}
              {item.visited_timestamp && (
                <View style={styles.detailItem}>
                  <MaterialIcons name="event-available" size={16} color="#4CAF50" />
                  <Text style={styles.detailText}>
                    Visited: {new Date(item.visited_timestamp).toLocaleString()}
                  </Text>
                </View>
              )}
              {(item.longitude && item.latitude) ? (
                <View style={styles.detailItem}>
                  <MaterialIcons name="location-on" size={16} color="#616161" />
                  <Text style={styles.detailText}>
                    Position: {item.latitude.toFixed(6)}, {item.longitude.toFixed(6)}
                  </Text>
                </View>
              ) : null}
              {item.reader_location && (
                <View style={styles.detailItem}>
                  <MaterialIcons name="person-pin-circle" size={16} color="#3f51b5" />
                  <Text style={styles.detailText}>
                    Reader location: {typeof item.reader_location === 'string' 
                      ? item.reader_location 
                      : `${item.reader_location.x.toFixed(6)}, ${item.reader_location.y.toFixed(6)}`}
                  </Text>
                </View>
              )}
              {/* Display proximity status text */}
              {isClose !== null && item.reader_id && (
                <View style={styles.detailItem}>
                  <MaterialIcons 
                    name={isClose ? "check-circle" : "cancel"} 
                    size={16} 
                    color={isClose ? "#4CAF50" : "#F44336"} 
                  />
                  <Text style={[styles.detailText, {color: isClose ? "#4CAF50" : "#F44336"}]}>
                    Reader is {isClose ? 'close to' : 'far from'} meter
                  </Text>
                </View>
              )}
            </View>
          </Card.Content>
        </Card>
      </Surface>
    );
  };

  const renderReader = ({ item }) => (
    <TouchableOpacity 
      onPress={() => {
        setSelectedReader(item);
        fetchMetersByReader(item.id);
        setViewAllMeters(false);
      }}
      style={styles.readerCardContainer}
    >
      <Surface style={styles.readerSurface}>
        <Card style={styles.readerCard}>
          <Card.Content>
            <View style={styles.readerCardHeader}>
              <Avatar.Text 
                size={50} 
                label={item.name.split(' ').map(n => n[0]).join('')} 
                backgroundColor="#3f51b5" 
              />
              <View style={styles.readerInfo}>
                <Title style={styles.readerName}>{item.name}</Title>
                <Paragraph style={styles.readerDepartment}>{item.department}</Paragraph>
              </View>
            </View>
            
            <Divider style={styles.divider} />
            
            <View style={styles.readerStats}>
              <View style={styles.statItem}>
                <Text style={styles.statNumber}>{item.metersAssigned}</Text>
                <Text style={styles.statLabel}>Assigned</Text>
              </View>
              <View style={styles.statDivider} />
              <View style={styles.statItem}>
                <Text style={styles.statNumber}>{item.metersVisited}</Text>
                <Text style={styles.statLabel}>Visited</Text>
              </View>
              <View style={styles.statDivider} />
              <View style={styles.statItem}>
                <Text style={styles.statNumber}>
                  {item.metersAssigned > 0 
                    ? Math.round((item.metersVisited / item.metersAssigned) * 100)
                    : 0}%
                </Text>
                <Text style={styles.statLabel}>Completion</Text>
              </View>
            </View>
          </Card.Content>
        </Card>
      </Surface>
    </TouchableOpacity>
  );

  const renderEmptyList = () => (
    <View style={styles.emptyContainer}>
      <MaterialIcons name="error-outline" size={64} color="#9e9e9e" />
      <Text style={styles.emptyText}>No meters available</Text>
      <Text style={styles.emptySubText}>Check network connection or assign meters to readers</Text>
    </View>
  );

  const renderAssignDialog = () => (
    <Dialog
      visible={assignDialogVisible}
      onDismiss={() => setAssignDialogVisible(false)}
    >
      <Dialog.Title>Assign Meters to {selectedReader?.name}</Dialog.Title>
      <Dialog.Content>
        <Paragraph>Enter the number of meters to assign:</Paragraph>
        <TextInput
          style={styles.dialogInput}
          keyboardType="numeric"
          value={numberOfMetersToAssign}
          onChangeText={setNumberOfMetersToAssign}
        />
        <Paragraph style={styles.dialogInfo}>
          Available unassigned meters: {meterStats.unassigned}
        </Paragraph>
      </Dialog.Content>
      <Dialog.Actions>
        <Button onPress={() => setAssignDialogVisible(false)}>Cancel</Button>
        <Button onPress={assignMetersToReader} mode="contained">Assign</Button>
      </Dialog.Actions>
    </Dialog>
  );

  const renderReaderDetail = () => (
    <View style={styles.readerDetailContainer}>
      <View style={styles.readerDetailHeader}>
        <TouchableOpacity 
          style={styles.backButton} 
          onPress={() => {
            setSelectedReader(null);
            setReaderMeters([]);
            setViewAllMeters(true);
          }}
        >
          <MaterialIcons name="arrow-back" size={24} color="#3f51b5" />
        </TouchableOpacity>
        <View>
          <Title style={styles.readerDetailName}>{selectedReader.name}</Title>
          <Paragraph style={styles.readerDetailDepartment}>{selectedReader.department}</Paragraph>
        </View>
      </View>

      <View style={styles.readerDetailStats}>
        <Surface style={styles.statCard}>
          <Text style={styles.statCardNumber}>{selectedReader.metersAssigned}</Text>
          <Text style={styles.statCardLabel}>Assigned</Text>
        </Surface>
        <Surface style={styles.statCard}>
          <Text style={styles.statCardNumber}>{selectedReader.metersAssigned}</Text>
          <Text style={styles.statCardLabel}>Assigned</Text>
        </Surface>
        <Surface style={styles.statCard}>
          <Text style={styles.statCardNumber}>{selectedReader.metersVisited}</Text>
          <Text style={styles.statCardLabel}>Visited</Text>
        </Surface>
        <Surface style={styles.statCard}>
          <Text style={styles.statCardNumber}>
            {selectedReader.metersAssigned > 0 
              ? Math.round((selectedReader.metersVisited / selectedReader.metersAssigned) * 100)
              : 0}%
          </Text>
          <Text style={styles.statCardLabel}>Completion</Text>
        </Surface>
      </View>

      <View style={styles.readerActionButtons}>
        <Button 
          mode="contained" 
          style={styles.actionButton}
          icon="file-upload"
          onPress={() => handleFileUpload(selectedReader.id)}
          loading={uploading}
          disabled={uploading}
        >
          Upload Meters
        </Button>
        <Button 
          mode="outlined" 
          style={styles.actionButton}
          icon="account-plus"
          onPress={() => setAssignDialogVisible(true)}
        >
          Assign Meters
        </Button>
      </View>

      <Title style={styles.sectionTitle}>Assigned Meters</Title>
      
      <FlatList
        data={readerMeters}
        renderItem={renderMeter}
        keyExtractor={(item) => item.meter_number.toString()}
        contentContainerStyle={styles.listContainer}
        ListEmptyComponent={renderEmptyList}
        refreshing={refreshing}
        onRefresh={onRefresh}
      />
    </View>
  );

  return (
    <PaperProvider>
      <Portal>
        {renderAssignDialog()}
        {renderClearDialog()}
      </Portal> 
      
      <SafeAreaView style={styles.container}>
        <StatusBar backgroundColor="#3f51b5" barStyle="light-content" />
        
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Meter Management Dashboard</Text>
        </View>
        
        <View style={styles.statsRow}>
          <Surface style={styles.overallStatCard}>
            <Text style={styles.statCardNumber}>{meterStats.total}</Text>
            <Text style={styles.statCardLabel}>Total Meters</Text>
          </Surface>
          <Surface style={styles.overallStatCard}>
            <Text style={styles.statCardNumber}>{meterStats.assigned}</Text>
            <Text style={styles.statCardLabel}>Assigned</Text>
          </Surface>
          <Surface style={styles.overallStatCard}>
            <Text style={styles.statCardNumber}>{meterStats.visited}</Text>
            <Text style={styles.statCardLabel}>Visited</Text>
          </Surface>
        </View>
        
        <View style={styles.tabContainer}>
          <TouchableOpacity 
            style={[styles.tab, viewAllMeters ? styles.activeTab : null]}
            onPress={() => {
              setSelectedReader(null);
              setReaderMeters([]);
              setViewAllMeters(true);
            }}
          >
            <MaterialIcons name="list" size={20} color={viewAllMeters ? "#3f51b5" : "#757575"} />
            <Text style={[styles.tabText, viewAllMeters ? styles.activeTabText : null]}>Meters</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.tab, !viewAllMeters && !selectedReader ? styles.activeTab : null]}
            onPress={() => {
              setSelectedReader(null);
              setReaderMeters([]);
              setViewAllMeters(false);
              setShowReaders(true);
            }}
          >
            <MaterialIcons name="people" size={20} color={!viewAllMeters && !selectedReader ? "#3f51b5" : "#757575"} />
            <Text style={[styles.tabText, !viewAllMeters && !selectedReader ? styles.activeTabText : null]}>Readers</Text>
          </TouchableOpacity>
        </View>
        
        {loading && !refreshing ? (
          <View style={styles.loaderContainer}>
            <ActivityIndicator size="large" color="#3f51b5" />
            <Text style={styles.loaderText}>Loading meter data...</Text>
          </View>
        ) : error ? (
          <View style={styles.errorContainer}>
            <MaterialIcons name="error-outline" size={64} color="#f44336" />
            <Text style={styles.errorText}>{error}</Text>
            <Button mode="contained" onPress={fetchMeters} style={styles.retryButton}>
              Retry
            </Button>
          </View>
        ) : selectedReader ? (
          renderReaderDetail()
        ) : viewAllMeters ? (
          <FlatList
            data={meters}
            renderItem={renderMeter}
            keyExtractor={(item) => item.meter_number.toString()}
            contentContainerStyle={styles.listContainer}
            ListEmptyComponent={renderEmptyList}
            refreshing={refreshing}
            onRefresh={onRefresh}
          />
        ) : (
          <FlatList
            data={readers}
            renderItem={renderReader}
            keyExtractor={(item) => item.id.toString()}
            contentContainerStyle={styles.readersListContainer}
            ListEmptyComponent={renderEmptyList}
            refreshing={refreshing}
            onRefresh={onRefresh}
          />
        )}
        
        <FAB
        style={styles.fab}
        icon="plus"
        onPress={() => handleFileUpload()}
        disabled={uploading}
      />
      <FAB
        style={styles.fabLeft}
        icon="trash-can-outline"
        color="#fff"
        small
        onPress={() => setClearDialogVisible(true)}
      />
    </SafeAreaView>
  </PaperProvider>
);
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    backgroundColor: '#3f51b5',
    paddingVertical: 16,
    paddingHorizontal: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 2,
  },
  headerTitle: {
    color: 'white',
    fontSize: 20,
    fontWeight: 'bold',
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  overallStatCard: {
    flex: 1,
    marginHorizontal: 4,
    padding: 12,
    elevation: 2,
    alignItems: 'center',
    borderRadius: 8,
  },
  statCardNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#3f51b5',
  },
  statCardLabel: {
    fontSize: 12,
    color: '#757575',
    marginTop: 4,
  },
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: 'white',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
    elevation: 1,
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
  },
  activeTab: {
    borderBottomWidth: 2,
    borderBottomColor: '#3f51b5',
  },
  tabText: {
    marginLeft: 8,
    color: '#757575',
    fontWeight: '500',
  },
  activeTabText: {
    color: '#3f51b5',
  },
  loaderContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loaderText: {
    marginTop: 12,
    color: '#757575',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorText: {
    marginTop: 12,
    color: '#f44336',
    textAlign: 'center',
    marginBottom: 16,
  },
  retryButton: {
    marginTop: 16,
  },
  listContainer: {
    padding: 8,
  },
  readersListContainer: {
    padding: 8,
  },
  surface: {
    marginVertical: 4,
    borderRadius: 8,
    elevation: 1,
  },
  card: {
    borderRadius: 8,
  },
  cardContent: {
    padding: 8,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  meterInfo: {
    flex: 1,
    marginLeft: 12,
  },
  meterTitle: {
    fontSize: 16,
    marginBottom: 0,
  },
  accountNumber: {
    fontSize: 12,
    color: '#757575',
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    color: 'white',
    fontSize: 12,
    fontWeight: 'bold',
    textTransform: 'uppercase',
  },
  divider: {
    marginVertical: 8,
  },
  detailsContainer: {
    paddingVertical: 4,
  },
  detailItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  detailText: {
    fontSize: 12,
    color: '#424242',
    marginLeft: 8,
  },
  readerCardContainer: {
    marginVertical: 8,
  },
  readerSurface: {
    borderRadius: 8,
    elevation: 2,
  },
  readerCard: {
    borderRadius: 8,
  },
  readerCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  readerInfo: {
    marginLeft: 16,
    flex: 1,
  },
  readerName: {
    fontSize: 18,
    marginBottom: 0,
  },
  readerDepartment: {
    fontSize: 14,
    color: '#757575',
  },
  readerStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: 8,
    marginTop: 8,
  },
  statItem: {
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#3f51b5',
  },
  statLabel: {
    fontSize: 12,
    color: '#757575',
    marginTop: 2,
  },
  statDivider: {
    width: 1,
    backgroundColor: '#e0e0e0',
  },
  fab: {
    position: 'absolute',
    margin: 16,
    right: 0,
    bottom: 0,
    backgroundColor: '#3f51b5',
  },
  emptyContainer: {
    padding: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyText: {
    fontSize: 18,
    color: '#9e9e9e',
    marginTop: 16,
    fontWeight: '500',
  },
  emptySubText: {
    fontSize: 14,
    color: '#bdbdbd',
    marginTop: 8,
    textAlign: 'center',
  },
  dialogInput: {
    marginVertical: 8,
    backgroundColor: '#f5f5f5',
    borderRadius: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  dialogInfo: {
    fontSize: 12,
    color: '#757575',
    marginTop: 8,
  },
  readerDetailContainer: {
    flex: 1,
  },
  readerDetailHeader: {
    backgroundColor: 'white',
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  backButton: {
    marginRight: 16,
  },
  readerDetailName: {
    fontSize: 20,
    marginBottom: 0,
  },
  readerDetailDepartment: {
    fontSize: 14,
    color: '#757575',
  },
  readerDetailStats: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 16,
  },
  statCard: {
    flex: 1,
    marginHorizontal: 4,
    padding: 12,
    alignItems: 'center',
    elevation: 2,
    borderRadius: 8,
  },
  readerActionButtons: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  actionButton: {
    flex: 1,
    marginHorizontal: 4,
  },
  sectionTitle: {
    fontSize: 18,
    marginHorizontal: 16,
    marginTop: 8,
    marginBottom: 4,
  },
  flagIcon: {
    marginRight: 8,
  },
    fab: {
    position: 'absolute',
    margin: 16,
    right: 0,
    bottom: 0,
    backgroundColor: '#3f51b5',
  },
  fabLeft: {
    position: 'absolute',
    margin: 16,
    left: 0,
    bottom: 0,
    backgroundColor: '#f44336',
  },
  flagIcon: {
    marginRight: 8,
  }
});

export default SupervisorScreen;