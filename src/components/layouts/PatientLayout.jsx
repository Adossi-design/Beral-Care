import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, SafeAreaView } from 'react-native';
import { useAuth } from '../../context/AuthContext';

const PatientLayout = ({ children, navigation, activeScreen }) => {
  const { logout } = useAuth();

  const handleLogout = async () => {
    await logout();
    navigation.replace('Login');
  };

  const tabs = [
    { label: 'Dashboard',      screen: 'PatientDashboard',      icon: '🏠' },
    { label: 'Profile',        screen: 'PatientProfile',        icon: '👤' },
    { label: 'Appointments',   screen: 'PatientAppointments',   icon: '📅' },
    { label: 'Notifications',  screen: 'PatientNotifications',  icon: '🔔' },
  ];

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Beral Care</Text>
        <TouchableOpacity onPress={handleLogout}>
          <Text style={styles.logoutText}>Logout</Text>
        </TouchableOpacity>
      </View>
      <View style={styles.content}>{children}</View>
      <View style={styles.tabBar}>
        {tabs.map((tab) => (
          <TouchableOpacity
            key={tab.screen}
            style={styles.tab}
            onPress={() => navigation.navigate(tab.screen)}
          >
            <Text style={styles.tabIcon}>{tab.icon}</Text>
            <Text style={[styles.tabLabel, activeScreen === tab.screen && styles.tabLabelActive]}>
              {tab.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container:      { flex: 1, backgroundColor: '#EAF3DE' },
  header:         { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#1a5c38', paddingHorizontal: 20, paddingVertical: 14 },
  headerTitle:    { color: '#fff', fontSize: 18, fontWeight: 'bold' },
  logoutText:     { color: 'rgba(255,255,255,0.8)', fontSize: 14 },
  content:        { flex: 1 },
  tabBar:         { flexDirection: 'row', backgroundColor: '#fff', borderTopWidth: 1, borderTopColor: '#e2e8f0', paddingBottom: 8 },
  tab:            { flex: 1, alignItems: 'center', paddingTop: 10 },
  tabIcon:        { fontSize: 20 },
  tabLabel:       { fontSize: 11, color: '#94a3b8', marginTop: 2 },
  tabLabelActive: { color: '#1a5c38', fontWeight: '600' },
});

export default PatientLayout;
