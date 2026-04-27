import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, SafeAreaView } from 'react-native';
import { useAuth } from '../../context/AuthContext';

const AdminLayout = ({ children, navigation, activeScreen }) => {
  const { logout } = useAuth();

  const handleLogout = async () => {
    await logout();
    navigation.replace('Login');
  };

  const navItems = [
    { label: 'Dashboard', screen: 'AdminDashboard', icon: '📊' },
    { label: 'Users',     screen: 'AdminUsers',     icon: '👥' },
    { label: 'Settings',  screen: 'AdminSettings',  icon: '⚙️' },
  ];

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.sidebar}>
        <Text style={styles.brand}>Beral Care</Text>
        <Text style={styles.brandSub}>System Admin</Text>
        {navItems.map((item) => (
          <TouchableOpacity
            key={item.screen}
            style={[styles.navItem, activeScreen === item.screen && styles.navItemActive]}
            onPress={() => navigation.navigate(item.screen)}
          >
            <Text style={styles.navIcon}>{item.icon}</Text>
            <Text style={[styles.navLabel, activeScreen === item.screen && styles.navLabelActive]}>
              {item.label}
            </Text>
          </TouchableOpacity>
        ))}
        <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
          <Text style={styles.logoutText}>🚪 Logout</Text>
        </TouchableOpacity>
      </View>
      <View style={styles.content}>{children}</View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container:    { flex: 1, flexDirection: 'row', backgroundColor: '#0f172a' },
  sidebar:      { width: 200, backgroundColor: '#1e293b', padding: 20, paddingTop: 40 },
  brand:        { color: '#fff', fontSize: 18, fontWeight: 'bold' },
  brandSub:     { color: '#94a3b8', fontSize: 12, marginBottom: 30 },
  navItem:      { flexDirection: 'row', alignItems: 'center', paddingVertical: 12, paddingHorizontal: 10, borderRadius: 8, marginBottom: 4 },
  navItemActive:{ backgroundColor: '#334155' },
  navIcon:      { fontSize: 16, marginRight: 10 },
  navLabel:     { color: '#94a3b8', fontSize: 14 },
  navLabelActive:{ color: '#fff', fontWeight: '600' },
  logoutBtn:    { marginTop: 'auto', paddingVertical: 12 },
  logoutText:   { color: '#f87171', fontSize: 14 },
  content:      { flex: 1, backgroundColor: '#0f172a' },
});

export default AdminLayout;
