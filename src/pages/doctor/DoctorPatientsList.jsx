import React, { useEffect, useState } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet,
  ActivityIndicator, Alert, SafeAreaView, FlatList, RefreshControl
} from 'react-native';
import DoctorLayout from '../../components/layouts/DoctorLayout';
import ProtectedRoute from '../../components/ProtectedRoute';
import api from '@client-services/api';

const DoctorPatientsList = ({ navigation }) => {
  const [patients, setPatients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    fetchPatients();
  }, []);

  const fetchPatients = async () => {
    try {
      setLoading(true);
      const res = await api.get('/api/doctor/patients');
      setPatients(res.data || []);
    } catch (error) {
      console.error('Error fetching patients:', error);
      Alert.alert('Error', 'Failed to load patients');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    fetchPatients();
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <ActivityIndicator size="large" color="#185FA5" style={{ marginTop: 40 }} />
      </SafeAreaView>
    );
  }

  return (
    <ProtectedRoute requiredRole="doctor" navigation={navigation}>
      <DoctorLayout navigation={navigation} activeScreen="DoctorPatients">
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.content}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
        >
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.title}>My Patients</Text>
            <TouchableOpacity
              style={styles.createBtn}
              onPress={() => navigation.navigate('DoctorPatients', { createMode: true })}
            >
              <Text style={styles.createBtnText}>+ Create Patient</Text>
            </TouchableOpacity>
          </View>

          {/* Patients List or Empty State */}
          {patients && patients.length === 0 ? (
            <View style={styles.emptyState}>
              <Text style={styles.emptyIcon}>👥</Text>
              <Text style={styles.emptyTitle}>No Patients Yet</Text>
              <Text style={styles.emptyText}>
                You haven't consulted with any patients yet. Create a patient account or wait for patients to request consultations.
              </Text>
              <TouchableOpacity
                style={styles.emptyBtn}
                onPress={() => navigation.navigate('DoctorPatients', { createMode: true })}
              >
                <Text style={styles.emptyBtnText}>Create First Patient</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <View style={styles.patientsList}>
              {patients.map((patient) => (
                <TouchableOpacity
                  key={patient.id}
                  style={styles.patientCard}
                  onPress={() => navigation.navigate('DoctorPatients', { patientData: patient })}
                >
                  <View style={styles.patientAvatar}>
                    <Text style={styles.avatarText}>
                      {patient.full_name?.[0]?.toUpperCase() || 'P'}
                    </Text>
                  </View>
                  <View style={styles.patientInfo}>
                    <Text style={styles.patientName}>{patient.full_name}</Text>
                    <Text style={styles.patientId}>{patient.patient_id}</Text>
                    <Text style={styles.lastConsult}>
                      Last: {new Date(patient.last_consultation).toLocaleDateString()}
                    </Text>
                  </View>
                  <Text style={styles.arrow}>›</Text>
                </TouchableOpacity>
              ))}
            </View>
          )}
        </ScrollView>
      </DoctorLayout>
    </ProtectedRoute>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8fafc' },
  scroll: { flex: 1, backgroundColor: '#f8fafc' },
  content: { paddingBottom: 40 },

  header: {
    paddingHorizontal: 20,
    paddingVertical: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  title: {
    fontSize: 24,
    fontWeight: '800',
    color: '#1a1a2e',
  },
  createBtn: {
    backgroundColor: '#185FA5',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 8,
  },
  createBtnText: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '700',
  },

  emptyState: {
    alignItems: 'center',
    paddingVertical: 60,
    paddingHorizontal: 20,
  },
  emptyIcon: {
    fontSize: 48,
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1a1a2e',
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 14,
    color: '#64748b',
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 24,
  },
  emptyBtn: {
    backgroundColor: '#185FA5',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  emptyBtnText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '700',
  },

  patientsList: {
    paddingHorizontal: 20,
  },
  patientCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  patientAvatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#E6F1FB',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  avatarText: {
    fontSize: 20,
    fontWeight: '800',
    color: '#185FA5',
  },
  patientInfo: {
    flex: 1,
  },
  patientName: {
    fontSize: 15,
    fontWeight: '700',
    color: '#1a1a2e',
    marginBottom: 2,
  },
  patientId: {
    fontSize: 12,
    color: '#185FA5',
    fontWeight: '600',
    marginBottom: 2,
  },
  lastConsult: {
    fontSize: 11,
    color: '#94a3b8',
  },
  arrow: {
    fontSize: 20,
    color: '#94a3b8',
  },
});

export default DoctorPatientsList;
