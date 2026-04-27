import React from 'react';
import { View, ActivityIndicator } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

import { AuthProvider, useAuth } from './src/context/AuthContext';

// Public screens
import Landing   from './src/pages/Landing';
import Login     from './src/pages/Login';
import Register  from './src/pages/Register';

// Hidden system screen — not linked from any public page
import AdminLogin from './src/pages/admin/AdminLogin';

// Admin screens
import AdminDashboard from './src/pages/admin/AdminDashboard';
import AdminUsers     from './src/pages/admin/AdminUsers';
import AdminSettings  from './src/pages/admin/AdminSettings';

// Doctor screens
import DoctorDashboard    from './src/pages/doctor/DoctorDashboard';
import DoctorPatients     from './src/pages/doctor/DoctorPatients';
import DoctorAppointments from './src/pages/doctor/DoctorAppointments';

// Patient screens
import PatientDashboard    from './src/pages/patient/PatientDashboard';
import PatientProfile      from './src/pages/patient/PatientProfile';
import PatientAppointments from './src/pages/patient/PatientAppointments';
import PatientNotifications from './src/pages/patient/PatientNotifications';

const Stack = createNativeStackNavigator();

const ROLE_INITIAL = {
  admin:   'AdminDashboard',
  doctor:  'DoctorDashboard',
  patient: 'PatientDashboard',
};

function RootNavigator() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#fff' }}>
        <ActivityIndicator size="large" color="#1a5c38" />
      </View>
    );
  }

  // Determine initial route based on auth state and role
  const initialRoute = user ? (ROLE_INITIAL[user.role] || 'PatientDashboard') : 'Landing';

  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false }} initialRouteName={initialRoute}>
        {/* Public routes */}
        <Stack.Screen name="Landing"  component={Landing} />
        <Stack.Screen name="Login"    component={Login} />
        <Stack.Screen name="Register" component={Register} />

        {/* Hidden system login — not referenced in any public UI */}
        <Stack.Screen name="SystemLogin" component={AdminLogin} />

        {/* Admin routes — guarded inside each screen via ProtectedRoute */}
        <Stack.Screen name="AdminDashboard" component={AdminDashboard} />
        <Stack.Screen name="AdminUsers"     component={AdminUsers} />
        <Stack.Screen name="AdminSettings"  component={AdminSettings} />

        {/* Doctor routes */}
        <Stack.Screen name="DoctorDashboard"    component={DoctorDashboard} />
        <Stack.Screen name="DoctorPatients"     component={DoctorPatients} />
        <Stack.Screen name="DoctorAppointments" component={DoctorAppointments} />

        {/* Patient routes */}
        <Stack.Screen name="PatientDashboard"     component={PatientDashboard} />
        <Stack.Screen name="PatientProfile"       component={PatientProfile} />
        <Stack.Screen name="PatientAppointments"  component={PatientAppointments} />
        <Stack.Screen name="PatientNotifications" component={PatientNotifications} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <RootNavigator />
    </AuthProvider>
  );
}
