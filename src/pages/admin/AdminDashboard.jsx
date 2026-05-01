import React, { useEffect, useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView,
  TouchableOpacity, ActivityIndicator, Dimensions,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import AdminLayout from '../../components/layouts/AdminLayout';
import ProtectedRoute from '../../components/ProtectedRoute';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../context/LanguageContext';
import api from '@client-services/api';

const { width } = Dimensions.get('window');

const STAT_CONFIG = [
  { key: 'total_patients',      label: 'totalPatients',      icon: '🧑⚕️', color: '#06b6d4', bg: '#cffafe' },
  { key: 'total_doctors',       label: 'totalDoctors',       icon: '👨⚕️', color: '#0891b2', bg: '#a5f3fc' },
  { key: 'total_consultations', label: 'consultations',       icon: '📋',   color: '#0e7490', bg: '#7dd3fc' },
];

const AdminDashboard = ({ navigation }) => {
  const { user } = useAuth();
  const { t } = useLanguage();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/api/admin/stats')
      .then(res => setStats(res.data))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const isTablet = width > 768;
  const isMobile = width <= 480;

  return (
    <ProtectedRoute requiredRole="admin" navigation={navigation}>
      <AdminLayout navigation={navigation} activeScreen="AdminDashboard">
        <ScrollView style={styles.scroll} contentContainerStyle={[styles.content, { padding: isTablet ? 32 : 24 }]} showsVerticalScrollIndicator={false}>

          {/* Header */}
          <LinearGradient colors={['#f8fafc', '#ecf0f1']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.header}>
            <View style={styles.headerContent}>
              <View>
                <Text style={[styles.headerSub, { fontSize: isTablet ? 14 : 12 }]}>{t('systemOverview')}</Text>
                <Text style={[styles.headerTitle, { fontSize: isTablet ? 36 : 28 }]}>{t('dashboard')}</Text>
              </View>
              <View style={styles.adminBadge}>
                <Text style={styles.adminBadgeEmoji}>👨💼</Text>
                <Text style={[styles.adminBadgeText, { fontSize: isTablet ? 13 : 11 }]}>ADMIN</Text>
              </View>
            </View>
          </LinearGradient>

          {/* Stats Grid */}
          <Text style={[styles.sectionTitle, { fontSize: isTablet ? 14 : 12 }]}>{t('statistics')}</Text>
          {loading ? (
            <ActivityIndicator color="#06b6d4" size="large" style={{ marginTop: 40 }} />
          ) : (
            <View style={[styles.statsGrid, { gap: isTablet ? 16 : 12 }]}>
              {STAT_CONFIG.map(s => (
                <View key={s.key} style={[styles.statCard, { backgroundColor: s.bg }]}>
                  <Text style={[styles.statIcon, { fontSize: isTablet ? 40 : 32 }]}>{s.icon}</Text>
                  <Text style={[styles.statValue, { color: s.color, fontSize: isTablet ? 32 : 24 }]}>{stats?.[s.key] ?? '—'}</Text>
                  <Text style={[styles.statLabel, { fontSize: isTablet ? 14 : 12 }]}>{t(s.label)}</Text>
                </View>
              ))}
            </View>
          )}

          {/* Management Section */}
          <Text style={[styles.sectionTitle, { fontSize: isTablet ? 14 : 12 }]}>{t('management')}</Text>
          <View style={[styles.navCards, { gap: isTablet ? 16 : 12 }]}>
            <TouchableOpacity 
              style={styles.navCard} 
              onPress={() => navigation.navigate('AdminUsers')}
              activeOpacity={0.7}
            >
              <View style={styles.navCardLeft}>
                <Text style={[styles.navCardEmoji, { fontSize: isTablet ? 32 : 24 }]}>👥</Text>
                <View>
                  <Text style={[styles.navCardTitle, { fontSize: isTablet ? 18 : 15 }]}>{t('userManagement')}</Text>
                  <Text style={[styles.navCardDesc, { fontSize: isTablet ? 14 : 12 }]}>{t('viewFilterSuspendDelete')}</Text>
                </View>
              </View>
              <Text style={[styles.navCardArrow, { fontSize: isTablet ? 32 : 24 }]}>›</Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={styles.navCard} 
              onPress={() => navigation.navigate('AdminSettings')}
              activeOpacity={0.7}
            >
              <View style={styles.navCardLeft}>
                <Text style={[styles.navCardEmoji, { fontSize: isTablet ? 32 : 24 }]}>⚙️</Text>
                <View>
                  <Text style={[styles.navCardTitle, { fontSize: isTablet ? 18 : 15 }]}>{t('systemSettings')}</Text>
                  <Text style={[styles.navCardDesc, { fontSize: isTablet ? 14 : 12 }]}>{t('configureSystemWide')}</Text>
                </View>
              </View>
              <Text style={[styles.navCardArrow, { fontSize: isTablet ? 32 : 24 }]}>›</Text>
            </TouchableOpacity>
          </View>

          {/* Privacy Notice */}
          <View style={styles.privacyNote}>
            <Text style={[styles.privacyIcon, { fontSize: isTablet ? 26 : 20 }]}>🔒</Text>
            <Text style={[styles.privacyText, { fontSize: isTablet ? 14 : 12 }]}>{t('privacyNotice')}</Text>
          </View>

          <View style={{ height: 20 }} />
        </ScrollView>
      </AdminLayout>
    </ProtectedRoute>
  );
};

const styles = StyleSheet.create({
  scroll:           { flex: 1, backgroundColor: '#f8fafc' },
  content:          { paddingBottom: 40 },

  header:           { paddingVertical: 28, paddingHorizontal: 24, marginBottom: 32, borderRadius: 14 },
  headerContent:    { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  headerSub:        { color: '#64748b', marginBottom: 4, fontWeight: '700' },
  headerTitle:      { color: '#1e293b', fontWeight: '900' },
  adminBadge:       { backgroundColor: '#06b6d4', borderRadius: 12, paddingHorizontal: 14, paddingVertical: 10, borderWidth: 1, borderColor: '#0891b2', flexDirection: 'row', alignItems: 'center', gap: 8 },
  adminBadgeEmoji:  { fontSize: 18 },
  adminBadgeText:   { color: '#ffffff', fontWeight: '900', letterSpacing: 0.5 },

  sectionTitle:     { color: '#1e293b', fontWeight: '900', textTransform: 'uppercase', letterSpacing: 1.5, marginBottom: 16, paddingHorizontal: 0 },

  statsGrid:        { flexDirection: 'row', marginBottom: 32 },
  statCard:         { flex: 1, borderRadius: 14, padding: 18, borderWidth: 1, borderColor: '#e2e8f0', shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 2, elevation: 1 },
  statIcon:         { marginBottom: 10 },
  statValue:        { fontWeight: '900', marginBottom: 6 },
  statLabel:        { color: '#64748b', fontWeight: '700' },

  navCards:         { marginBottom: 28 },
  navCard:          { backgroundColor: '#ffffff', borderRadius: 14, padding: 18, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', borderWidth: 1, borderColor: '#e2e8f0', shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 2, elevation: 1 },
  navCardLeft:      { flexDirection: 'row', alignItems: 'center', gap: 14, flex: 1 },
  navCardEmoji:     { },
  navCardTitle:     { color: '#1e293b', fontWeight: '900', marginBottom: 4 },
  navCardDesc:      { color: '#64748b', fontWeight: '600' },
  navCardArrow:     { color: '#06b6d4', fontWeight: '300' },

  privacyNote:      { backgroundColor: '#cffafe', borderRadius: 14, padding: 18, flexDirection: 'row', alignItems: 'flex-start', gap: 14, borderWidth: 1, borderColor: '#06b6d4' },
  privacyIcon:      { },
  privacyText:      { flex: 1, color: '#0c4a6e', lineHeight: 20, fontWeight: '700' },
});

export default AdminDashboard;
