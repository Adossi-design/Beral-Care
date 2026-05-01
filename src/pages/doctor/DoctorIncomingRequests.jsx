import React, { useEffect, useState } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet,
  ActivityIndicator, Alert, SafeAreaView, RefreshControl
} from 'react-native';
import api from '@client-services/api';

const DoctorIncomingRequests = ({ navigation }) => {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [processingId, setProcessingId] = useState(null);

  useEffect(() => {
    fetchRequests();
    const interval = setInterval(fetchRequests, 5000); // Refresh every 5 seconds
    return () => clearInterval(interval);
  }, []);

  const fetchRequests = async () => {
    try {
      const res = await api.get('/api/doctor/requests');
      setRequests(res.data);
    } catch (error) {
      console.error('Error fetching requests:', error);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchRequests();
    setRefreshing(false);
  };

  const handleAccept = async (requestId) => {
    setProcessingId(requestId);
    try {
      await api.patch(`/api/doctor/requests/${requestId}`, {
        status: 'accepted'
      });
      Alert.alert('Success', 'Consultation request accepted');
      await fetchRequests();
    } catch (error) {
      Alert.alert('Error', error.response?.data?.error || 'Failed to accept request');
    } finally {
      setProcessingId(null);
    }
  };

  const handleReject = async (requestId) => {
    setProcessingId(requestId);
    try {
      await api.patch(`/api/doctor/requests/${requestId}`, {
        status: 'rejected'
      });
      Alert.alert('Success', 'Consultation request rejected');
      await fetchRequests();
    } catch (error) {
      Alert.alert('Error', error.response?.data?.error || 'Failed to reject request');
    } finally {
      setProcessingId(null);
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
          <View style={styles.badge}>
            <Text style={styles.badgeText}>{requests.length}</Text>
          </View>
        </View>

        {/* Requests List */}
        <View style={styles.content}>
          {requests.length === 0 ? (
            <View style={styles.emptyState}>
              <Text style={styles.emptyIcon}>📭</Text>
              <Text style={styles.emptyText}>No pending requests</Text>
              <Text style={styles.emptySubtext}>
                Consultation requests from patients will appear here
              </Text>
            </View>
          ) : (
            requests.map(request => (
              <View key={request.id} style={styles.requestCard}>
                <View style={styles.requestHeader}>
                  <View style={styles.patientAvatar}>
                    <Text style={styles.avatarText}>🧑⚕️</Text>
                  </View>
                  <View style={styles.patientInfo}>
                    <Text style={styles.patientName}>{request.patient_name}</Text>
                    <Text style={styles.patientId}>ID: {request.patient_id}</Text>
                  </View>
                </View>

                {request.reason && (
                  <View style={styles.reasonSection}>
                    <Text style={styles.reasonLabel}>Reason for Consultation</Text>
                    <Text style={styles.reasonText}>{request.reason}</Text>
                  </View>
                )}

                <View style={styles.dateSection}>
                  <Text style={styles.dateText}>
                    Requested on {new Date(request.created_at).toLocaleDateString()}
                  </Text>
                </View>

                <View style={styles.actionButtons}>
                  <TouchableOpacity
                    style={[styles.rejectBtn, processingId === request.id && styles.btnDisabled]}
                    onPress={() => handleReject(request.id)}
                    disabled={processingId === request.id}
                  >
                    {processingId === request.id ? (
                      <ActivityIndicator color="#ef4444" size="small" />
                    ) : (
                      <Text style={styles.rejectBtnText}>Reject</Text>
                    )}
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.acceptBtn, processingId === request.id && styles.btnDisabled]}
                    onPress={() => handleAccept(request.id)}
                    disabled={processingId === request.id}
                  >
                    {processingId === request.id ? (
                      <ActivityIndicator color="#fff" size="small" />
                    ) : (
                      <Text style={styles.acceptBtnText}>Accept</Text>
                    )}
                  </TouchableOpacity>
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
  badge: {
    backgroundColor: '#ef4444',
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
  badgeText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '700',
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
    fontWeight: '600',
    color: '#1a1a2e',
    marginBottom: 4,
  },
  emptySubtext: {
    fontSize: 13,
    color: '#94a3b8',
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
    alignItems: 'center',
    gap: 12,
    marginBottom: 12,
  },
  patientAvatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#E6F1FB',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    fontSize: 24,
  },
  patientInfo: {
    flex: 1,
  },
  patientName: {
    fontSize: 15,
    fontWeight: '700',
    color: '#1a1a2e',
    marginBottom: 2,
  },
  patientId: {
    fontSize: 12,
    color: '#94a3b8',
  },
  reasonSection: {
    backgroundColor: '#f8fafc',
    borderRadius: 10,
    padding: 12,
    marginBottom: 12,
    borderLeftWidth: 3,
    borderLeftColor: '#1a5c38',
  },
  reasonLabel: {
    fontSize: 12,
    color: '#94a3b8',
    fontWeight: '600',
    marginBottom: 4,
  },
  reasonText: {
    fontSize: 13,
    color: '#1a1a2e',
    fontWeight: '500',
  },
  dateSection: {
    marginBottom: 12,
  },
  dateText: {
    fontSize: 12,
    color: '#94a3b8',
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 10,
  },
  rejectBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
    backgroundColor: '#fef2f2',
    borderWidth: 1,
    borderColor: '#fecaca',
  },
  rejectBtnText: {
    color: '#ef4444',
    fontSize: 14,
    fontWeight: '700',
  },
  acceptBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
    backgroundColor: '#1a5c38',
  },
  acceptBtnText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '700',
  },
  btnDisabled: {
    opacity: 0.6,
  },
});

export default DoctorIncomingRequests;
