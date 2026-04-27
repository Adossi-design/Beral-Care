import React, { useEffect, useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView,
  ActivityIndicator, TouchableOpacity, Clipboard, Alert,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import PatientLayout from '../../components/layouts/PatientLayout';
import ProtectedRoute from '../../components/ProtectedRoute';
import PatientQRModal from '../../components/PatientQRModal';
import api from '../../../client-services/api';

const STATUS_COLORS = { pending: '#f59e0b', completed: '#22c55e', cancelled: '#ef4444' };

const PatientProfile = ({ navigation }) => {
  const [profile, setProfile] = useState(null);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [qrVisible, setQrVisible] = useState(false);

  useEffect(() => {
    Promise.all([
      api.get('/api/patient/profile'),
      api.get('/api/patient/history'),
    ])
      .then(([profileRes, histRes]) => {
        setProfile(profileRes.data);
        setHistory(histRes.data);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const handleCopyId = () => {
    Clipboard.setString(profile?.patient_id || '');
    Alert.alert('Copied!', `Patient ID ${profile?.patient_id} copied`);
  };

  const diagnosesCount     = history.filter(h => h.diagnosis).length;
  const prescriptionsCount = history.filter(h => h.prescription).length;
  const completedCount     = history.filter(h => h.status === 'completed').length;

  return (
    <ProtectedRoute requiredRole="patient" navigation={navigation}>
      <PatientLayout navigation={navigation} activeScreen="PatientProfile">
        <ScrollView style={styles.scroll} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>

          {loading ? (
            <ActivityIndicator color="#1a5c38" style={{ marginTop: 60 }} />
          ) : (
            <>
              {/* Profile header */}
              <LinearGradient colors={['#1a5c38', '#2d8653']} style={styles.header} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}>
                <View style={styles.avatar}>
                  <Text style={styles.avatarText}>{profile?.full_name?.[0]?.toUpperCase() || 'P'}</Text>
                </View>
                <Text style={styles.headerName}>{profile?.full_name}</Text>
                <Text style={styles.headerEmail}>{profile?.email}</Text>

                {/* Patient ID — prominent */}
                <TouchableOpacity style={styles.idBox} onPress={handleCopyId}>
                  <Text style={styles.idBoxLabel}>Patient ID</Text>
                  <Text style={styles.idBoxValue}>{profile?.patient_id || '—'}</Text>
                  <Text style={styles.idBoxHint}>Tap to copy</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.qrBtn} onPress={() => setQrVisible(true)}>
                  <Text style={styles.qrBtnText}>📲  Show QR Code</Text>
                </TouchableOpacity>
              </LinearGradient>

              <PatientQRModal
                visible={qrVisible}
                patientId={profile?.patient_id}
                patientName={profile?.full_name}
                onClose={() => setQrVisible(false)}
              />

              {/* Info rows */}
              <View style={styles.infoCard}>
                <Text style={styles.infoCardTitle}>Account Details</Text>
                {[
                  { label: 'Full Name',    value: profile?.full_name },
                  { label: 'Email',        value: profile?.email },
                  { label: 'Phone',        value: profile?.phone },
                  { label: 'Role',         value: profile?.role },
                  { label: 'Member Since', value: profile?.created_at ? new Date(profile.created_at).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }) : '—' },
                ].map(row => (
                  <View key={row.label} style={styles.infoRow}>
                    <Text style={styles.infoLabel}>{row.label}</Text>
                    <Text style={styles.infoValue}>{row.value || '—'}</Text>
                  </View>
                ))}
              </View>

              {/* Medical history summary */}
              <Text style={styles.sectionTitle}>Medical History Summary</Text>
              <View style={styles.summaryRow}>
                {[
                  { icon: '📋', label: 'Total Visits',   value: history.length,        color: '#185FA5', bg: '#E6F1FB' },
                  { icon: '🩺', label: 'Diagnoses',      value: diagnosesCount,        color: '#1a5c38', bg: '#EAF3DE' },
                  { icon: '💊', label: 'Prescriptions',  value: prescriptionsCount,    color: '#d97706', bg: '#fef3c7' },
                  { icon: '✅', label: 'Completed',      value: completedCount,        color: '#22c55e', bg: '#f0fdf4' },
                ].map(s => (
                  <View key={s.label} style={[styles.summaryCard, { backgroundColor: s.bg }]}>
                    <Text style={styles.summaryIcon}>{s.icon}</Text>
                    <Text style={[styles.summaryValue, { color: s.color }]}>{s.value}</Text>
                    <Text style={styles.summaryLabel}>{s.label}</Text>
                  </View>
                ))}
              </View>

              {/* Recent history */}
              {history.length > 0 && (
                <>
                  <Text style={styles.sectionTitle}>Recent Consultations</Text>
                  {history.slice(0, 5).map(h => (
                    <View key={h.id} style={styles.histCard}>
                      <View style={styles.histHeader}>
                        <Text style={styles.histDate}>
                          {new Date(h.consultation_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                        </Text>
                        <View style={[styles.histBadge, { backgroundColor: (STATUS_COLORS[h.status] || '#94a3b8') + '22' }]}>
                          <Text style={[styles.histBadgeText, { color: STATUS_COLORS[h.status] || '#94a3b8' }]}>{h.status}</Text>
                        </View>
                      </View>
                      {h.diagnosis    && <Text style={styles.histDetail}>🩺 {h.diagnosis}</Text>}
                      {h.prescription && <Text style={styles.histDetail}>💊 {h.prescription}</Text>}
                      {h.notes        && <Text style={styles.histDetail}>📝 {h.notes}</Text>}
                    </View>
                  ))}
                </>
              )}
            </>
          )}

          <View style={{ height: 20 }} />
        </ScrollView>
      </PatientLayout>
    </ProtectedRoute>
  );
};

const styles = StyleSheet.create({
  scroll:           { flex: 1, backgroundColor: '#f8fafc' },
  content:          { paddingBottom: 40 },

  header:           { padding: 28, alignItems: 'center', paddingTop: 32 },
  avatar:           { width: 80, height: 80, borderRadius: 40, backgroundColor: 'rgba(255,255,255,0.25)', justifyContent: 'center', alignItems: 'center', marginBottom: 12 },
  avatarText:       { color: '#fff', fontSize: 34, fontWeight: '800' },
  headerName:       { color: '#fff', fontSize: 20, fontWeight: '800', marginBottom: 4 },
  headerEmail:      { color: 'rgba(255,255,255,0.75)', fontSize: 13, marginBottom: 20 },

  idBox:            { backgroundColor: 'rgba(255,255,255,0.18)', borderRadius: 16, paddingHorizontal: 28, paddingVertical: 14, alignItems: 'center', borderWidth: 1, borderColor: 'rgba(255,255,255,0.3)', width: '100%' },
  idBoxLabel:       { color: 'rgba(255,255,255,0.7)', fontSize: 11, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 4 },
  idBoxValue:       { color: '#fff', fontSize: 22, fontWeight: '800', letterSpacing: 2, marginBottom: 4 },
  idBoxHint:        { color: 'rgba(255,255,255,0.55)', fontSize: 11 },

  qrBtn:            { backgroundColor: 'rgba(255,255,255,0.15)', borderRadius: 12, paddingVertical: 10, paddingHorizontal: 20, alignItems: 'center', borderWidth: 1, borderColor: 'rgba(255,255,255,0.25)', marginTop: 12, width: '100%' },
  qrBtnText:        { color: '#fff', fontWeight: '700', fontSize: 14 },

  infoCard:         { backgroundColor: '#fff', margin: 20, borderRadius: 18, padding: 20, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 8, elevation: 2 },
  infoCardTitle:    { fontSize: 15, fontWeight: '700', color: '#1a1a2e', marginBottom: 14 },
  infoRow:          { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 11, borderBottomWidth: 1, borderBottomColor: '#f1f5f9' },
  infoLabel:        { color: '#94a3b8', fontSize: 13 },
  infoValue:        { color: '#1a1a2e', fontWeight: '600', fontSize: 13, maxWidth: '60%', textAlign: 'right', textTransform: 'capitalize' },

  sectionTitle:     { fontSize: 15, fontWeight: '700', color: '#1a1a2e', marginBottom: 12, paddingHorizontal: 20 },

  summaryRow:       { flexDirection: 'row', gap: 10, marginBottom: 20, paddingHorizontal: 20 },
  summaryCard:      { flex: 1, borderRadius: 14, padding: 12, alignItems: 'center' },
  summaryIcon:      { fontSize: 18, marginBottom: 4 },
  summaryValue:     { fontSize: 18, fontWeight: '800', marginBottom: 2 },
  summaryLabel:     { fontSize: 9, color: '#64748b', fontWeight: '600', textAlign: 'center' },

  histCard:         { backgroundColor: '#fff', borderRadius: 14, padding: 14, marginBottom: 10, marginHorizontal: 20, borderLeftWidth: 3, borderLeftColor: '#1a5c38' },
  histHeader:       { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  histDate:         { fontWeight: '700', color: '#1a1a2e', fontSize: 13 },
  histBadge:        { paddingHorizontal: 10, paddingVertical: 3, borderRadius: 20 },
  histBadgeText:    { fontSize: 11, fontWeight: '600', textTransform: 'capitalize' },
  histDetail:       { color: '#475569', fontSize: 13, marginTop: 3, lineHeight: 18 },
});

export default PatientProfile;
