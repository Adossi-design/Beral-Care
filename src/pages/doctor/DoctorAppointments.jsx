import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, ActivityIndicator, TextInput, TouchableOpacity, Alert, Platform } from 'react-native';
import DoctorLayout from '../../components/layouts/DoctorLayout';
import ProtectedRoute from '../../components/ProtectedRoute';
import QRScannerModal from '../../components/QRScannerModal';
import api from '@client-services/api';

const STATUS_COLORS = { pending: '#f59e0b', completed: '#22c55e', cancelled: '#ef4444' };

const DoctorAppointments = ({ navigation }) => {
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [patientId, setPatientId] = useState('');
  const [date, setDate] = useState('');
  const [notes, setNotes] = useState('');
  const [creating, setCreating] = useState(false);
  const [scannerVisible, setScannerVisible] = useState(false);

  const fetchAppointments = () => {
    api.get('/api/doctor/appointments')
      .then(res => setAppointments(res.data))
      .catch(console.error)
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchAppointments();
  }, []);

  const handleQRScanned = (qrPatientId) => {
    setPatientId(qrPatientId);
    setScannerVisible(false);
  };

  const handleCreateAppointment = async () => {
    if (!patientId.trim() || !date) {
      Alert.alert('Error', 'Please enter a patient ID and date');
      return;
    }

    setCreating(true);
    try {
      await api.post('/api/doctor/create-appointment', {
        patient_id: patientId.trim(),
        appointment_date: date,
        notes: notes || null
      });
      Alert.alert('Success', 'Appointment created!');
      setPatientId('');
      setDate('');
      setNotes('');
      fetchAppointments();
    } catch (error) {
      Alert.alert('Error', error.response?.data?.error || 'Failed to create appointment');
    } finally {
      setCreating(false);
    }
  };

  return (
    <ProtectedRoute requiredRole="doctor" navigation={navigation}>
      <DoctorLayout navigation={navigation} activeScreen="DoctorAppointments">
        <ScrollView style={styles.scroll} contentContainerStyle={styles.content}>
          <Text style={styles.heading}>Appointments</Text>

          {/* Create Appointment Form */}
          <View style={styles.createCard}>
            <Text style={styles.createTitle}>Schedule Appointment</Text>

            <Text style={styles.label}>Patient ID</Text>
            <View style={styles.inputRow}>
              <TextInput
                style={[styles.input, { flex: 1 }]}
                placeholder="e.g. BC-2026-00001"
                placeholderTextColor="#94a3b8"
                value={patientId}
                onChangeText={setPatientId}
                autoCapitalize="characters"
              />
              <TouchableOpacity
                style={styles.scanBtn}
                onPress={() => setScannerVisible(true)}
              >
                <Text style={styles.scanBtnText}>📸</Text>
              </TouchableOpacity>
            </View>

            <Text style={styles.label}>Date</Text>
            {Platform.OS === 'web' ? (
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                style={{
                  width: '100%',
                  padding: '12px',
                  borderRadius: '12px',
                  borderWidth: '1px',
                  borderColor: '#e2e8f0',
                  fontSize: '15px',
                  fontFamily: 'system-ui',
                  boxSizing: 'border-box'
                }}
              />
            ) : (
              <TextInput
                style={styles.input}
                placeholder="YYYY-MM-DD"
                placeholderTextColor="#94a3b8"
                value={date}
                onChangeText={setDate}
              />
            )}

            <Text style={styles.label}>Notes (optional)</Text>
            <TextInput
              style={[styles.input, styles.textarea]}
              placeholder="Any notes about this appointment..."
              placeholderTextColor="#94a3b8"
              value={notes}
              onChangeText={setNotes}
              multiline
              numberOfLines={3}
              textAlignVertical="top"
            />

            <TouchableOpacity
              style={[styles.createBtn, creating && styles.createBtnDisabled]}
              onPress={handleCreateAppointment}
              disabled={creating}
            >
              <Text style={styles.createBtnText}>{creating ? 'Creating...' : 'Create Appointment'}</Text>
            </TouchableOpacity>
          </View>

          {/* Appointments List */}
          <Text style={styles.sectionTitle}>My Appointments</Text>
          {loading ? (
            <ActivityIndicator color="#185FA5" style={{ marginTop: 40 }} />
          ) : appointments.length === 0 ? (
            <Text style={styles.emptyText}>No appointments scheduled</Text>
          ) : (
            appointments.map(a => (
              <View key={a.id} style={styles.card}>
                <View style={styles.cardLeft}>
                  {a.patient_name && <Text style={styles.patientName}>{a.patient_name}</Text>}
                  <Text style={styles.patientId}>{a.patient_id}</Text>
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

        {/* Patient QR Scanner Modal */}
        <QRScannerModal
          visible={scannerVisible}
          onScanned={handleQRScanned}
          onClose={() => setScannerVisible(false)}
          mode="patient"
          title="Scan Patient QR Code"
        />
      </DoctorLayout>
    </ProtectedRoute>
  );
};

const styles = StyleSheet.create({
  scroll:     { flex: 1, backgroundColor: '#f8fafc' },
  content:    { padding: 20, paddingBottom: 40 },
  heading:    { fontSize: 20, fontWeight: 'bold', color: '#1a1a2e', marginBottom: 20 },

  createCard: { backgroundColor: '#fff', borderRadius: 16, padding: 18, marginBottom: 24, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 8, elevation: 2 },
  createTitle: { fontSize: 16, fontWeight: '700', color: '#185FA5', marginBottom: 14 },
  label:      { fontSize: 14, fontWeight: '600', color: '#1a1a2e', marginBottom: 6, marginTop: 10 },
  inputRow:   { flexDirection: 'row', gap: 8, marginBottom: 10 },
  input:      { backgroundColor: '#f4f6f8', borderRadius: 12, padding: 13, fontSize: 15, color: '#1a1a2e', borderWidth: 1, borderColor: '#e2e8f0' },
  scanBtn:    { backgroundColor: '#f4f6f8', borderRadius: 12, paddingHorizontal: 12, justifyContent: 'center', borderWidth: 1, borderColor: '#e2e8f0' },
  scanBtnText: { fontSize: 16 },
  textarea:   { height: 80, marginBottom: 10 },
  createBtn:  { backgroundColor: '#185FA5', borderRadius: 14, paddingVertical: 14, alignItems: 'center', marginTop: 18 },
  createBtnDisabled: { opacity: 0.6 },
  createBtnText: { color: '#fff', fontWeight: 'bold', fontSize: 15 },

  sectionTitle: { fontSize: 16, fontWeight: '700', color: '#1a1a2e', marginTop: 16, marginBottom: 12 },
  emptyText:  { color: '#94a3b8', fontSize: 14, textAlign: 'center', paddingVertical: 20 },
  card:       { backgroundColor: '#fff', borderRadius: 14, padding: 16, marginBottom: 12, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderLeftWidth: 3, borderLeftColor: '#185FA5', shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 4, elevation: 1 },
  cardLeft:   { flex: 1 },
  patientName: { fontWeight: '800', color: '#185FA5', fontSize: 15, marginBottom: 2 },
  patientId:  { fontSize: 12, color: '#64748b', fontWeight: '600', marginBottom: 4 },
  date:       { fontWeight: '700', color: '#1a1a2e', fontSize: 15 },
  notes:      { color: '#64748b', fontSize: 13, marginTop: 4 },
  badge:      { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20 },
  badgeText:  { fontSize: 12, fontWeight: '600', textTransform: 'capitalize' },
});

export default DoctorAppointments;
