import React from 'react';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { PatientDataProvider } from './src/context/PatientDataContext';
import AppNavigator from './src/navigation/AppNavigator';

export default function App() {
  return (
    <SafeAreaProvider>
      <PatientDataProvider>
        <StatusBar style="auto" />
        <AppNavigator />
      </PatientDataProvider>
    </SafeAreaProvider>
  );
}
