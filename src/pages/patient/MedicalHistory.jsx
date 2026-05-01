import React, { useEffect, useState } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet,
  ActivityIndicator, Alert, SafeAreaView, RefreshControl
} from 'react-native';
import api from '@client-services/api';

const MedicalHistory = ({ navigation }) => {
  const [consultations, setConsultations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [expandedId, setExpandedId] = useState(null);

  useEffect(() => {
    fetchConsultations();
  }, []);

  const fetchConsultations = async () => {
    try {
      setLoading(true);
      const res = await api.get('/api/patient/consultations');
      setConsultations(res.data);
    } catch (error) {
      Alert.alert('Error', 'Failed to fetch medical history');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchConsultations();
    setRefreshing(false);
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
          <Text style={styles.title}>Medical History</Text>
        </View>

        {/* Summary Cards */}
        <View style={styles.summarySection}>
          <View style={[styles.summaryCard, { backgroundColor: '#E6F1FB' }]}>
            <Text style={styles.summaryIcon}>📋</Text>
            <Text style={[styles.summaryValue, { color: '#185FA5' }]}>
              {consultations.length}
            </Text>
            <Text style={styles.summaryLabel}>Total Consultations</Text>
          </View>
          <View style={[styles.summaryCard, { backgroundColor: '#EAF3DE' }]}>
            <Text style={styles.summaryIcon}>🩺</Text>
            <Text style={[styles.summaryValue, { color: '#1a5c38' }]}>
              {consultations.filter(c => c.diagnosis).length}
            </Text>
            <Text style={styles.summaryLabel}>Diagnoses</Text>
          </View>
          <View style={[styles.summaryCard, { backgroundColor: '#FEF3C7' }]}>
            <Text style={styles.summaryIcon}>💊</Text>
            <Text style={[styles.summaryValue, { color: '#D97706' }]}>
              {consultations.filter(c => c.prescription).length}
            </Text>
            <Text style={styles.summaryLabel}>Prescriptions</Text>
          </View>
        </View>

        {/* Consultations List */}
        <View style={styles.content}>
          {consultations.length === 0 ? (
            <View style={styles.emptyState}>
              <Text style={styles.emptyIcon}>📭</Text>
              <Text style={styles.emptyText}>No medical history yet</Text>
              <Text style={styles.emptySubtext}>
                Your consultations will appear here
              </Text>
            </View>
          ) : (
            consultations.map(consultation => (
              <TouchableOpacity
                key={consultation.id}
                style={styles.consultationCard}
                onPress={() =>
                  setExpandedId(expandedId === consultation.id ? null : consultation.id)
                }
              >
                <View style={styles.consultationHeader}>
                  <View style={styles.consultationDate}>
                    <Text style={styles.dateDay}>
                      {new Date(consultation.consultation_date).getDate()}
                    </Text>
                    <Text style={styles.dateMonth}>
                      {new Date(consultation.consultation_date).toLocaleString('default', {
                        month: 'short'
                      })}
                    </Text>
                  </View>

                  <View style={styles.consultationInfo}>
                    <Text style={styles.doctorName}>Dr. {consultation.doctor_name}</Text>
                    <Text style={styles.doctorSpec}>{consultation.specialization}</Text>
                  </View>

                  <Text style={styles.expandIcon}>
                    {expandedId === consultation.id ? '▼' : '▶'}
                  </Text>
                </View>

                {expandedId === consultation.id && (
                  <View style={styles.consultationDetails}>
                    {consultation.diagnosis && (
                      <View style={styles.detailRow}>
                        <Text style={styles.detailIcon}>🩺</Text>
                        <View style={styles.detailContent}>
                          <Text style={styles.detailLabel}>Diagnosis</Text>
                          <Text style={styles.detailValue}>{consultation.diagnosis}</Text>
                        </View>
                      </View>
                    )}

                    {consultation.prescription && (
                      <View style={styles.detailRow}>
                        <Text style={styles.detailIcon}>💊</Text>
                        <View style={styles.detailContent}>
                          <Text style={styles.detailLabel}>Prescription</Text>
                          <Text style={styles.detailValue}>{consultation.prescription}</Text>
                        </View>
                      </View>
                    )}

                    {consultation.notes && (
                      <View style={styles.detailRow}>
                        <Text style={styles.detailIcon}>📝</Text>
                        <View style={styles.detailContent}>
                          <Text style={styles.detailLabel}>Notes</Text>
                          <Text style={styles.detailValue}>{consultation.notes}</Text>
                        </View>
                      </View>
                    )}

                    <View style={styles.detailRow}>
                      <Text style={styles.detailIcon}>📅</Text>
                      <View style={styles.detailContent}>
                        <Text style={styles.detailLabel}>Date</Text>
                        <Text style={styles.detailValue}>
                          {new Date(consultation.consultation_date).toLocaleDateString('en-US', {
                            weekday: 'long',
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric'
                          })}
                        </Text>
                      </View>
                    </View>
                  </View>
                )}
              </TouchableOpacity>
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
  summarySection: {
    paddingHorizontal: 24,
    paddingVertical: 20,
    flexDirection: 'row',
    gap: 10,
  },
  summaryCard: {
    flex: 1,
    borderRadius: 12,
    padding: 14,
    alignItems: 'center',
  },
  summaryIcon: {
    fontSize: 24,
    marginBottom: 6,
  },
  summaryValue: {
    fontSize: 20,
    fontWeight: '800',
    marginBottom: 2,
  },
  summaryLabel: {
    fontSize: 11,
    color: '#64748b',
    fontWeight: '600',
    textAlign: 'center',
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
  consultationCard: {
    backgroundColor: '#fff',
    borderRadius: 14,
    marginBottom: 12,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  consultationHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    gap: 12,
  },
  consultationDate: {
    width: 50,
    height: 50,
    borderRadius: 10,
    backgroundColor: '#EAF3DE',
    justifyContent: 'center',
    alignItems: 'center',
  },
  dateDay: {
    fontSize: 16,
    fontWeight: '800',
    color: '#1a5c38',
  },
  dateMonth: {
    fontSize: 11,
    color: '#1a5c38',
    fontWeight: '600',
  },
  consultationInfo: {
    flex: 1,
  },
  doctorName: {
    fontSize: 15,
    fontWeight: '700',
    color: '#1a1a2e',
    marginBottom: 2,
  },
  doctorSpec: {
    fontSize: 12,
    color: '#1a5c38',
    fontWeight: '600',
  },
  expandIcon: {
    fontSize: 14,
    color: '#94a3b8',
  },
  consultationDetails: {
    borderTopWidth: 1,
    borderTopColor: '#e2e8f0',
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 12,
  },
  detailRow: {
    flexDirection: 'row',
    gap: 12,
  },
  detailIcon: {
    fontSize: 18,
    marginTop: 2,
  },
  detailContent: {
    flex: 1,
  },
  detailLabel: {
    fontSize: 12,
    color: '#94a3b8',
    fontWeight: '600',
    marginBottom: 2,
  },
  detailValue: {
    fontSize: 13,
    color: '#1a1a2e',
    fontWeight: '500',
  },
});

export default MedicalHistory;
