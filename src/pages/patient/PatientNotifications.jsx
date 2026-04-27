import React, { useEffect, useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, ScrollView,
  TouchableOpacity, Alert, ActivityIndicator, RefreshControl,
} from 'react-native';
import PatientLayout from '../../components/layouts/PatientLayout';
import ProtectedRoute from '../../components/ProtectedRoute';
import api from '../../../client-services/api';

const STATUS_CONFIG = {
  pending:  { color: '#d97706', bg: '#fef3c7', icon: '⏳', label: 'Pending' },
  approved: { color: '#1a5c38', bg: '#EAF3DE', icon: '✅', label: 'Approved' },
  denied:   { color: '#ef4444', bg: '#fef2f2', icon: '✕',  label: 'Denied'  },
};

const PatientNotifications = ({ navigation }) => {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading]             = useState(true);
  const [refreshing, setRefreshing]       = useState(false);
  const [filter, setFilter]               = useState('all'); // 'all' | 'pending' | 'approved' | 'denied'

  const fetchNotifications = useCallback(async () => {
    try {
      const res = await api.get('/api/patient/notifications');
      setNotifications(res.data);
    } catch (e) {
      console.error('Notifications fetch error:', e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { fetchNotifications(); }, [fetchNotifications]);

  const handleDecision = async (id, decision) => {
    try {
      await api.patch(`/api/patient/access-requests/${id}`, { decision });
      setNotifications(prev =>
        prev.map(n => n.id === id ? { ...n, status: decision } : n)
      );
      Alert.alert('Done', `Access ${decision}`);
    } catch (e) {
      Alert.alert('Error', e.response?.data?.error || 'Failed to update');
    }
  };

  const filtered = filter === 'all'
    ? notifications
    : notifications.filter(n => n.status === filter);

  const pendingCount = notifications.filter(n => n.status === 'pending').length;

  return (
    <ProtectedRoute requiredRole="patient" navigation={navigation}>
      <PatientLayout navigation={navigation} activeScreen="PatientNotifications">
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); fetchNotifications(); }} colors={['#1a5c38']} />}
        >
          {/* Header */}
          <View style={styles.pageHeader}>
            <View>
              <Text style={styles.pageTitle}>Notifications</Text>
              <Text style={styles.pageSubtitle}>Doctor access requests to your records</Text>
            </View>
            {pendingCount > 0 && (
              <View style={styles.pendingBadge}>
                <Text style={styles.pendingBadgeText}>{pendingCount} pending</Text>
              </View>
            )}
          </View>

          {/* Filter tabs */}
          <View style={styles.filterRow}>
            {['all', 'pending', 'approved', 'denied'].map(f => (
              <TouchableOpacity
                key={f}
                style={[styles.filterTab, filter === f && styles.filterTabActive]}
                onPress={() => setFilter(f)}
              >
                <Text style={[styles.filterTabText, filter === f && styles.filterTabTextActive]}>
                  {f.charAt(0).toUpperCase() + f.slice(1)}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {loading ? (
            <ActivityIndicator color="#1a5c38" style={{ marginTop: 40 }} />
          ) : filtered.length === 0 ? (
            <View style={styles.emptyCard}>
              <Text style={styles.emptyIcon}>🔔</Text>
              <Text style={styles.emptyTitle}>No {filter === 'all' ? '' : filter} notifications</Text>
              <Text style={styles.emptyText}>
                {filter === 'all'
                  ? 'When a doctor requests access to your records, it will appear here.'
                  : `No ${filter} requests found.`}
              </Text>
            </View>
          ) : (
            filtered.map(n => {
              const cfg = STATUS_CONFIG[n.status] || STATUS_CONFIG.pending;
              return (
                <View key={n.id} style={styles.card}>
                  <View style={styles.cardTop}>
                    <View style={styles.doctorAvatar}>
                      <Text style={styles.doctorAvatarText}>{n.doctor_name?.[0]?.toUpperCase() || 'D'}</Text>
                    </View>
                    <View style={styles.cardInfo}>
                      <Text style={styles.doctorName}>{n.doctor_name}</Text>
                      <Text style={styles.doctorEmail}>{n.doctor_email}</Text>
                      <Text style={styles.cardDate}>
                        {new Date(n.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                      </Text>
                    </View>
                    <View style={[styles.statusBadge, { backgroundColor: cfg.bg }]}>
                      <Text style={[styles.statusText, { color: cfg.color }]}>{cfg.icon} {cfg.label}</Text>
                    </View>
                  </View>

                  <Text style={styles.cardDesc}>
                    is requesting access to your medical records
                  </Text>

                  {n.status === 'pending' && (
                    <View style={styles.actions}>
                      <TouchableOpacity style={styles.approveBtn} onPress={() => handleDecision(n.id, 'approved')}>
                        <Text style={styles.approveBtnText}>✓  Approve</Text>
                      </TouchableOpacity>
                      <TouchableOpacity style={styles.denyBtn} onPress={() => handleDecision(n.id, 'denied')}>
                        <Text style={styles.denyBtnText}>✕  Deny</Text>
                      </TouchableOpacity>
                    </View>
                  )}
                </View>
              );
            })
          )}

          <View style={{ height: 20 }} />
        </ScrollView>
      </PatientLayout>
    </ProtectedRoute>
  );
};

const styles = StyleSheet.create({
  scroll:             { flex: 1, backgroundColor: '#f8fafc' },
  content:            { padding: 20, paddingBottom: 40 },

  pageHeader:         { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20 },
  pageTitle:          { fontSize: 22, fontWeight: '800', color: '#1a1a2e' },
  pageSubtitle:       { fontSize: 13, color: '#64748b', marginTop: 2 },
  pendingBadge:       { backgroundColor: '#fef3c7', borderRadius: 20, paddingHorizontal: 12, paddingVertical: 5 },
  pendingBadgeText:   { color: '#d97706', fontSize: 12, fontWeight: '700' },

  filterRow:          { flexDirection: 'row', gap: 8, marginBottom: 20 },
  filterTab:          { flex: 1, paddingVertical: 8, borderRadius: 10, backgroundColor: '#f1f5f9', alignItems: 'center' },
  filterTabActive:    { backgroundColor: '#1a5c38' },
  filterTabText:      { fontSize: 12, fontWeight: '600', color: '#64748b' },
  filterTabTextActive:{ color: '#fff' },

  emptyCard:          { backgroundColor: '#fff', borderRadius: 20, padding: 36, alignItems: 'center', marginTop: 20 },
  emptyIcon:          { fontSize: 40, marginBottom: 12 },
  emptyTitle:         { fontSize: 16, fontWeight: '700', color: '#1a1a2e', marginBottom: 8 },
  emptyText:          { fontSize: 13, color: '#94a3b8', textAlign: 'center', lineHeight: 20 },

  card:               { backgroundColor: '#fff', borderRadius: 18, padding: 18, marginBottom: 12, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 8, elevation: 2 },
  cardTop:            { flexDirection: 'row', alignItems: 'flex-start', gap: 12, marginBottom: 10 },
  doctorAvatar:       { width: 46, height: 46, borderRadius: 23, backgroundColor: '#185FA5', justifyContent: 'center', alignItems: 'center' },
  doctorAvatarText:   { color: '#fff', fontSize: 18, fontWeight: '800' },
  cardInfo:           { flex: 1 },
  doctorName:         { fontSize: 15, fontWeight: '700', color: '#1a1a2e', marginBottom: 2 },
  doctorEmail:        { fontSize: 12, color: '#64748b', marginBottom: 2 },
  cardDate:           { fontSize: 11, color: '#94a3b8' },
  statusBadge:        { borderRadius: 20, paddingHorizontal: 10, paddingVertical: 4 },
  statusText:         { fontSize: 12, fontWeight: '700' },

  cardDesc:           { fontSize: 13, color: '#475569', marginBottom: 14 },

  actions:            { flexDirection: 'row', gap: 10 },
  approveBtn:         { flex: 1, backgroundColor: '#1a5c38', borderRadius: 12, paddingVertical: 11, alignItems: 'center' },
  approveBtnText:     { color: '#fff', fontWeight: '700', fontSize: 14 },
  denyBtn:            { flex: 1, backgroundColor: '#fef2f2', borderRadius: 12, paddingVertical: 11, alignItems: 'center', borderWidth: 1, borderColor: '#fecaca' },
  denyBtnText:        { color: '#ef4444', fontWeight: '700', fontSize: 14 },
});

export default PatientNotifications;
