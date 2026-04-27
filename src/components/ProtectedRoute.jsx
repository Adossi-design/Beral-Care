import React from 'react';
import { View, ActivityIndicator } from 'react-native';
import { useAuth } from '../context/AuthContext';

/**
 * ProtectedRoute — wraps a screen to enforce authentication and role.
 *
 * - Not logged in → navigates to /login
 * - Wrong role    → navigates to the user's own dashboard
 * - Correct role  → renders the screen
 *
 * Usage in navigator:
 *   <Stack.Screen name="PatientDashboard">
 *     {(props) => (
 *       <ProtectedRoute requiredRole="patient" navigation={props.navigation}>
 *         <PatientDashboard {...props} />
 *       </ProtectedRoute>
 *     )}
 *   </Stack.Screen>
 */

const ROLE_DASHBOARDS = {
  admin: 'AdminDashboard',
  doctor: 'DoctorDashboard',
  patient: 'PatientDashboard',
};

const ProtectedRoute = ({ children, requiredRole, navigation }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color="#1a5c38" />
      </View>
    );
  }

  if (!user) {
    navigation.replace('Login');
    return null;
  }

  if (requiredRole && user.role !== requiredRole) {
    // Redirect to the user's own dashboard
    const ownDashboard = ROLE_DASHBOARDS[user.role];
    if (ownDashboard) navigation.replace(ownDashboard);
    return null;
  }

  return children;
};

export default ProtectedRoute;
