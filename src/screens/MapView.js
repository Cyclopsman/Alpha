// Create a file called MapView.js
import React from 'react';
import { Platform, View, Text } from 'react-native';

let MapViewComponent = () => (
  <View style={{height: 200, justifyContent: 'center', alignItems: 'center', backgroundColor: '#e0e0e0'}}>
    <Text>Maps not available on this platform</Text>
  </View>
);

// Only import the native maps on native platforms
if (Platform.OS !== 'web') {
  // Dynamic import to avoid the web bundler trying to load the native module
  const { MapView: NativeMapView } = require('react-native-maps');
  MapViewComponent = NativeMapView;
}

export default MapViewComponent;