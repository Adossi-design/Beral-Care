import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TextInput, TouchableOpacity, Alert, ActivityIndicator } from 'react-native';
import PatientLayout from '../../components/layouts/PatientLayout';
import ProtectedRoute from '../../components/ProtectedRoute';
import api from '../../../client-services/api';

const STATUS_COLORS = { pending: '#f59e0b', completed: '#22c55e', cancelled: '#ef4444' };

const PatientAppointments = ({ navigation }) => {
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [doctorId, setDoctorId] = useState('');
  const [date, setDate] = useState('');
  const [notes, setNotes] = useState('');
  const [booking, setBooking] = useState(false);

  const fetchAppointments = () => {
    api.get('/api/patient/appointments')
      .then(res => setAppointments(res.data))
      .catch(console.error)
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchAppointments(); }, []);

  const handleBook = async () => {
    if (!doctorId || !date) {
      Alert.alert('Error', 'Doctor ID and date are required');
      return;
    }
    setBooking(true);
    try {
      await api.post('/api/patient/appointments', { doctor_id: doctorId, consultation_date: date, notes, status: 'pending' });
      Alert.alert('Success', 'Appointment booked!');
      setDoctorId(''); setDate(''); setNotes('');
      fetchAppointments();
    } catch (error) {
      Alert.alert('Error', error.response?.data?.error || 'Failed to book appointment');
    } finally {
      setBooking(false);
    }
  };

  return (
    <ProtectedRoute requiredRole="patient" navigation={navigation}>
      <PatientLayout navigation={navigation} activeScreen="PatientAppointments">
        <ScrollView style={styles.scroll} contentContainerStyle={styles.content}>
          <Text style={styles.heading}>Appointments</Text>

          {/* Booking form */}
          <View style={styles.bookCard}>
            <Text style={styles.bookTitle}>Book New Appointment</Text>
            <Text style={styles.label}>Doctor ID</Text>
            <TextInput style={styles.input} placeholder="Doctor's user ID" placeholderTextColor="#aaa" value={doctorId} onChangeText={setDoctorId} keyboardType="numeric" />
            <Text style={styles.label}>Date (YYYY-MM-DD)</Text>
            <TextInput style={styles.input} placeholder="e.g. 2026-08-15" placeholderTextColor="#aaa" value={date} onChangeText={setDate} />
            <Text style={styles.label}>Notes (optional)</Text>
            <TextInput style={[styles.input, styles.textArea]} placeholder="Describe your concern..." placeholderTextColor="#aaa" value={notes} onChangeText={setNotes} multiline numberOfLines={3} textAlignVertical="top" />
            <TouchableOpacity style={[styles.bookBtn, booking && styles.bookBtnDisabled]} onPress={handleBook} disabled={booking}>
              <Text style={styles.bookBtnText}>{booking ? 'Booking...' : 'Book Appointment'}</Text>
            </TouchableOpacity>
          </View>

          {/* Appointments list */}
          <Text style={styles.sectionTitle}>My Appointments</Text>
          {loading ? (
            <ActivityIndicator color="#1a5c38" />
          ) : appointments.length === 0 ? (
            <Text style={styles.emptyText}>No appointments yet</Text>
          ) : (
            appointments.map(a => (
              <View key={a.id} style={styles.card}>
                <View style={styles.cardLeft}>
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
      </PatientLayout>
    </ProtectedRoute>
  );
};

const styles = StyleSheet.create({
  scroll:          { flex: 1 },
  content:         { padding: 20, paddingBottom: 40 },
  heading:         { fontSize: 20, fontWeight: 'bold', color: '#1a1a2e', marginBottom: 20 },
  bookCard:        { backgroundColor: '#fff', borderRadius: 16, padding: 18, marginBottom: 24 },
  bookTitle:       { fontSize: 16, fontWeight: '700', color: '#1a5c38', marginBottom: 14 },
  label:           { fontSize: 14, fontWeight: '600', color: '#1a1a2e', marginBottom: 6, marginTop: 10 },
  input:           { backgroundColor: '#f4f6f8', borderRadius: 12, padding: 13, fontSize: 15, color: '#1a1a2e', borderWidth: 1, borderColor: '#e2e8f0' },
  textArea:        { height: 80 },
  bookBtn:         { backgroundColor: '#1a5c38', borderRadius: 14, paddingVertical: 14, alignItems: 'center', marginTop: 18 },
  bookBtnDisabled: { opacity: 0.6 },
  bookBtnText:     { color: '#fff', fontWeight: 'bold', fontSize: 15 },
  sectionTitle:    { fontSize: 16, fontWeight: '700', color: '#1a1a2e', marginBottom: 12 },
  emptyText:       { color: '#94a3b8', fontSize: 14 },
  card:            { backgroundColor: '#fff', borderRadius: 14, padding: 16, marginBottom: 10, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderLeftWidth: 3, borderLeftColor: '#1a5c38' },
  cardLeft:        { flex: 1 },
  date:            { fontWeight: '700', color: '#1a1a2e', fontSize: 15 },
  notes:           { color: '#64748b', fontSize: 13, marginTop: 4 },
  badge:           { paddingHorizontal: 12, paddingVertical: 4, borderRadius: 20 },
  badgeText:       { fontSize: 12, fontWeight: '600', textTransform: 'capitalize' },
});

export default PatientAppointments;
