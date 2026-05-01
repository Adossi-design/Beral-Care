import React, { useEffect, useState } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet,
  ActivityIndicator, Alert, SafeAreaView, RefreshControl
} from 'react-native';
import api from '@client-services/api';
import { useAuth } from '../../context/AuthContext';

const ConsultationRequests = ({ navigation }) => {
  const { user } = useAuth();
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    fetchRequests();
  }, []);

  const fetchRequests = async () => {
    try {
      setLoading(true);
      const res = await api.get('/api/patient/consultation-requests');
      setRequests(res.data);
    } catch (error) {
      Alert.alert('Error', 'Failed to fetch requests');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchRequests();
    setRefreshing(false);
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'pending':
        return '#f59e0b';
      case 'accepted':
        return '#22c55e';
      case 'rejected':
        return '#ef4444';
      case 'completed':
        return '#3b82f6';
      default:
        return '#94a3b8';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'pending':
        return '⏳';
      case 'accepted':
        return '✓';
      case 'rejected':
        return '✕';
      case 'completed':
        return '✓✓';
      default:
        return '•';
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.centerContent}>
          <ActivityIndicator size="large" color="#1a5c38" />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Text style={styles.backBtn}>←</Text>
          </TouchableOpacity>
          <Text style={styles.title}>Consultation Requests</Text>
        </View>

        {/* Requests List */}
        <View style={styles.content}>
          {requests.length === 0 ? (
            <View style={styles.emptyState}>
              <Text style={styles.emptyIcon}>📋</Text>
              <Text style={styles.emptyText}>No consultation requests yet</Text>
              <TouchableOpacity
                style={styles.findDoctorBtn}
                onPress={() => navigation.navigate('DoctorDiscovery')}
              >
                <Text style={styles.findDoctorBtnText}>Find a Doctor</Text>
              </TouchableOpacity>
            </View>
          ) : (
            requests.map(request => (
              <View key={request.id} style={styles.requestCard}>
                <View style={styles.requestHeader}>
                  <View style={styles.doctorInfo}>
                    <View style={styles.doctorAvatar}>
                      <Text style={styles.avatarText}>👨⚕️</Text>
                    </View>
                    <View style={styles.doctorDetails}>
                      <Text style={styles.doctorName}>Dr. {request.doctor_name}</Text>
                      <Text style={styles.doctorSpec}>{request.specialization}</Text>
                    </View>
                  </View>
                  <View
                    style={[
                      styles.statusBadge,
                      { backgroundColor: getStatusColor(request.status) + '22' }
                    ]}
                  >
                    <Text style={[styles.statusIcon, { color: getStatusColor(request.status) }]}>
                      {getStatusIcon(request.status)}
                    </Text>
                    <Text style={[styles.statusText, { color: getStatusColor(request.status) }]}>
                      {request.status.charAt(0).toUpperCase() + request.status.slice(1)}
                    </Text>
                  </View>
                </View>

                <View style={styles.requestBody}>
                  <Text style={styles.dateText}>
                    Requested on {new Date(request.created_at).toLocaleDateString()}
                  </Text>

                  {request.status === 'accepted' && (
                    <TouchableOpacity
                      style={styles.createConsultationBtn}
                      onPress={() =>
                        navigation.navigate('CreateConsultation', {
                          doctor_id: request.doctor_id,
                          request_id: request.id,
                          patient_id: user?.id,
                          doctor_name: request.doctor_name
                        })
                      }
                    >
                      <Text style={styles.createConsultationBtnText}>Create Consultation</Text>
                    </TouchableOpacity>
                  )}

                  {request.status === 'rejected' && (
                    <TouchableOpacity
                      style={styles.retryBtn}
                      onPress={() => navigation.navigate('DoctorDiscovery')}
                    >
                      <Text style={styles.retryBtnText}>Try Another Doctor</Text>
                    </TouchableOpacity>
                  )}
                </View>
              </View>
            ))
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  centerContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    backgroundColor: '#1a5c38',
    paddingHorizontal: 24,
    paddingVertical: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  backBtn: {
    fontSize: 24,
    color: '#fff',
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: '#fff',
    flex: 1,
  },
  content: {
    paddingHorizontal: 24,
    paddingVertical: 20,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyIcon: {
    fontSize: 48,
    marginBottom: 12,
  },
  emptyText: {
    fontSize: 16,
    color: '#94a3b8',
    marginBottom: 24,
  },
  findDoctorBtn: {
    backgroundColor: '#1a5c38',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  findDoctorBtnText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '700',
  },
  requestCard: {
    backgroundColor: '#fff',
    borderRadius: 14,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  requestHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  doctorInfo: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  doctorAvatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#EAF3DE',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    fontSize: 24,
  },
  doctorDetails: {
    flex: 1,
  },
  doctorName: {
    fontSize: 15,
    fontWeight: '700',
    color: '#1a1a2e',
    marginBottom: 2,
  },
  doctorSpec: {
    fontSize: 13,
    color: '#1a5c38',
    fontWeight: '600',
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 20,
  },
  statusIcon: {
    fontSize: 14,
    fontWeight: '700',
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
  },
  requestBody: {
    borderTopWidth: 1,
    borderTopColor: '#e2e8f0',
    paddingTop: 12,
  },
  dateText: {
    fontSize: 12,
    color: '#94a3b8',
    marginBottom: 12,
  },
  createConsultationBtn: {
    backgroundColor: '#1a5c38',
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: 'center',
  },
  createConsultationBtnText: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '700',
  },
  retryBtn: {
    backgroundColor: '#f1f5f9',
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  retryBtnText: {
    color: '#1a5c38',
    fontSize: 13,
    fontWeight: '700',
  },
});

export default ConsultationRequests;
