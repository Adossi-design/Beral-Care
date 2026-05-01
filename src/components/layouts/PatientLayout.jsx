import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, SafeAreaView } from 'react-native';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../context/LanguageContext';

const PatientLayout = ({ children, navigation, activeScreen }) => {
  const { logout } = useAuth();
  const { language, changeLanguage, t } = useLanguage();

  const handleLogout = async () => {
    await logout();
    navigation.replace('Login');
  };

  const toggleLanguage = () => {
    changeLanguage(language === 'en' ? 'fr' : 'en');
  };

  const tabs = [
    { label: t('dashboard'),      screen: 'PatientDashboard',      icon: '🏠' },
    { label: t('profile'),        screen: 'PatientProfileEdit',    icon: '👤' },
    { label: t('appointments'),   screen: 'PatientAppointments',   icon: '📅' },
    { label: t('notifications'),  screen: 'PatientNotifications',  icon: '🔔' },
  ];

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Beral Care</Text>
        <View style={styles.headerRight}>
          <TouchableOpacity style={styles.langBtn} onPress={toggleLanguage}>
            <Text style={styles.langBtnText}>{language === 'en' ? '🇫🇷' : '🇬🇧'}</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={handleLogout}>
            <Text style={styles.logoutText}>{t('logout')}</Text>
          </TouchableOpacity>
        </View>
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
  headerRight:    { flexDirection: 'row', alignItems: 'center', gap: 12 },
  langBtn:        { backgroundColor: 'rgba(255,255,255,0.2)', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 8 },
  langBtnText:    { fontSize: 16 },
  logoutText:     { color: 'rgba(255,255,255,0.8)', fontSize: 14 },
  content:        { flex: 1 },
  tabBar:         { flexDirection: 'row', backgroundColor: '#fff', borderTopWidth: 1, borderTopColor: '#e2e8f0', paddingBottom: 8 },
  tab:            { flex: 1, alignItems: 'center', paddingTop: 10 },
  tabIcon:        { fontSize: 20 },
  tabLabel:       { fontSize: 11, color: '#94a3b8', marginTop: 2 },
  tabLabelActive: { color: '#1a5c38', fontWeight: '600' },
});

export default PatientLayout;
