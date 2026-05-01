import React from 'react';
import { SafeAreaView } from 'react-native';
import ProfileEdit from '../../components/ProfileEdit';
import DoctorLayout from '../../components/layouts/DoctorLayout';
import ProtectedRoute from '../../components/ProtectedRoute';

const DoctorProfileEditScreen = ({ navigation }) => {
  return (
    <ProtectedRoute requiredRole="doctor" navigation={navigation}>
      <SafeAreaView style={{ flex: 1 }}>
        <DoctorLayout navigation={navigation} activeScreen="DoctorProfile">
          <ProfileEdit
            role="doctor"
            Layout={null}
            navigation={navigation}
            activeScreen="DoctorProfile"
          />
        </DoctorLayout>
      </SafeAreaView>
    </ProtectedRoute>
  );
};

export default DoctorProfileEditScreen;
