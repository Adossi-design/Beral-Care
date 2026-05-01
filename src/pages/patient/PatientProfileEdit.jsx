import React from 'react';
import { SafeAreaView } from 'react-native';
import ProfileEdit from '../../components/ProfileEdit';
import PatientLayout from '../../components/layouts/PatientLayout';
import ProtectedRoute from '../../components/ProtectedRoute';

const PatientProfileEditScreen = ({ navigation }) => {
  return (
    <ProtectedRoute requiredRole="patient" navigation={navigation}>
      <SafeAreaView style={{ flex: 1 }}>
        <PatientLayout navigation={navigation} activeScreen="PatientProfile">
          <ProfileEdit
            role="patient"
            Layout={null}
            navigation={navigation}
            activeScreen="PatientProfile"
          />
        </PatientLayout>
      </SafeAreaView>
    </ProtectedRoute>
  );
};

export default PatientProfileEditScreen;
