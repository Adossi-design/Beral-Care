import React, { useEffect, useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, ScrollView,
  TextInput, TouchableOpacity, Alert, ActivityIndicator,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import DoctorLayout from '../../components/layouts/DoctorLayout';
import ProtectedRoute from '../../components/ProtectedRoute';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../context/LanguageContext';
import api from '@client-services/api';

const STATUS_COLORS = { pending: '#f59e0b', completed: '#22c55e', cancelled: '#ef4444' };

const DoctorDashboard = ({ navigation, route }) => {
  const { user } = useAuth();
  const { t } = useLanguage();
  const [patientIdInput, setPatientIdInput] = useState(route?.params?.prefillPatientId || '');
  const [searching, setSearching] = useState(false);
  const [appointments, setAppointments] = useState([]);
  const [recentPatients, setRecentPatients] = useState([]);
  const [loadingAppts, setLoadingAppts] = useState(true);

  useEffect(() => {
    Promise.all([
      api.get('/api/doctor/appointments'),
      api.get('/api/doctor/recent-patients'),
    ])
      .then(([apptRes, recentRes]) => {
        const todayStr = new Date().toISOString().split('T')[0];
        const todaysOnly = apptRes.data.filter(a => {
          const apptDate = new Date(a.consultation_date).toISOString().split('T')[0];
          return apptDate === todayStr;
        });
        setAppointments(todaysOnly);
        setRecentPatients(recentRes.data);
      })
      .catch(console.error)
      .finally(() => setLoadingAppts(false));
  }, []);

  const handlePatientSearch = useCallback(async (overrideId) => {
    const idToSearch = (overrideId || patientIdInput).trim();
    if (!idToSearch) return;
    setSearching(true);
    try {
      const res = await api.get(`/api/doctor/patient/${idToSearch}`);
      navigation.navigate('DoctorPatients', { patientData: res.data });
    } catch (error) {
      Alert.alert(t('patientLookup'), error.response?.data?.error || t('patientNotFound'));
    } finally {
      setSearching(false);
    }
  }, [patientIdInput, navigation, t]);

  useEffect(() => {
    const prefill = route?.params?.prefillPatientId;
    if (prefill) {
      setPatientIdInput(prefill);
      handlePatientSearch(prefill);
    }
  }, [route?.params?.prefillPatientId, handlePatientSearch]);

  return (
    <ProtectedRoute requiredRole="doctor" navigation={navigation}>
      <DoctorLayout navigation={navigation} activeScreen="DoctorDashboard">
        <ScrollView style={styles.scroll} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>

          {/* Greeting */}
          <View style={styles.greetRow}>
            <View>
              <Text style={styles.greetSub}>{t('goodDay')},</Text>
              <Text style={styles.greetName}>Dr. {user?.name || 'Doctor'} 👋</Text>
            </View>
            <View style={styles.avatarCircle}>
              <Text style={styles.avatarText}>{(user?.name || 'D')[0].toUpperCase()}</Text>
            </View>
          </View>

          {/* Patient search */}
          <LinearGradient colors={['#185FA5', '#1a6bbf']} style={styles.searchCard} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}>
            <Text style={styles.searchCardTitle}>🔍  {t('patientLookup')}</Text>
            <Text style={styles.searchCardSub}>{t('enterPatientId')}</Text>
            <View style={styles.searchRow}>
              <TextInput
                style={styles.searchInput}
                placeholder="e.g. BC-2026-00123"
                placeholderTextColor="rgba(255,255,255,0.55)"
                value={patientIdInput}
                onChangeText={setPatientIdInput}
                autoCapitalize="characters"
              />
              <TouchableOpacity
                style={[styles.searchBtn, searching && styles.searchBtnDisabled]}
                onPress={() => handlePatientSearch()}
                disabled={searching}
              >
                <Text style={styles.searchBtnText}>{searching ? '...' : t('search')}</Text>
              </TouchableOpacity>
            </View>
            <Text style={styles.searchNote}>⚠️  {t('mustApproveAccess')}</Text>
          </LinearGradient>

          {/* Quick actions */}
          <Text style={styles.sectionTitle}>{t('quickActions')}</Text>
          <View style={styles.quickRow}>
            {[
              { icon: '👥', label: t('myPatients'),      screen: 'DoctorPatients',     bg: '#E6F1FB', color: '#185FA5' },
              { icon: '➕', label: t('createPatient'),   screen: 'DoctorPatients',     bg: '#EAF3DE', color: '#1a5c38', params: { createMode: true } },
              { icon: '📅', label: t('appointments'),     screen: 'DoctorAppointments', bg: '#fef3c7', color: '#d97706' },
            ].map(q => (
              <TouchableOpacity
                key={q.label}
                style={[styles.quickCard, { backgroundColor: q.bg }]}
                onPress={() => navigation.navigate(q.screen, q.params)}
              >
                <Text style={styles.quickIcon}>{q.icon}</Text>
                <Text style={[styles.quickLabel, { color: q.color }]}>{q.label}</Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Today's appointments */}
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>{t('todaysAppointments')}</Text>
            <TouchableOpacity onPress={() => navigation.navigate('DoctorAppointments')}>
              <Text style={styles.seeAll}>{t('seeAll')}</Text>
            </TouchableOpacity>
          </View>

          {loadingAppts ? (
            <ActivityIndicator color="#185FA5" style={{ marginTop: 16 }} />
          ) : appointments.length === 0 ? (
            <View style={styles.emptyCard}>
              <Text style={styles.emptyIcon}>📭</Text>
              <Text style={styles.emptyText}>{t('noAppointmentsScheduled')}</Text>
            </View>
          ) : (
            appointments.slice(0, 4).map(a => (
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

          {/* Recently accessed patients */}
          {recentPatients.length > 0 && (
            <>
              <Text style={styles.sectionTitle}>{t('recentlyAccessedPatients')}</Text>
              {recentPatients.slice(0, 5).map(p => (
                <TouchableOpacity
                  key={p.id}
                  style={styles.recentCard}
                  onPress={() => {
                    setPatientIdInput(p.patient_id);
                  }}
                >
                  <View style={styles.recentAvatar}>
                    <Text style={styles.recentAvatarText}>{p.full_name[0].toUpperCase()}</Text>
                  </View>
                  <View style={styles.recentInfo}>
                    <Text style={styles.recentName}>{p.full_name}</Text>
                    <Text style={styles.recentId}>{p.patient_id}</Text>
                  </View>
                  <Text style={styles.recentArrow}>›</Text>
                </TouchableOpacity>
              ))}
            </>
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

  greetRow:           { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  greetSub:           { fontSize: 13, color: '#94a3b8' },
  greetName:          { fontSize: 20, fontWeight: '800', color: '#1a1a2e' },
  avatarCircle:       { width: 46, height: 46, borderRadius: 23, backgroundColor: '#185FA5', justifyContent: 'center', alignItems: 'center' },
  avatarText:         { color: '#fff', fontSize: 18, fontWeight: '800' },

  searchCard:         { borderRadius: 22, padding: 22, marginBottom: 24, shadowColor: '#185FA5', shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.3, shadowRadius: 14, elevation: 8 },
  searchCardTitle:    { color: '#fff', fontSize: 17, fontWeight: '800', marginBottom: 4 },
  searchCardSub:      { color: 'rgba(255,255,255,0.75)', fontSize: 13, marginBottom: 16 },
  searchRow:          { flexDirection: 'row', gap: 10, marginBottom: 12 },
  searchInput:        { flex: 1, backgroundColor: 'rgba(255,255,255,0.18)', borderRadius: 14, paddingHorizontal: 16, paddingVertical: 13, fontSize: 15, color: '#fff', borderWidth: 1, borderColor: 'rgba(255,255,255,0.3)' },
  searchBtn:          { backgroundColor: '#fff', borderRadius: 14, paddingHorizontal: 18, justifyContent: 'center' },
  searchBtnDisabled:  { opacity: 0.6 },
  searchBtnText:      { color: '#185FA5', fontWeight: '800', fontSize: 14 },
  searchNote:         { color: 'rgba(255,255,255,0.65)', fontSize: 11 },

  sectionHeader:      { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  sectionTitle:       { fontSize: 16, fontWeight: '700', color: '#1a1a2e', marginBottom: 12 },
  seeAll:             { color: '#185FA5', fontSize: 13, fontWeight: '600' },

  quickRow:           { flexDirection: 'row', gap: 10, marginBottom: 24 },
  quickCard:          { flex: 1, borderRadius: 16, padding: 14, alignItems: 'center' },
  quickIcon:          { fontSize: 24, marginBottom: 6 },
  quickLabel:         { fontSize: 11, fontWeight: '700', textAlign: 'center' },

  emptyCard:          { backgroundColor: '#fff', borderRadius: 16, padding: 28, alignItems: 'center' },
  emptyIcon:          { fontSize: 36, marginBottom: 10 },
  emptyText:          { color: '#94a3b8', fontSize: 14 },

  apptCard:           { backgroundColor: '#fff', borderRadius: 16, padding: 16, marginBottom: 10, flexDirection: 'row', alignItems: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 8, elevation: 2 },
  apptAccent:         { width: 4, height: 40, borderRadius: 2, marginRight: 14 },
  apptInfo:           { flex: 1 },
  apptDate:           { fontWeight: '700', color: '#1a1a2e', fontSize: 14 },
  apptNotes:          { color: '#64748b', fontSize: 12, marginTop: 3 },
  apptBadge:          { paddingHorizontal: 12, paddingVertical: 4, borderRadius: 20 },
  apptBadgeText:      { fontSize: 12, fontWeight: '600', textTransform: 'capitalize' },

  recentCard:         { backgroundColor: '#fff', borderRadius: 14, padding: 14, marginBottom: 10, flexDirection: 'row', alignItems: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 6, elevation: 2 },
  recentAvatar:       { width: 40, height: 40, borderRadius: 20, backgroundColor: '#E6F1FB', justifyContent: 'center', alignItems: 'center', marginRight: 12 },
  recentAvatarText:   { color: '#185FA5', fontWeight: '800', fontSize: 16 },
  recentInfo:         { flex: 1 },
  recentName:         { fontWeight: '700', color: '#1a1a2e', fontSize: 14 },
  recentId:           { color: '#185FA5', fontSize: 12, marginTop: 2 },
  recentArrow:        { color: '#94a3b8', fontSize: 20 },
});

export default DoctorDashboard;
