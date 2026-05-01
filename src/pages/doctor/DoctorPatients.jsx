import React, { useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView,
  TextInput, TouchableOpacity, Alert, ActivityIndicator,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import DoctorLayout from '../../components/layouts/DoctorLayout';
import ProtectedRoute from '../../components/ProtectedRoute';
import QRScannerModal from '../../components/QRScannerModal';
import api from '@client-services/api';

const STATUS_COLORS = { pending: '#f59e0b', completed: '#22c55e', cancelled: '#ef4444' };

const DoctorPatients = ({ navigation, route }) => {
  const patientData  = route?.params?.patientData  || null;
  const createMode   = route?.params?.createMode   || false;

  const [scannerVisible, setScannerVisible] = useState(false);

  const [fullName, setFullName]       = useState('');
  const [email, setEmail]             = useState('');
  const [phone, setPhone]             = useState('');
  const [password, setPassword]       = useState('');
  const [creating, setCreating]       = useState(false);
  const [createdPatient, setCreatedPatient] = useState(null);

  const handleCreatePatient = async () => {
    if (!fullName || !email || !phone || !password) {
      Alert.alert('Error', 'All fields are required');
      return;
    }
    setCreating(true);
    try {
      const res = await api.post('/api/doctor/create-patient', { full_name: fullName, email, phone, password });
      setCreatedPatient(res.data);
    } catch (error) {
      Alert.alert('Error', error.response?.data?.error || 'Failed to create patient');
    } finally {
      setCreating(false);
    }
  };

  // Derive history sections from consultations
  const consultations  = patientData?.consultations || [];
  const diagnoses      = consultations.filter(c => c.diagnosis);
  const prescriptions  = consultations.filter(c => c.prescription);
  const completed      = consultations.filter(c => c.status === 'completed');

  return (
    <ProtectedRoute requiredRole="doctor" navigation={navigation}>
      <DoctorLayout navigation={navigation} activeScreen="DoctorPatients">
        <ScrollView style={styles.scroll} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>

          {/* ── Patient profile view ── */}
          {patientData && (
            <>
              {/* Profile header card */}
              <LinearGradient colors={['#185FA5', '#1a6bbf']} style={styles.profileHeader} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}>
                <View style={styles.profileAvatar}>
                  <Text style={styles.profileAvatarText}>{patientData.patient?.full_name?.[0]?.toUpperCase() || 'P'}</Text>
                </View>
                <Text style={styles.profileName}>{patientData.patient?.full_name}</Text>
                <View style={styles.profileIdRow}>
                  <Text style={styles.profileIdLabel}>🪪</Text>
                  <Text style={styles.profileIdValue}>{patientData.patient?.patient_id}</Text>
                </View>
                <Text style={styles.profileEmail}>{patientData.patient?.email}</Text>
              </LinearGradient>

              {/* Summary stats */}
              <View style={styles.statsRow}>
                {[
                  { icon: '📋', label: 'Total Visits',   value: consultations.length,  color: '#185FA5', bg: '#E6F1FB' },
                  { icon: '🩺', label: 'Diagnoses',      value: diagnoses.length,      color: '#1a5c38', bg: '#EAF3DE' },
                  { icon: '💊', label: 'Prescriptions',  value: prescriptions.length,  color: '#d97706', bg: '#fef3c7' },
                ].map(s => (
                  <View key={s.label} style={[styles.statCard, { backgroundColor: s.bg }]}>
                    <Text style={styles.statIcon}>{s.icon}</Text>
                    <Text style={[styles.statValue, { color: s.color }]}>{s.value}</Text>
                    <Text style={styles.statLabel}>{s.label}</Text>
                  </View>
                ))}
              </View>

              {/* Diagnoses section */}
              {diagnoses.length > 0 && (
                <>
                  <Text style={styles.sectionTitle}>🩺 Diagnoses</Text>
                  {diagnoses.map(c => (
                    <View key={`d-${c.id}`} style={styles.recordCard}>
                      <View style={styles.recordHeader}>
                        <Text style={styles.recordDate}>
                          {new Date(c.consultation_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                        </Text>
                        <View style={[styles.recordBadge, { backgroundColor: (STATUS_COLORS[c.status] || '#94a3b8') + '22' }]}>
                          <Text style={[styles.recordBadgeText, { color: STATUS_COLORS[c.status] || '#94a3b8' }]}>{c.status}</Text>
                        </View>
                      </View>
                      <Text style={styles.recordContent}>{c.diagnosis}</Text>
                    </View>
                  ))}
                </>
              )}

              {/* Prescriptions section */}
              {prescriptions.length > 0 && (
                <>
                  <Text style={styles.sectionTitle}>💊 Prescriptions</Text>
                  {prescriptions.map(c => (
                    <View key={`p-${c.id}`} style={[styles.recordCard, styles.recordCardYellow]}>
                      <View style={styles.recordHeader}>
                        <Text style={styles.recordDate}>
                          {new Date(c.consultation_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                        </Text>
                      </View>
                      <Text style={styles.recordContent}>{c.prescription}</Text>
                    </View>
                  ))}
                </>
              )}

              {/* Full consultation history */}
              <Text style={styles.sectionTitle}>📋 Consultation History</Text>
              {consultations.length === 0 ? (
                <View style={styles.emptyCard}>
                  <Text style={styles.emptyIcon}>📭</Text>
                  <Text style={styles.emptyText}>No consultations on record</Text>
                </View>
              ) : (
                consultations.map(c => (
                  <View key={c.id} style={styles.consultCard}>
                    <View style={styles.consultHeader}>
                      <Text style={styles.consultDate}>
                        {new Date(c.consultation_date).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })}
                      </Text>
                      <View style={[styles.recordBadge, { backgroundColor: (STATUS_COLORS[c.status] || '#94a3b8') + '22' }]}>
                        <Text style={[styles.recordBadgeText, { color: STATUS_COLORS[c.status] || '#94a3b8' }]}>{c.status}</Text>
                      </View>
                    </View>
                    {c.notes       && <Text style={styles.consultDetail}>📝 {c.notes}</Text>}
                    {c.diagnosis   && <Text style={styles.consultDetail}>🩺 {c.diagnosis}</Text>}
                    {c.prescription && <Text style={styles.consultDetail}>💊 {c.prescription}</Text>}
                  </View>
                ))
              )}
            </>
          )}

          {/* ── Create patient form ── */}
          {(createMode || !patientData) && !createdPatient && (
            <>
              <View style={styles.formHeader}>
                <View>
                  <Text style={styles.heading}>Create Patient Account</Text>
                  <Text style={styles.hint}>Fill in the patient's details. A Patient ID will be auto-generated.</Text>
                </View>
                <TouchableOpacity style={styles.scanBtn} onPress={() => setScannerVisible(true)}>
                  <Text style={styles.scanBtnText}>📷</Text>
                  <Text style={styles.scanBtnLabel}>Scan QR</Text>
                </TouchableOpacity>
              </View>

              <QRScannerModal
                visible={scannerVisible}
                onScanned={(id) => {
                  // Navigate to patient lookup with scanned ID
                  setScannerVisible(false);
                  navigation.navigate('DoctorDashboard', { prefillPatientId: id });
                }}
                onClose={() => setScannerVisible(false)}
              />

              {[
                { label: 'Full Name',          value: fullName,  setter: setFullName,  placeholder: 'Patient full name',              keyboard: 'default' },
                { label: 'Email',              value: email,     setter: setEmail,     placeholder: 'patient@email.com',              keyboard: 'email-address' },
                { label: 'Phone',              value: phone,     setter: setPhone,     placeholder: '+250788000000',                  keyboard: 'phone-pad' },
                { label: 'Temporary Password', value: password,  setter: setPassword,  placeholder: 'Min 8 chars, uppercase & number', secure: true },
              ].map(f => (
                <View key={f.label}>
                  <Text style={styles.label}>{f.label}</Text>
                  <TextInput
                    style={styles.input}
                    placeholder={f.placeholder}
                    placeholderTextColor="#aaa"
                    value={f.value}
                    onChangeText={f.setter}
                    keyboardType={f.keyboard || 'default'}
                    secureTextEntry={f.secure || false}
                    autoCapitalize="none"
                  />
                </View>
              ))}

              <TouchableOpacity
                style={[styles.createBtn, creating && styles.createBtnDisabled]}
                onPress={handleCreatePatient}
                disabled={creating}
              >
                <Text style={styles.createBtnText}>{creating ? 'Creating...' : 'Create Patient Account'}</Text>
              </TouchableOpacity>
            </>
          )}

          {/* ── Success state ── */}
          {createdPatient && (
            <View style={styles.successCard}>
              <Text style={styles.successEmoji}>✅</Text>
              <Text style={styles.successTitle}>Patient Account Created</Text>
              <View style={styles.successIdBox}>
                <Text style={styles.successIdLabel}>Patient ID</Text>
                <Text style={styles.successId}>{createdPatient.patient_id}</Text>
              </View>
              <Text style={styles.successName}>{createdPatient.user?.full_name}</Text>
              <Text style={styles.successHint}>Share this Patient ID with the patient so they can log in and manage their profile.</Text>
              <TouchableOpacity style={styles.successBtn} onPress={() => navigation.goBack()}>
                <Text style={styles.successBtnText}>← Back to Dashboard</Text>
              </TouchableOpacity>
            </View>
          )}

          <View style={{ height: 20 }} />
        </ScrollView>
      </DoctorLayout>
    </ProtectedRoute>
  );
};

const styles = StyleSheet.create({
  scroll:             { flex: 1, backgroundColor: '#f8fafc' },
  content:            { padding: 20, paddingBottom: 40 },

  profileHeader:      { borderRadius: 22, padding: 24, marginBottom: 20, alignItems: 'center' },
  profileAvatar:      { width: 72, height: 72, borderRadius: 36, backgroundColor: 'rgba(255,255,255,0.25)', justifyContent: 'center', alignItems: 'center', marginBottom: 12 },
  profileAvatarText:  { color: '#fff', fontSize: 30, fontWeight: '800' },
  profileName:        { color: '#fff', fontSize: 20, fontWeight: '800', marginBottom: 8 },
  profileIdRow:       { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 4 },
  profileIdLabel:     { fontSize: 16 },
  profileIdValue:     { color: 'rgba(255,255,255,0.9)', fontSize: 15, fontWeight: '700', letterSpacing: 1 },
  profileEmail:       { color: 'rgba(255,255,255,0.7)', fontSize: 13 },

  statsRow:           { flexDirection: 'row', gap: 10, marginBottom: 24 },
  statCard:           { flex: 1, borderRadius: 14, padding: 14, alignItems: 'center' },
  statIcon:           { fontSize: 20, marginBottom: 6 },
  statValue:          { fontSize: 20, fontWeight: '800', marginBottom: 2 },
  statLabel:          { fontSize: 10, color: '#64748b', fontWeight: '600', textAlign: 'center' },

  sectionTitle:       { fontSize: 15, fontWeight: '700', color: '#1a1a2e', marginBottom: 12, marginTop: 4 },

  recordCard:         { backgroundColor: '#fff', borderRadius: 14, padding: 14, marginBottom: 10, borderLeftWidth: 3, borderLeftColor: '#185FA5' },
  recordCardYellow:   { borderLeftColor: '#d97706' },
  recordHeader:       { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  recordDate:         { fontWeight: '700', color: '#1a1a2e', fontSize: 13 },
  recordBadge:        { paddingHorizontal: 10, paddingVertical: 3, borderRadius: 20 },
  recordBadgeText:    { fontSize: 11, fontWeight: '600', textTransform: 'capitalize' },
  recordContent:      { color: '#475569', fontSize: 14, lineHeight: 20 },

  consultCard:        { backgroundColor: '#fff', borderRadius: 14, padding: 14, marginBottom: 10 },
  consultHeader:      { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  consultDate:        { fontWeight: '700', color: '#1a1a2e', fontSize: 13 },
  consultDetail:      { color: '#475569', fontSize: 13, marginTop: 4, lineHeight: 18 },

  emptyCard:          { backgroundColor: '#fff', borderRadius: 16, padding: 28, alignItems: 'center', marginBottom: 16 },
  emptyIcon:          { fontSize: 36, marginBottom: 10 },
  emptyText:          { color: '#94a3b8', fontSize: 14 },

  heading:            { fontSize: 20, fontWeight: '800', color: '#1a1a2e', marginBottom: 6 },
  hint:               { color: '#64748b', fontSize: 13, marginBottom: 20 },
  formHeader:         { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 4 },
  scanBtn:            { backgroundColor: '#E6F1FB', borderRadius: 12, paddingHorizontal: 14, paddingVertical: 10, alignItems: 'center' },
  scanBtnText:        { fontSize: 22 },
  scanBtnLabel:       { fontSize: 10, color: '#185FA5', fontWeight: '700', marginTop: 2 },
  label:              { fontSize: 13, fontWeight: '700', color: '#475569', marginBottom: 6, marginTop: 14, textTransform: 'uppercase', letterSpacing: 0.5 },
  input:              { backgroundColor: '#fff', borderRadius: 12, padding: 14, fontSize: 15, color: '#1a1a2e', borderWidth: 1.5, borderColor: '#e2e8f0' },
  createBtn:          { backgroundColor: '#185FA5', borderRadius: 14, paddingVertical: 16, alignItems: 'center', marginTop: 24 },
  createBtnDisabled:  { opacity: 0.6 },
  createBtnText:      { color: '#fff', fontSize: 16, fontWeight: '800' },

  successCard:        { backgroundColor: '#fff', borderRadius: 22, padding: 28, alignItems: 'center', borderWidth: 1.5, borderColor: '#1a5c38' },
  successEmoji:       { fontSize: 48, marginBottom: 12 },
  successTitle:       { fontSize: 18, fontWeight: '800', color: '#1a5c38', marginBottom: 20 },
  successIdBox:       { backgroundColor: '#EAF3DE', borderRadius: 14, paddingHorizontal: 24, paddingVertical: 14, alignItems: 'center', marginBottom: 14, width: '100%' },
  successIdLabel:     { color: '#64748b', fontSize: 12, marginBottom: 4, textTransform: 'uppercase', letterSpacing: 0.8 },
  successId:          { fontSize: 22, fontWeight: '800', color: '#1a5c38', letterSpacing: 2 },
  successName:        { fontSize: 15, color: '#1a1a2e', fontWeight: '600', marginBottom: 10 },
  successHint:        { fontSize: 13, color: '#64748b', textAlign: 'center', lineHeight: 20, marginBottom: 20 },
  successBtn:         { backgroundColor: '#E6F1FB', borderRadius: 12, paddingHorizontal: 20, paddingVertical: 10 },
  successBtnText:     { color: '#185FA5', fontWeight: '700', fontSize: 14 },
});

export default DoctorPatients;
