import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, SafeAreaView, Dimensions } from 'react-native';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../context/LanguageContext';

const { width } = Dimensions.get('window');

const AdminLayout = ({ children, navigation, activeScreen }) => {
  const { logout } = useAuth();
  const { language, changeLanguage } = useLanguage();

  const handleLogout = async () => {
    await logout();
    navigation.replace('Login');
  };

  const navItems = [
    { label: 'Dashboard', screen: 'AdminDashboard', icon: '📊' },
    { label: 'Users',     screen: 'AdminUsers',     icon: '👥' },
    { label: 'Settings',  screen: 'AdminSettings',  icon: '⚙️' },
  ];

  const sidebarWidth = width > 768 ? 260 : width > 480 ? 220 : 180;

  return (
    <SafeAreaView style={styles.container}>
      <View style={[styles.sidebar, { width: sidebarWidth }]}>
        {/* Language Switcher at Top */}
        <View style={styles.languageSwitcher}>
          <TouchableOpacity
            style={[styles.langBtn, language === 'en' && styles.langBtnActive]}
            onPress={() => changeLanguage('en')}
          >
            <Text style={[styles.langText, language === 'en' && styles.langTextActive]}>EN</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.langBtn, language === 'fr' && styles.langBtnActive]}
            onPress={() => changeLanguage('fr')}
          >
            <Text style={[styles.langText, language === 'fr' && styles.langTextActive]}>FR</Text>
          </TouchableOpacity>
        </View>

        <Text style={styles.brand}>Beral Care</Text>
        <Text style={styles.brandSub}>Admin Panel</Text>
        
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
  container:    { flex: 1, flexDirection: 'row', backgroundColor: '#f8fafc' },
  sidebar:      { backgroundColor: '#1e293b', padding: width > 768 ? 24 : 20, paddingTop: 20, borderRightWidth: 1, borderRightColor: '#0f172a' },
  
  languageSwitcher: { flexDirection: 'row', gap: 10, marginBottom: 28, paddingBottom: 20, borderBottomWidth: 1, borderBottomColor: '#334155' },
  langBtn:      { flex: 1, paddingVertical: 10, borderRadius: 8, backgroundColor: '#334155', borderWidth: 1, borderColor: '#475569', alignItems: 'center' },
  langBtnActive:{ backgroundColor: '#06b6d4', borderColor: '#0891b2' },
  langText:     { color: '#cbd5e1', fontSize: 13, fontWeight: '700' },
  langTextActive:{ color: '#ffffff', fontWeight: '800' },
  
  brand:        { color: '#06b6d4', fontSize: width > 768 ? 24 : 20, fontWeight: '900', marginBottom: 4 },
  brandSub:     { color: '#94a3b8', fontSize: width > 768 ? 13 : 11, marginBottom: 32, fontWeight: '600' },
  
  navItem:      { flexDirection: 'row', alignItems: 'center', paddingVertical: 14, paddingHorizontal: 12, borderRadius: 10, marginBottom: 8, backgroundColor: '#0f172a', borderWidth: 1, borderColor: '#334155' },
  navItemActive:{ backgroundColor: '#06b6d4', borderColor: '#0891b2' },
  navIcon:      { fontSize: 18, marginRight: 12 },
  navLabel:     { color: '#cbd5e1', fontSize: width > 768 ? 15 : 13, fontWeight: '600' },
  navLabelActive:{ color: '#ffffff', fontWeight: '800' },
  
  logoutBtn:    { marginTop: 'auto', paddingVertical: 14, paddingHorizontal: 12, backgroundColor: '#7c2d12', borderRadius: 10, borderWidth: 1, borderColor: '#92400e', alignItems: 'center' },
  logoutText:   { color: '#fecaca', fontSize: width > 768 ? 14 : 12, fontWeight: '800' },
  
  content:      { flex: 1, backgroundColor: '#f8fafc' },
});

export default AdminLayout;
