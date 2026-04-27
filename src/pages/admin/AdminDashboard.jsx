import React, { useEffect, useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView,
  TouchableOpacity, ActivityIndicator,
} from 'react-native';
import AdminLayout from '../../components/layouts/AdminLayout';
import ProtectedRoute from '../../components/ProtectedRoute';
import { useAuth } from '../../context/AuthContext';
import api from '../../../client-services/api';

const STAT_CONFIG = [
  { key: 'total_patients',      label: 'Total Patients',      icon: '🧑⚕️', color: '#22c55e', bg: '#052e16' },
  { key: 'total_doctors',       label: 'Total Doctors',       icon: '👨⚕️', color: '#3b82f6', bg: '#0c1a3a' },
  { key: 'total_consultations', label: 'Consultations',       icon: '📋',   color: '#a78bfa', bg: '#1e1040' },
];

const AdminDashboard = ({ navigation }) => {
  const { user } = useAuth();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/api/admin/stats')
      .then(res => setStats(res.data))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  return (
    <ProtectedRoute requiredRole="admin" navigation={navigation}>
      <AdminLayout navigation={navigation} activeScreen="AdminDashboard">
        <ScrollView style={styles.scroll} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>

          {/* Header */}
          <View style={styles.header}>
            <View>
              <Text style={styles.headerSub}>System Overview</Text>
              <Text style={styles.headerTitle}>Dashboard</Text>
            </View>
            <View style={styles.adminBadge}>
              <Text style={styles.adminBadgeText}>ADMIN</Text>
            </View>
          </View>

          {/* Stats */}
          {loading ? (
            <ActivityIndicator color="#94a3b8" style={{ marginTop: 40 }} />
          ) : (
            <View style={styles.statsGrid}>
              {STAT_CONFIG.map(s => (
                <View key={s.key} style={[styles.statCard, { backgroundColor: s.bg, borderColor: s.color + '44' }]}>
                  <View style={styles.statTop}>
                    <Text style={styles.statIcon}>{s.icon}</Text>
                    <View style={[styles.statDot, { backgroundColor: s.color }]} />
                  </View>
                  <Text style={[styles.statValue, { color: s.color }]}>{stats?.[s.key] ?? '—'}</Text>
                  <Text style={styles.statLabel}>{s.label}</Text>
                </View>
              ))}
            </View>
          )}

          {/* Quick nav */}
          <Text style={styles.sectionTitle}>Management</Text>
          <View style={styles.navCards}>
            <TouchableOpacity style={styles.navCard} onPress={() => navigation.navigate('AdminUsers')}>
              <View style={styles.navCardIcon}><Text style={styles.navCardEmoji}>👥</Text></View>
              <View style={styles.navCardInfo}>
                <Text style={styles.navCardTitle}>User Management</Text>
                <Text style={styles.navCardDesc}>View, filter, suspend or delete users</Text>
              </View>
              <Text style={styles.navCardArrow}>›</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.navCard} onPress={() => navigation.navigate('AdminSettings')}>
              <View style={styles.navCardIcon}><Text style={styles.navCardEmoji}>⚙️</Text></View>
              <View style={styles.navCardInfo}>
                <Text style={styles.navCardTitle}>System Settings</Text>
                <Text style={styles.navCardDesc}>Configure system-wide options</Text>
              </View>
              <Text style={styles.navCardArrow}>›</Text>
            </TouchableOpacity>
          </View>

          {/* Privacy notice */}
          <View style={styles.privacyNote}>
            <Text style={styles.privacyIcon}>🔒</Text>
            <Text style={styles.privacyText}>Patient medical records are not accessible from this panel. Privacy is enforced at the system level.</Text>
          </View>

          <View style={{ height: 20 }} />
        </ScrollView>
      </AdminLayout>
    </ProtectedRoute>
  );
};

const styles = StyleSheet.create({
  scroll:           { flex: 1 },
  content:          { padding: 24, paddingBottom: 40 },

  header:           { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 28 },
  headerSub:        { color: '#475569', fontSize: 13, marginBottom: 4 },
  headerTitle:      { color: '#f1f5f9', fontSize: 26, fontWeight: '800' },
  adminBadge:       { backgroundColor: '#334155', borderRadius: 8, paddingHorizontal: 12, paddingVertical: 5, borderWidth: 1, borderColor: '#475569' },
  adminBadgeText:   { color: '#94a3b8', fontSize: 11, fontWeight: '700', letterSpacing: 1 },

  statsGrid:        { flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginBottom: 32 },
  statCard:         { flex: 1, minWidth: '28%', borderRadius: 18, padding: 18, borderWidth: 1 },
  statTop:          { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 },
  statIcon:         { fontSize: 22 },
  statDot:          { width: 8, height: 8, borderRadius: 4 },
  statValue:        { fontSize: 30, fontWeight: '800', marginBottom: 4 },
  statLabel:        { color: '#64748b', fontSize: 12 },

  sectionTitle:     { color: '#94a3b8', fontSize: 12, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 14 },

  navCards:         { gap: 10, marginBottom: 28 },
  navCard:          { backgroundColor: '#1e293b', borderRadius: 16, padding: 18, flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderColor: '#334155' },
  navCardIcon:      { width: 44, height: 44, borderRadius: 12, backgroundColor: '#334155', justifyContent: 'center', alignItems: 'center', marginRight: 14 },
  navCardEmoji:     { fontSize: 20 },
  navCardInfo:      { flex: 1 },
  navCardTitle:     { color: '#f1f5f9', fontWeight: '700', fontSize: 15, marginBottom: 2 },
  navCardDesc:      { color: '#64748b', fontSize: 12 },
  navCardArrow:     { color: '#475569', fontSize: 22, fontWeight: '300' },

  privacyNote:      { backgroundColor: '#0f172a', borderRadius: 14, padding: 16, flexDirection: 'row', alignItems: 'flex-start', gap: 12, borderWidth: 1, borderColor: '#1e293b' },
  privacyIcon:      { fontSize: 18 },
  privacyText:      { flex: 1, color: '#475569', fontSize: 12, lineHeight: 18 },
});

export default AdminDashboard;
