import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import AdminLayout from '../../components/layouts/AdminLayout';
import ProtectedRoute from '../../components/ProtectedRoute';

const AdminSettings = ({ navigation }) => (
  <ProtectedRoute requiredRole="admin" navigation={navigation}>
    <AdminLayout navigation={navigation} activeScreen="AdminSettings">
      <ScrollView style={styles.scroll} contentContainerStyle={styles.content}>
        <Text style={styles.heading}>Settings</Text>
        <View style={styles.card}>
          <Text style={styles.cardText}>System configuration options will appear here.</Text>
        </View>
      </ScrollView>
    </AdminLayout>
  </ProtectedRoute>
);

const styles = StyleSheet.create({
  scroll:    { flex: 1 },
  content:   { padding: 24 },
  heading:   { fontSize: 22, fontWeight: 'bold', color: '#f1f5f9', marginBottom: 24 },
  card:      { backgroundColor: '#1e293b', borderRadius: 14, padding: 20 },
  cardText:  { color: '#94a3b8', fontSize: 14 },
});

export default AdminSettings;
