import React from 'react';
import { ActivityIndicator, View } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';

import { usePatientData } from '../context/PatientDataContext';
import { colors } from '../theme/colors';

import OnboardingScreen from '../screens/OnboardingScreen';
import DashboardScreen  from '../screens/DashboardScreen';
import TimelineScreen   from '../screens/TimelineScreen';
import LogHubScreen     from '../screens/LogHubScreen';
import LogWorkoutScreen from '../screens/LogWorkoutScreen';
import LogSymptomScreen from '../screens/LogSymptomScreen';
import LogSleepScreen   from '../screens/LogSleepScreen';
import SettingsScreen   from '../screens/SettingsScreen';

// ── Param lists ───────────────────────────────────────────────────────────────

export type RootStackParamList = {
  Onboarding: undefined;
  Main: undefined;
};

export type HomeStackParamList = {
  Dashboard: undefined;
  Settings: undefined;
};

export type LogStackParamList = {
  LogHub: undefined;
  LogWorkout: undefined;
  LogSymptom: undefined;
  LogSleep: undefined;
};

export type MainTabParamList = {
  HomeTab: undefined;
  TimelineTab: undefined;
  LogTab: undefined;
};

// ── Navigators ────────────────────────────────────────────────────────────────

const Root      = createNativeStackNavigator<RootStackParamList>();
const Tab       = createBottomTabNavigator<MainTabParamList>();
const HomeStack = createNativeStackNavigator<HomeStackParamList>();
const LogStack  = createNativeStackNavigator<LogStackParamList>();

const screenOptions = {
  headerStyle: { backgroundColor: colors.card },
  headerTintColor: colors.medtronicBlue,
  headerTitleStyle: { fontWeight: '600' as const, color: colors.text },
  headerShadowVisible: false,
};

// ── Stack navigators ──────────────────────────────────────────────────────────

function HomeNavigator() {
  return (
    <HomeStack.Navigator screenOptions={screenOptions}>
      <HomeStack.Screen name="Dashboard" component={DashboardScreen} options={{ title: 'Home' }} />
      <HomeStack.Screen name="Settings" component={SettingsScreen} options={{ title: 'Settings' }} />
    </HomeStack.Navigator>
  );
}

function LogNavigator() {
  return (
    <LogStack.Navigator screenOptions={screenOptions}>
      <LogStack.Screen name="LogHub" component={LogHubScreen} options={{ title: 'Log Activity' }} />
      <LogStack.Screen name="LogWorkout" component={LogWorkoutScreen} options={{ title: 'Log Workout' }} />
      <LogStack.Screen name="LogSymptom" component={LogSymptomScreen} options={{ title: 'Log Symptoms' }} />
      <LogStack.Screen name="LogSleep" component={LogSleepScreen} options={{ title: 'Log Sleep' }} />
    </LogStack.Navigator>
  );
}

// ── Bottom tabs ───────────────────────────────────────────────────────────────

function MainTabs() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarActiveTintColor: colors.medtronicBlue,
        tabBarInactiveTintColor: colors.tertiaryText,
        tabBarStyle: {
          backgroundColor: colors.card,
          borderTopColor: colors.separator,
          paddingBottom: 4,
          height: 60,
        },
        tabBarLabelStyle: { fontSize: 11, fontWeight: '500', marginBottom: 4 },
        tabBarIcon: ({ focused, color, size }) => {
          let iconName: keyof typeof Ionicons.glyphMap = 'home';
          if      (route.name === 'HomeTab')     iconName = focused ? 'home'         : 'home-outline';
          else if (route.name === 'TimelineTab') iconName = focused ? 'time'         : 'time-outline';
          else if (route.name === 'LogTab')      iconName = focused ? 'add-circle'   : 'add-circle-outline';
          return <Ionicons name={iconName} size={size} color={color} />;
        },
      })}
    >
      <Tab.Screen name="HomeTab"     component={HomeNavigator}  options={{ tabBarLabel: 'Home' }} />
      <Tab.Screen name="TimelineTab" component={TimelineScreen} options={{ tabBarLabel: 'Timeline', headerShown: false }} />
      <Tab.Screen name="LogTab"      component={LogNavigator}   options={{ tabBarLabel: 'Log' }} />
    </Tab.Navigator>
  );
}

// ── Root navigator ────────────────────────────────────────────────────────────

export default function AppNavigator() {
  const { onboardingComplete, isLoading } = usePatientData();

  if (isLoading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.background }}>
        <ActivityIndicator size="large" color={colors.medtronicBlue} />
      </View>
    );
  }

  return (
    <NavigationContainer>
      <Root.Navigator screenOptions={{ headerShown: false }}>
        {onboardingComplete ? (
          <Root.Screen name="Main" component={MainTabs} />
        ) : (
          <Root.Screen name="Onboarding" component={OnboardingScreen} />
        )}
      </Root.Navigator>
    </NavigationContainer>
  );
}
