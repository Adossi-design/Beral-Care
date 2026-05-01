import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, ActivityIndicator } from 'react-native';
import DoctorLayout from '../../components/layouts/DoctorLayout';
import ProtectedRoute from '../../components/ProtectedRoute';
import api from '@client-services/api';

const STATUS_COLORS = { pending: '#f59e0b', completed: '#22c55e', cancelled: '#ef4444' };

const DoctorAppointments = ({ navigation }) => {
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/api/doctor/appointments')
      .then(res => setAppointments(res.data))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  return (
    <ProtectedRoute requiredRole="doctor" navigation={navigation}>
      <DoctorLayout navigation={navigation} activeScreen="DoctorAppointments">
        <ScrollView style={styles.scroll} contentContainerStyle={styles.content}>
          <Text style={styles.heading}>Appointments</Text>

          {loading ? (
            <ActivityIndicator color="#185FA5" style={{ marginTop: 40 }} />
          ) : appointments.length === 0 ? (
            <Text style={styles.emptyText}>No appointments found</Text>
          ) : (
            appointments.map(a => (
              <View key={a.id} style={styles.card}>
                <View style={styles.cardLeft}>
                  {a.patient_name && <Text style={styles.patientName}>{a.patient_name}</Text>}
                  <Text style={styles.date}>{new Date(a.consultation_date).toLocaleDateString()}</Text>
                  {a.notes && <Text style={styles.notes}>{a.notes}</Text>}
                </View>
                <View style={[styles.badge, { backgroundColor: (STATUS_COLORS[a.status] || '#94a3b8') + '22' }]}>
                  <Text style={[styles.badgeText, { color: STATUS_COLORS[a.status] || '#94a3b8' }]}>{a.status}</Text>
                </View>
              </View>
            ))
          )}
        </ScrollView>
      </DoctorLayout>
    </ProtectedRoute>
  );
};

const styles = StyleSheet.create({
  scroll:     { flex: 1 },
  content:    { padding: 20, paddingBottom: 40 },
  heading:    { fontSize: 20, fontWeight: 'bold', color: '#1a1a2e', marginBottom: 20 },
  emptyText:  { color: '#94a3b8', fontSize: 14 },
  card:       { backgroundColor: '#fff', borderRadius: 14, padding: 16, marginBottom: 12, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderLeftWidth: 3, borderLeftColor: '#185FA5' },
  cardLeft:   { flex: 1 },
  patientName: { fontWeight: '800', color: '#185FA5', fontSize: 14, marginBottom: 2 },
  date:       { fontWeight: '700', color: '#1a1a2e', fontSize: 15 },
  notes:      { color: '#64748b', fontSize: 13, marginTop: 4 },
  badge:      { paddingHorizontal: 12, paddingVertical: 4, borderRadius: 20 },
  badgeText:  { fontSize: 12, fontWeight: '600', textTransform: 'capitalize' },
});

export default DoctorAppointments;
