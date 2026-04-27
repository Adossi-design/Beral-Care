import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TextInput, TouchableOpacity, Alert, ActivityIndicator } from 'react-native';
import AdminLayout from '../../components/layouts/AdminLayout';
import ProtectedRoute from '../../components/ProtectedRoute';
import api from '../../../client-services/api';

const ROLE_COLORS = { patient: '#22c55e', doctor: '#3b82f6', admin: '#a78bfa' };

const AdminUsers = ({ navigation }) => {
  const [users, setUsers] = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [loading, setLoading] = useState(true);

  const fetchUsers = () => {
    setLoading(true);
    api.get('/api/admin/users')
      .then(res => { setUsers(res.data); setFiltered(res.data); })
      .catch(console.error)
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchUsers(); }, []);

  useEffect(() => {
    let list = users;
    if (roleFilter !== 'all') list = list.filter(u => u.role === roleFilter);
    if (search) list = list.filter(u => u.full_name.toLowerCase().includes(search.toLowerCase()) || u.email.toLowerCase().includes(search.toLowerCase()));
    setFiltered(list);
  }, [search, roleFilter, users]);

  const handleDelete = (id, name) => {
    Alert.alert('Delete User', `Delete ${name}?`, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: async () => {
        try { await api.delete(`/api/admin/users/${id}`); fetchUsers(); }
        catch (e) { Alert.alert('Error', e.response?.data?.error || 'Failed to delete'); }
      }},
    ]);
  };

  const handleViewDetails = (user) => {
    Alert.alert(
      user.full_name,
      `Email: ${user.email}\nPhone: ${user.phone || 'N/A'}\nRole: ${user.role}\nPatient ID: ${user.patient_id || 'N/A'}\nJoined: ${new Date(user.created_at).toLocaleDateString()}`,
      [{ text: 'Close' }]
    );
  };

  const handleSuspend = (id, name, currentlySuspended) => {
    const action = currentlySuspended ? 'Unsuspend' : 'Suspend';
    Alert.alert(`${action} User`, `${action} ${name}?`, [
      { text: 'Cancel', style: 'cancel' },
      { text: action, onPress: async () => {
        try { await api.patch(`/api/admin/users/${id}/suspend`, { suspended: !currentlySuspended }); fetchUsers(); }
        catch (e) { Alert.alert('Error', e.response?.data?.error || 'Failed to update'); }
      }},
    ]);
  };

  return (
    <ProtectedRoute requiredRole="admin" navigation={navigation}>
      <AdminLayout navigation={navigation} activeScreen="AdminUsers">
        <ScrollView style={styles.scroll} contentContainerStyle={styles.content}>
          <Text style={styles.heading}>Users</Text>

          <TextInput style={styles.search} placeholder="Search by name or email..." placeholderTextColor="#64748b" value={search} onChangeText={setSearch} />

          <View style={styles.filterRow}>
            {['all', 'patient', 'doctor', 'admin'].map(r => (
              <TouchableOpacity key={r} style={[styles.filterBtn, roleFilter === r && styles.filterBtnActive]} onPress={() => setRoleFilter(r)}>
                <Text style={[styles.filterText, roleFilter === r && styles.filterTextActive]}>{r}</Text>
              </TouchableOpacity>
            ))}
          </View>

          {loading ? <ActivityIndicator color="#94a3b8" style={{ marginTop: 40 }} /> : filtered.map(u => (
            <View key={u.id} style={styles.row}>
              <View style={styles.rowInfo}>
                <Text style={styles.rowName}>{u.full_name}</Text>
                <Text style={styles.rowEmail}>{u.email}</Text>
                <Text style={styles.rowDate}>{new Date(u.created_at).toLocaleDateString()}</Text>
              </View>
              <View style={styles.rowRight}>
                <View style={[styles.roleBadge, { backgroundColor: ROLE_COLORS[u.role] + '22' }]}>
                  <Text style={[styles.roleBadgeText, { color: ROLE_COLORS[u.role] }]}>{u.role}</Text>
                </View>
                <View style={styles.rowActions}>
                  <TouchableOpacity style={styles.actionBtn} onPress={() => handleViewDetails(u)}>
                    <Text style={styles.actionBtnText}>View</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={[styles.actionBtn, styles.actionBtnSuspend]} onPress={() => handleSuspend(u.id, u.full_name, u.suspended)}>
                    <Text style={[styles.actionBtnText, styles.actionBtnSuspendText]}>{u.suspended ? 'Unsuspend' : 'Suspend'}</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.deleteBtn} onPress={() => handleDelete(u.id, u.full_name)}>
                    <Text style={styles.deleteBtnText}>Delete</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          ))}
        </ScrollView>
      </AdminLayout>
    </ProtectedRoute>
  );
};

const styles = StyleSheet.create({
  scroll:           { flex: 1 },
  content:          { padding: 24 },
  heading:          { fontSize: 22, fontWeight: 'bold', color: '#f1f5f9', marginBottom: 16 },
  search:           { backgroundColor: '#1e293b', borderRadius: 12, padding: 12, color: '#f1f5f9', borderWidth: 1, borderColor: '#334155', marginBottom: 12 },
  filterRow:        { flexDirection: 'row', gap: 8, marginBottom: 20 },
  filterBtn:        { paddingHorizontal: 14, paddingVertical: 6, borderRadius: 20, backgroundColor: '#1e293b', borderWidth: 1, borderColor: '#334155' },
  filterBtnActive:  { backgroundColor: '#334155', borderColor: '#64748b' },
  filterText:       { color: '#64748b', fontSize: 13, textTransform: 'capitalize' },
  filterTextActive: { color: '#f1f5f9' },
  row:              { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#1e293b', borderRadius: 12, padding: 14, marginBottom: 10 },
  rowInfo:          { flex: 1 },
  rowName:          { color: '#f1f5f9', fontWeight: '600', fontSize: 14 },
  rowEmail:         { color: '#94a3b8', fontSize: 12, marginTop: 2 },
  rowDate:          { color: '#475569', fontSize: 11, marginTop: 2 },
  rowRight:         { alignItems: 'flex-end', gap: 10 },
  roleBadge:        { paddingHorizontal: 10, paddingVertical: 3, borderRadius: 20 },
  roleBadgeText:    { fontSize: 12, fontWeight: '600', textTransform: 'capitalize' },
  rowActions:       { flexDirection: 'row', gap: 6 },
  actionBtn:        { backgroundColor: '#334155', paddingHorizontal: 10, paddingVertical: 5, borderRadius: 8 },
  actionBtnText:    { color: '#94a3b8', fontSize: 11, fontWeight: '600' },
  actionBtnSuspend: { backgroundColor: '#422006' },
  actionBtnSuspendText: { color: '#fbbf24' },
  deleteBtn:        { backgroundColor: '#7f1d1d', paddingHorizontal: 10, paddingVertical: 5, borderRadius: 8 },
  deleteBtnText:    { color: '#fca5a5', fontSize: 11, fontWeight: '600' },
});

export default AdminUsers;
