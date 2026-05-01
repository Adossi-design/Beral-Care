import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TextInput, TouchableOpacity, Alert, ActivityIndicator, Dimensions, Modal } from 'react-native';
import AdminLayout from '../../components/layouts/AdminLayout';
import ProtectedRoute from '../../components/ProtectedRoute';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../context/LanguageContext';
import api from '@client-services/api';

const { width } = Dimensions.get('window');

const AdminUsers = ({ navigation }) => {
  const { user: currentAdmin } = useAuth();
  const { t } = useLanguage();
  const [users, setUsers] = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [loading, setLoading] = useState(true);
  const [selectedUser, setSelectedUser] = useState(null);
  const [showModal, setShowModal] = useState(false);

  const fetchUsers = () => {
    setLoading(true);
    api.get('/api/admin/users')
      .then(res => { 
        setUsers(res.data); 
        setFiltered(res.data); 
      })
      .catch(err => console.error('Fetch error:', err))
      .finally(() => setLoading(false));
  };

  useEffect(() => { 
    fetchUsers(); 
  }, []);

  useEffect(() => {
    let list = users;
    if (roleFilter !== 'all') list = list.filter(u => u.role === roleFilter);
    if (search) list = list.filter(u => u.full_name.toLowerCase().includes(search.toLowerCase()) || u.email.toLowerCase().includes(search.toLowerCase()));
    setFiltered(list);
  }, [search, roleFilter, users]);

  const isCurrentAdmin = (userId) => userId === currentAdmin?.id;

  const handleViewDetails = (user) => {
    setSelectedUser(user);
    setShowModal(true);
  };

  const handleSuspend = (id, name, currentlySuspended) => {
    if (isCurrentAdmin(id)) {
      Alert.alert(t('error'), t('cannotSuspendOwnAccount'));
      return;
    }
    const action = currentlySuspended ? t('unsuspend') : t('suspend');
    const confirmMsg = currentlySuspended ? t('confirmUnsuspend') : t('confirmSuspend');
    Alert.alert(action, confirmMsg, [
      { text: t('cancel'), style: 'cancel' },
      { text: action, onPress: async () => {
        try { 
          await api.patch(`/api/admin/users/${id}/suspend`, { suspended: !currentlySuspended }); 
          Alert.alert(t('success'), currentlySuspended ? t('userUnsuspendedSuccessfully') : t('userSuspendedSuccessfully'));
          fetchUsers(); 
        }
        catch (e) { 
          Alert.alert(t('error'), e.response?.data?.error || t('failedToSuspend')); 
        }
      }},
    ]);
  };

  const handleDelete = (id, name) => {
    if (isCurrentAdmin(id)) {
      Alert.alert(t('error'), t('cannotDeleteOwnAccount'));
      return;
    }
    Alert.alert(t('deleteUserConfirm'), t('confirmDelete'), [
      { text: t('cancel'), style: 'cancel' },
      { text: t('delete'), style: 'destructive', onPress: async () => {
        try { 
          await api.delete(`/api/admin/users/${id}`); 
          Alert.alert(t('success'), t('userDeletedSuccessfully'));
          fetchUsers(); 
        }
        catch (e) { 
          Alert.alert(t('error'), e.response?.data?.error || t('failedToDelete')); 
        }
      }},
    ]);
  };

  return (
    <ProtectedRoute requiredRole="admin" navigation={navigation}>
      <AdminLayout navigation={navigation} activeScreen="AdminUsers">
        <ScrollView style={styles.scroll} contentContainerStyle={styles.content}>
          <Text style={styles.heading}>{t('users')}</Text>

          <TextInput 
            style={styles.search} 
            placeholder={t('searchByNameOrEmail')} 
            placeholderTextColor="#94a3b8" 
            value={search} 
            onChangeText={setSearch} 
          />

          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterRowContainer}>
            <View style={styles.filterRow}>
              {['all', 'patient', 'doctor', 'admin'].map(r => (
                <TouchableOpacity 
                  key={r} 
                  style={[styles.filterBtn, roleFilter === r && styles.filterBtnActive]} 
                  onPress={() => setRoleFilter(r)}
                >
                  <Text style={[styles.filterText, roleFilter === r && styles.filterTextActive]}>{r}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </ScrollView>

          {loading ? (
            <ActivityIndicator color="#06b6d4" size="large" style={{ marginTop: 40 }} />
          ) : filtered.length === 0 ? (
            <Text style={styles.emptyText}>{t('noUsersFound')}</Text>
          ) : (
            filtered.map(u => (
              <View key={u.id} style={styles.userCard}>
                <View style={styles.userInfo}>
                  <Text style={styles.userName}>{u.full_name}</Text>
                  <Text style={styles.userEmail}>{u.email}</Text>
                  <Text style={styles.userDate}>{new Date(u.created_at).toLocaleDateString()}</Text>
                </View>
                
                <View style={[styles.roleBadge, { backgroundColor: u.role === 'patient' ? '#cffafe' : u.role === 'doctor' ? '#dbeafe' : '#fef3c7' }]}>
                  <Text style={[styles.roleBadgeText, { color: u.role === 'patient' ? '#0c4a6e' : u.role === 'doctor' ? '#0c2d6b' : '#92400e' }]}>{u.role}</Text>
                </View>

                <View style={styles.buttonGroup}>
                  <TouchableOpacity 
                    style={styles.viewBtn}
                    onPress={() => handleViewDetails(u)}
                    activeOpacity={0.7}
                  >
                    <Text style={styles.viewBtnText}>{t('view')}</Text>
                  </TouchableOpacity>
                  
                  {!isCurrentAdmin(u.id) && (
                    <>
                      <TouchableOpacity 
                        style={[styles.suspendBtn, u.suspended && styles.suspendBtnActive]}
                        onPress={() => handleSuspend(u.id, u.full_name, u.suspended)}
                        activeOpacity={0.7}
                      >
                        <Text style={[styles.suspendBtnText, u.suspended && styles.suspendBtnTextActive]}>
                          {u.suspended ? t('unsuspend') : t('suspend')}
                        </Text>
                      </TouchableOpacity>
                      
                      <TouchableOpacity 
                        style={styles.deleteBtn}
                        onPress={() => handleDelete(u.id, u.full_name)}
                        activeOpacity={0.7}
                      >
                        <Text style={styles.deleteBtnText}>{t('delete')}</Text>
                      </TouchableOpacity>
                    </>
                  )}
                </View>
              </View>
            ))
          )}
        </ScrollView>

        {/* User Details Modal */}
        <Modal
          visible={showModal}
          transparent
          animationType="fade"
          onRequestClose={() => setShowModal(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>{selectedUser?.full_name}</Text>
                <TouchableOpacity onPress={() => setShowModal(false)}>
                  <Text style={styles.closeBtn}>✕</Text>
                </TouchableOpacity>
              </View>

              <ScrollView style={styles.modalBody}>
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>{t('email')}:</Text>
                  <Text style={styles.detailValue}>{selectedUser?.email}</Text>
                </View>

                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>{t('phoneNumber')}:</Text>
                  <Text style={styles.detailValue}>{selectedUser?.phone || 'N/A'}</Text>
                </View>

                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>{t('users')}:</Text>
                  <Text style={styles.detailValue}>{selectedUser?.role}</Text>
                </View>

                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Patient ID:</Text>
                  <Text style={styles.detailValue}>{selectedUser?.patient_id || 'N/A'}</Text>
                </View>

                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>{t('memberSince')}:</Text>
                  <Text style={styles.detailValue}>{selectedUser?.created_at ? new Date(selectedUser.created_at).toLocaleDateString() : 'N/A'}</Text>
                </View>

                {selectedUser?.specialization && (
                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>{t('specialization')}:</Text>
                    <Text style={styles.detailValue}>{selectedUser.specialization}</Text>
                  </View>
                )}

                {selectedUser?.hospital && (
                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>{t('hospital')}:</Text>
                    <Text style={styles.detailValue}>{selectedUser.hospital}</Text>
                  </View>
                )}
              </ScrollView>

              <TouchableOpacity 
                style={styles.modalCloseBtn}
                onPress={() => setShowModal(false)}
              >
                <Text style={styles.modalCloseBtnText}>{t('cancel')}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>
      </AdminLayout>
    </ProtectedRoute>
  );
};

const styles = StyleSheet.create({
  scroll:           { flex: 1, backgroundColor: '#f8fafc' },
  content:          { padding: width > 768 ? 32 : 20, paddingBottom: 40 },
  
  heading:          { fontSize: width > 768 ? 36 : 28, fontWeight: '900', color: '#1e293b', marginBottom: 24 },
  
  search:           { backgroundColor: '#ffffff', borderRadius: 12, padding: 14, color: '#1e293b', borderWidth: 1, borderColor: '#e2e8f0', marginBottom: 20, fontSize: 15, fontWeight: '600' },
  
  filterRowContainer: { marginBottom: 24 },
  filterRow:        { flexDirection: 'row', gap: 10, paddingRight: 20 },
  filterBtn:        { paddingHorizontal: 16, paddingVertical: 10, borderRadius: 20, backgroundColor: '#ffffff', borderWidth: 1, borderColor: '#e2e8f0' },
  filterBtnActive:  { backgroundColor: '#06b6d4', borderColor: '#0891b2' },
  filterText:       { color: '#64748b', fontSize: 14, textTransform: 'capitalize', fontWeight: '700' },
  filterTextActive: { color: '#ffffff', fontWeight: '800' },
  
  userCard:         { backgroundColor: '#ffffff', borderRadius: 14, padding: width > 768 ? 20 : 16, marginBottom: 16, borderWidth: 1, borderColor: '#e2e8f0', shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 2, elevation: 1 },
  userInfo:         { marginBottom: 14 },
  userName:         { color: '#1e293b', fontWeight: '800', fontSize: width > 768 ? 18 : 16 },
  userEmail:        { color: '#64748b', fontSize: width > 768 ? 15 : 14, marginTop: 4, fontWeight: '600' },
  userDate:         { color: '#94a3b8', fontSize: 12, marginTop: 2 },
  
  roleBadge:        { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20, borderWidth: 1, marginBottom: 14, alignSelf: 'flex-start', borderColor: '#e2e8f0' },
  roleBadgeText:    { fontSize: 13, fontWeight: '800', textTransform: 'capitalize' },
  
  buttonGroup:      { flexDirection: 'row', gap: 10, flexWrap: 'wrap' },
  
  viewBtn:          { flex: 1, minWidth: 80, backgroundColor: '#cffafe', paddingVertical: 12, borderRadius: 10, borderWidth: 1, borderColor: '#06b6d4', alignItems: 'center' },
  viewBtnText:      { color: '#0c4a6e', fontSize: 14, fontWeight: '800' },
  
  suspendBtn:       { flex: 1, minWidth: 80, backgroundColor: '#fef3c7', paddingVertical: 12, borderRadius: 10, borderWidth: 1, borderColor: '#fcd34d', alignItems: 'center' },
  suspendBtnActive: { backgroundColor: '#fbbf24', borderColor: '#f59e0b' },
  suspendBtnText:   { color: '#92400e', fontSize: 14, fontWeight: '800' },
  suspendBtnTextActive: { color: '#ffffff' },
  
  deleteBtn:        { flex: 1, minWidth: 80, backgroundColor: '#fee2e2', paddingVertical: 12, borderRadius: 10, borderWidth: 1, borderColor: '#fca5a5', alignItems: 'center' },
  deleteBtnText:    { color: '#991b1b', fontSize: 14, fontWeight: '800' },
  
  emptyText:        { color: '#64748b', fontSize: 16, textAlign: 'center', marginTop: 60, fontWeight: '700' },

  // Modal Styles
  modalOverlay:     { flex: 1, backgroundColor: 'rgba(0, 0, 0, 0.5)', justifyContent: 'center', alignItems: 'center', padding: 20 },
  modalContent:     { backgroundColor: '#ffffff', borderRadius: 16, borderWidth: 1, borderColor: '#e2e8f0', width: '100%', maxWidth: 500, maxHeight: '80%', shadowColor: '#000', shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.2, shadowRadius: 20, elevation: 10 },
  modalHeader:      { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 24, paddingVertical: 18, borderBottomWidth: 1, borderBottomColor: '#e2e8f0', backgroundColor: '#f8fafc' },
  modalTitle:       { fontSize: 22, fontWeight: '900', color: '#1e293b' },
  closeBtn:         { fontSize: 28, color: '#64748b', fontWeight: '900' },
  modalBody:        { padding: 24 },
  detailRow:        { marginBottom: 18, paddingBottom: 14, borderBottomWidth: 1, borderBottomColor: '#f1f5f9' },
  detailLabel:      { fontSize: 14, fontWeight: '800', color: '#1e293b', marginBottom: 4 },
  detailValue:      { fontSize: 15, color: '#475569', fontWeight: '600' },
  modalCloseBtn:    { backgroundColor: '#06b6d4', marginHorizontal: 24, marginBottom: 20, paddingVertical: 12, borderRadius: 10, borderWidth: 1, borderColor: '#0891b2', alignItems: 'center' },
  modalCloseBtnText:{ color: '#ffffff', fontSize: 16, fontWeight: '900' },
});

export default AdminUsers;
