import React from 'react';
import { View, ActivityIndicator } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

import { AuthProvider, useAuth } from './src/context/AuthContext';
import { LanguageProvider } from './src/context/LanguageContext';
import './src/config/googleSignIn';

// Public screens
import Splash    from './src/pages/Splash';
import Welcome   from './src/pages/Welcome';
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
import DoctorPatientsList from './src/pages/doctor/DoctorPatientsList';
import DoctorAppointments from './src/pages/doctor/DoctorAppointments';
import DoctorIncomingRequests from './src/pages/doctor/DoctorIncomingRequests';
import CreateConsultation from './src/pages/doctor/CreateConsultation';
import DoctorProfileEdit from './src/pages/doctor/DoctorProfileEdit';

// Patient screens
import PatientDashboard    from './src/pages/patient/PatientDashboard';
import PatientProfile      from './src/pages/patient/PatientProfile';
import PatientAppointments from './src/pages/patient/PatientAppointments';
import PatientNotifications from './src/pages/patient/PatientNotifications';
import DoctorDiscovery from './src/pages/patient/DoctorDiscovery';
import ConsultationRequests from './src/pages/patient/ConsultationRequests';
import MedicalHistory from './src/pages/patient/MedicalHistory';
import PatientProfileEdit from './src/pages/patient/PatientProfileEdit';

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
  const initialRoute = user ? (ROLE_INITIAL[user.role] || 'PatientDashboard') : 'Welcome';

  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false }} initialRouteName={initialRoute}>
        {/* Public routes */}
        <Stack.Screen name="Splash"    component={Splash} />
        <Stack.Screen name="Welcome"   component={Welcome} />
        <Stack.Screen name="Login"     component={Login} />
        <Stack.Screen name="Register"  component={Register} />

        {/* Hidden system login — not referenced in any public UI */}
        <Stack.Screen name="SystemLogin" component={AdminLogin} />

        {/* Admin routes — guarded inside each screen via ProtectedRoute */}
        <Stack.Screen name="AdminDashboard" component={AdminDashboard} />
        <Stack.Screen name="AdminUsers"     component={AdminUsers} />
        <Stack.Screen name="AdminSettings"  component={AdminSettings} />

        {/* Doctor routes */}
        <Stack.Screen name="DoctorDashboard"    component={DoctorDashboard} />
        <Stack.Screen name="DoctorPatients"     component={DoctorPatientsList} />
        <Stack.Screen name="DoctorAppointments" component={DoctorAppointments} />
        <Stack.Screen name="DoctorIncomingRequests" component={DoctorIncomingRequests} />
        <Stack.Screen name="CreateConsultation" component={CreateConsultation} />
        <Stack.Screen name="DoctorProfileEdit" component={DoctorProfileEdit} />

        {/* Patient routes */}
        <Stack.Screen name="PatientDashboard"     component={PatientDashboard} />
        <Stack.Screen name="PatientProfile"       component={PatientProfile} />
        <Stack.Screen name="PatientProfileEdit"   component={PatientProfileEdit} />
        <Stack.Screen name="PatientAppointments"  component={PatientAppointments} />
        <Stack.Screen name="PatientNotifications" component={PatientNotifications} />
        <Stack.Screen name="DoctorDiscovery"      component={DoctorDiscovery} />
        <Stack.Screen name="ConsultationRequests" component={ConsultationRequests} />
        <Stack.Screen name="MedicalHistory"       component={MedicalHistory} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}

export default function App() {
  return (
    <LanguageProvider>
      <AuthProvider>
        <RootNavigator />
      </AuthProvider>
    </LanguageProvider>
  );
}
