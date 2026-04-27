import React, { useEffect, useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView,
  TouchableOpacity, Alert, ActivityIndicator, Clipboard,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import PatientLayout from '../../components/layouts/PatientLayout';
import ProtectedRoute from '../../components/ProtectedRoute';
import PatientQRModal from '../../components/PatientQRModal';
import { useAuth } from '../../context/AuthContext';
import api from '../../../client-services/api';

const STATUS_COLORS = { pending: '#f59e0b', completed: '#22c55e', cancelled: '#ef4444' };

const PatientDashboard = ({ navigation }) => {
  const { user } = useAuth();
  const [appointments, setAppointments] = useState([]);
  const [accessRequests, setAccessRequests] = useState([]);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [qrVisible, setQrVisible] = useState(false);

  useEffect(() => {
    Promise.all([
      api.get('/api/patient/appointments'),
      api.get('/api/patient/access-requests'),
      api.get('/api/patient/history'),
    ])
      .then(([apptRes, accessRes, histRes]) => {
        setAppointments(apptRes.data);
        setAccessRequests(accessRes.data);
        setHistory(histRes.data);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const handleCopyId = () => {
    Clipboard.setString(user?.patient_id || '');
    Alert.alert('Copied!', `Patient ID ${user?.patient_id} copied to clipboard`);
  };

  const handleAccessDecision = async (requestId, decision) => {
    try {
      await api.patch(`/api/patient/access-requests/${requestId}`, { decision });
      setAccessRequests(prev => prev.filter(r => r.id !== requestId));
      Alert.alert('Done', `Access ${decision}`);
    } catch (error) {
      Alert.alert('Error', error.response?.data?.error || 'Failed to update access');
    }
  };

  // Derive summary counts from history
  const diagnosesCount    = history.filter(h => h.diagnosis).length;
  const prescriptionsCount = history.filter(h => h.prescription).length;
  const completedCount    = history.filter(h => h.status === 'completed').length;

  return (
    <ProtectedRoute requiredRole="patient" navigation={navigation}>
      <PatientLayout navigation={navigation} activeScreen="PatientDashboard">
        <ScrollView style={styles.scroll} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>

          {/* Greeting */}
          <View style={styles.greetRow}>
            <View>
              <Text style={styles.greetSub}>Good day,</Text>
              <Text style={styles.greetName}>{user?.name || 'Patient'} 👋</Text>
            </View>
            <View style={styles.avatarCircle}>
              <Text style={styles.avatarText}>{(user?.name || 'P')[0].toUpperCase()}</Text>
            </View>
          </View>

          {/* Patient ID card */}
          <LinearGradient colors={['#1a5c38', '#2d8653']} style={styles.idCard} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}>
            <View style={styles.idCardTop}>
              <View>
                <Text style={styles.idCardLabel}>Your Patient ID</Text>
                <Text style={styles.idCardValue}>{user?.patient_id || '—'}</Text>
              </View>
              <Text style={styles.idCardEmoji}>🪪</Text>
            </View>
            <Text style={styles.idCardHint}>Share this ID with your doctor to grant them access to your records</Text>
            <View style={styles.idCardBtns}>
              <TouchableOpacity style={styles.copyBtn} onPress={handleCopyId}>
                <Text style={styles.copyBtnText}>📋  Copy ID</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.qrBtn} onPress={() => setQrVisible(true)}>
                <Text style={styles.qrBtnText}>📲  Show QR</Text>
              </TouchableOpacity>
            </View>
          </LinearGradient>

          <PatientQRModal
            visible={qrVisible}
            patientId={user?.patient_id}
            patientName={user?.name}
            onClose={() => setQrVisible(false)}
          />

          {/* Access requests notification */}
          {accessRequests.length > 0 && (
            <View style={styles.notifSection}>
              <View style={styles.notifHeader}>
                <View style={styles.notifDot} />
                <Text style={styles.sectionTitle}>Access Requests</Text>
                <View style={styles.notifBadge}>
                  <Text style={styles.notifBadgeText}>{accessRequests.length}</Text>
                </View>
              </View>
              {accessRequests.map(r => (
                <View key={r.id} style={styles.requestCard}>
                  <View style={styles.requestTop}>
                    <Text style={styles.requestIcon}>👨⚕️</Text>
                    <View style={styles.requestInfo}>
                      <Text style={styles.requestDoctor}>{r.doctor_name}</Text>
                      <Text style={styles.requestDesc}>is requesting access to your medical records</Text>
                    </View>
                  </View>
                  <View style={styles.requestActions}>
                    <TouchableOpacity style={styles.approveBtn} onPress={() => handleAccessDecision(r.id, 'approved')}>
                      <Text style={styles.approveBtnText}>✓  Approve</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.denyBtn} onPress={() => handleAccessDecision(r.id, 'denied')}>
                      <Text style={styles.denyBtnText}>✕  Deny</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              ))}
            </View>
          )}

          {/* Medical history summary */}
          <Text style={styles.sectionTitle}>Medical History Summary</Text>
          {loading ? (
            <ActivityIndicator color="#1a5c38" style={{ marginBottom: 20 }} />
          ) : (
            <>
              <View style={styles.summaryRow}>
                {[
                  { icon: '🩺', label: 'Diagnoses',     value: diagnosesCount,     color: '#185FA5', bg: '#E6F1FB' },
                  { icon: '💊', label: 'Prescriptions', value: prescriptionsCount, color: '#1a5c38', bg: '#EAF3DE' },
                  { icon: '✅', label: 'Completed',     value: completedCount,     color: '#22c55e', bg: '#f0fdf4' },
                ].map(s => (
                  <View key={s.label} style={[styles.summaryCard, { backgroundColor: s.bg }]}>
                    <Text style={styles.summaryIcon}>{s.icon}</Text>
                    <Text style={[styles.summaryValue, { color: s.color }]}>{s.value}</Text>
                    <Text style={styles.summaryLabel}>{s.label}</Text>
                  </View>
                ))}
              </View>

              {/* Recent history entries */}
              {history.slice(0, 3).map(h => (
                <View key={h.id} style={styles.historyCard}>
                  <View style={styles.historyHeader}>
                    <Text style={styles.historyDate}>
                      {new Date(h.consultation_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                    </Text>
                    <View style={[styles.historyBadge, { backgroundColor: (STATUS_COLORS[h.status] || '#94a3b8') + '22' }]}>
                      <Text style={[styles.historyBadgeText, { color: STATUS_COLORS[h.status] || '#94a3b8' }]}>{h.status}</Text>
                    </View>
                  </View>
                  {h.diagnosis && (
                    <View style={styles.historyRow}>
                      <Text style={styles.historyRowIcon}>🩺</Text>
                      <Text style={styles.historyRowText} numberOfLines={1}>{h.diagnosis}</Text>
                    </View>
                  )}
                  {h.prescription && (
                    <View style={styles.historyRow}>
                      <Text style={styles.historyRowIcon}>💊</Text>
                      <Text style={styles.historyRowText} numberOfLines={1}>{h.prescription}</Text>
                    </View>
                  )}
                  {h.notes && (
                    <View style={styles.historyRow}>
                      <Text style={styles.historyRowIcon}>📝</Text>
                      <Text style={styles.historyRowText} numberOfLines={1}>{h.notes}</Text>
                    </View>
                  )}
                </View>
              ))}

              {history.length > 3 && (
                <TouchableOpacity style={styles.viewMoreBtn} onPress={() => navigation.navigate('PatientAppointments')}>
                  <Text style={styles.viewMoreText}>View full history →</Text>
                </TouchableOpacity>
              )}
            </>
          )}

          {/* Quick actions */}
          <Text style={styles.sectionTitle}>Quick Actions</Text>
          <View style={styles.quickRow}>
            {[
              { icon: '📅', label: 'Book Appointment', screen: 'PatientAppointments', bg: '#EAF3DE', color: '#1a5c38' },
              { icon: '👤', label: 'My Profile',        screen: 'PatientProfile',      bg: '#E6F1FB', color: '#185FA5' },
            ].map(q => (
              <TouchableOpacity key={q.screen} style={[styles.quickCard, { backgroundColor: q.bg }]} onPress={() => navigation.navigate(q.screen)}>
                <Text style={styles.quickIcon}>{q.icon}</Text>
                <Text style={[styles.quickLabel, { color: q.color }]}>{q.label}</Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Upcoming appointments */}
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Upcoming Appointments</Text>
            <TouchableOpacity onPress={() => navigation.navigate('PatientAppointments')}>
              <Text style={styles.seeAll}>See all</Text>
            </TouchableOpacity>
          </View>

          {loading ? (
            <ActivityIndicator color="#1a5c38" style={{ marginTop: 16 }} />
          ) : appointments.length === 0 ? (
            <View style={styles.emptyCard}>
              <Text style={styles.emptyIcon}>📭</Text>
              <Text style={styles.emptyText}>No upcoming appointments</Text>
              <TouchableOpacity style={styles.emptyBtn} onPress={() => navigation.navigate('PatientAppointments')}>
                <Text style={styles.emptyBtnText}>Book your first appointment</Text>
              </TouchableOpacity>
            </View>
          ) : (
            appointments.slice(0, 3).map(a => (
              <View key={a.id} style={styles.apptCard}>
                <View style={[styles.apptAccent, { backgroundColor: STATUS_COLORS[a.status] || '#94a3b8' }]} />
                <View style={styles.apptInfo}>
                  <Text style={styles.apptDate}>{new Date(a.consultation_date).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}</Text>
                  {a.notes ? <Text style={styles.apptNotes} numberOfLines={1}>{a.notes}</Text> : null}
                </View>
                <View style={[styles.apptBadge, { backgroundColor: (STATUS_COLORS[a.status] || '#94a3b8') + '22' }]}>
                  <Text style={[styles.apptBadgeText, { color: STATUS_COLORS[a.status] || '#94a3b8' }]}>{a.status}</Text>
                </View>
              </View>
            ))
          )}

          <View style={{ height: 20 }} />
        </ScrollView>
      </PatientLayout>
    </ProtectedRoute>
  );
};

const styles = StyleSheet.create({
  scroll:           { flex: 1, backgroundColor: '#f8fafc' },
  content:          { padding: 20, paddingBottom: 40 },

  greetRow:         { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  greetSub:         { fontSize: 13, color: '#94a3b8' },
  greetName:        { fontSize: 22, fontWeight: '800', color: '#1a1a2e' },
  avatarCircle:     { width: 46, height: 46, borderRadius: 23, backgroundColor: '#1a5c38', justifyContent: 'center', alignItems: 'center' },
  avatarText:       { color: '#fff', fontSize: 18, fontWeight: '800' },

  idCard:           { borderRadius: 22, padding: 22, marginBottom: 24, shadowColor: '#1a5c38', shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.25, shadowRadius: 14, elevation: 8 },
  idCardTop:        { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 },
  idCardLabel:      { color: 'rgba(255,255,255,0.72)', fontSize: 12, marginBottom: 6, textTransform: 'uppercase', letterSpacing: 0.8 },
  idCardValue:      { color: '#fff', fontSize: 24, fontWeight: '800', letterSpacing: 2 },
  idCardEmoji:      { fontSize: 36 },
  idCardHint:       { color: 'rgba(255,255,255,0.68)', fontSize: 12, lineHeight: 18, marginBottom: 16 },
  idCardBtns:       { flexDirection: 'row', gap: 10 },
  copyBtn:          { flex: 1, backgroundColor: 'rgba(255,255,255,0.2)', borderRadius: 12, paddingVertical: 10, alignItems: 'center', borderWidth: 1, borderColor: 'rgba(255,255,255,0.3)' },
  copyBtnText:      { color: '#fff', fontWeight: '700', fontSize: 13 },
  qrBtn:            { flex: 1, backgroundColor: 'rgba(255,255,255,0.15)', borderRadius: 12, paddingVertical: 10, alignItems: 'center', borderWidth: 1, borderColor: 'rgba(255,255,255,0.25)' },
  qrBtnText:        { color: '#fff', fontWeight: '700', fontSize: 13 },

  notifSection:     { marginBottom: 20 },
  notifHeader:      { flexDirection: 'row', alignItems: 'center', marginBottom: 12, gap: 8 },
  notifDot:         { width: 8, height: 8, borderRadius: 4, backgroundColor: '#f59e0b' },
  notifBadge:       { backgroundColor: '#fef3c7', borderRadius: 10, paddingHorizontal: 8, paddingVertical: 2 },
  notifBadgeText:   { color: '#d97706', fontSize: 12, fontWeight: '700' },

  requestCard:      { backgroundColor: '#fff', borderRadius: 16, padding: 16, marginBottom: 10, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 8, elevation: 2 },
  requestTop:       { flexDirection: 'row', alignItems: 'flex-start', gap: 12, marginBottom: 14 },
  requestIcon:      { fontSize: 28 },
  requestInfo:      { flex: 1 },
  requestDoctor:    { fontSize: 15, fontWeight: '700', color: '#1a1a2e', marginBottom: 2 },
  requestDesc:      { fontSize: 13, color: '#64748b' },
  requestActions:   { flexDirection: 'row', gap: 10 },
  approveBtn:       { flex: 1, backgroundColor: '#1a5c38', borderRadius: 12, paddingVertical: 11, alignItems: 'center' },
  approveBtnText:   { color: '#fff', fontWeight: '700', fontSize: 14 },
  denyBtn:          { flex: 1, backgroundColor: '#fef2f2', borderRadius: 12, paddingVertical: 11, alignItems: 'center', borderWidth: 1, borderColor: '#fecaca' },
  denyBtnText:      { color: '#ef4444', fontWeight: '700', fontSize: 14 },

  summaryRow:       { flexDirection: 'row', gap: 10, marginBottom: 16 },
  summaryCard:      { flex: 1, borderRadius: 16, padding: 14, alignItems: 'center' },
  summaryIcon:      { fontSize: 22, marginBottom: 6 },
  summaryValue:     { fontSize: 22, fontWeight: '800', marginBottom: 2 },
  summaryLabel:     { fontSize: 11, color: '#64748b', fontWeight: '600' },

  historyCard:      { backgroundColor: '#fff', borderRadius: 14, padding: 14, marginBottom: 10, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 6, elevation: 2 },
  historyHeader:    { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  historyDate:      { fontWeight: '700', color: '#1a1a2e', fontSize: 13 },
  historyBadge:     { paddingHorizontal: 10, paddingVertical: 3, borderRadius: 20 },
  historyBadgeText: { fontSize: 11, fontWeight: '600', textTransform: 'capitalize' },
  historyRow:       { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 4 },
  historyRowIcon:   { fontSize: 14 },
  historyRowText:   { flex: 1, color: '#475569', fontSize: 13 },

  viewMoreBtn:      { alignItems: 'center', paddingVertical: 10, marginBottom: 16 },
  viewMoreText:     { color: '#1a5c38', fontWeight: '700', fontSize: 13 },

  sectionHeader:    { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  sectionTitle:     { fontSize: 16, fontWeight: '700', color: '#1a1a2e', marginBottom: 12 },
  seeAll:           { color: '#1a5c38', fontSize: 13, fontWeight: '600' },

  quickRow:         { flexDirection: 'row', gap: 12, marginBottom: 24 },
  quickCard:        { flex: 1, borderRadius: 16, padding: 18, alignItems: 'center' },
  quickIcon:        { fontSize: 28, marginBottom: 8 },
  quickLabel:       { fontSize: 13, fontWeight: '700', textAlign: 'center' },

  emptyCard:        { backgroundColor: '#fff', borderRadius: 16, padding: 28, alignItems: 'center', marginBottom: 16 },
  emptyIcon:        { fontSize: 36, marginBottom: 10 },
  emptyText:        { color: '#94a3b8', fontSize: 14, marginBottom: 14 },
  emptyBtn:         { backgroundColor: '#EAF3DE', borderRadius: 12, paddingHorizontal: 18, paddingVertical: 10 },
  emptyBtnText:     { color: '#1a5c38', fontWeight: '700', fontSize: 13 },

  apptCard:         { backgroundColor: '#fff', borderRadius: 16, padding: 16, marginBottom: 10, flexDirection: 'row', alignItems: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 8, elevation: 2 },
  apptAccent:       { width: 4, height: 40, borderRadius: 2, marginRight: 14 },
  apptInfo:         { flex: 1 },
  apptDate:         { fontWeight: '700', color: '#1a1a2e', fontSize: 14 },
  apptNotes:        { color: '#64748b', fontSize: 12, marginTop: 3 },
  apptBadge:        { paddingHorizontal: 12, paddingVertical: 4, borderRadius: 20 },
  apptBadgeText:    { fontSize: 12, fontWeight: '600', textTransform: 'capitalize' },
});

export default PatientDashboard;
