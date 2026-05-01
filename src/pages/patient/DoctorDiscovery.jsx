import React, { useEffect, useState } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet,
  ActivityIndicator, Alert, SafeAreaView, TextInput, Modal, FlatList
} from 'react-native';
import api from '@client-services/api';

const DoctorDiscovery = ({ navigation }) => {
  const [doctors, setDoctors] = useState([]);
  const [filteredDoctors, setFilteredDoctors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [specializations, setSpecializations] = useState([]);
  const [selectedSpecialization, setSelectedSpecialization] = useState('');
  const [selectedDoctor, setSelectedDoctor] = useState(null);
  const [reason, setReason] = useState('');
  const [requesting, setRequesting] = useState(false);
  const [showReasonModal, setShowReasonModal] = useState(false);

  useEffect(() => {
    fetchDoctors();
  }, []);

  const fetchDoctors = async () => {
    try {
      setLoading(true);
      const res = await api.get('/api/doctors');
      setDoctors(res.data);
      setFilteredDoctors(res.data);
      
      // Extract unique specializations
      const specs = [...new Set(res.data.map(d => d.specialization))].filter(Boolean);
      setSpecializations(specs);
    } catch (error) {
      Alert.alert('Error', 'Failed to fetch doctors');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleFilter = (spec) => {
    setSelectedSpecialization(spec);
    if (spec === '') {
      setFilteredDoctors(doctors);
    } else {
      setFilteredDoctors(doctors.filter(d => d.specialization === spec));
    }
  };

  const handleRequestConsultation = async () => {
    if (!reason.trim()) {
      Alert.alert('Required', 'Please provide a reason for consultation');
      return;
    }

    setRequesting(true);
    try {
      await api.post('/api/patient/consultation-requests', {
        doctor_id: selectedDoctor.id,
        reason
      });
      Alert.alert('Success', 'Consultation request sent to Dr. ' + selectedDoctor.full_name);
      setShowReasonModal(false);
      setReason('');
      setSelectedDoctor(null);
      navigation.navigate('PatientDashboard');
    } catch (error) {
      Alert.alert('Error', error.response?.data?.error || 'Failed to send request');
    } finally {
      setRequesting(false);
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.centerContent}>
          <ActivityIndicator size="large" color="#1a5c38" />
          <Text style={styles.loadingText}>Loading doctors...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Text style={styles.backBtn}>←</Text>
          </TouchableOpacity>
          <Text style={styles.title}>Find a Doctor</Text>
        </View>

        {/* Filter Section */}
        <View style={styles.filterSection}>
          <Text style={styles.filterLabel}>Filter by Specialization</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterScroll}>
            <TouchableOpacity
              style={[styles.filterBtn, selectedSpecialization === '' && styles.filterBtnActive]}
              onPress={() => handleFilter('')}
            >
              <Text style={[styles.filterBtnText, selectedSpecialization === '' && styles.filterBtnTextActive]}>
                All
              </Text>
            </TouchableOpacity>
            {specializations.map(spec => (
              <TouchableOpacity
                key={spec}
                style={[styles.filterBtn, selectedSpecialization === spec && styles.filterBtnActive]}
                onPress={() => handleFilter(spec)}
              >
                <Text style={[styles.filterBtnText, selectedSpecialization === spec && styles.filterBtnTextActive]}>
                  {spec}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {/* Doctors List */}
        <View style={styles.doctorsSection}>
          <Text style={styles.sectionTitle}>Available Doctors ({filteredDoctors.length})</Text>
          
          {filteredDoctors.length === 0 ? (
            <View style={styles.emptyState}>
              <Text style={styles.emptyIcon}>🔍</Text>
              <Text style={styles.emptyText}>No doctors found</Text>
            </View>
          ) : (
            filteredDoctors.map(doctor => (
              <View key={doctor.id} style={styles.doctorCard}>
                <View style={styles.doctorInfo}>
                  <View style={styles.doctorAvatar}>
                    <Text style={styles.avatarText}>👨‍⚕️</Text>
                  </View>
                  <View style={styles.doctorDetails}>
                    <Text style={styles.doctorName}>Dr. {doctor.full_name}</Text>
                    <Text style={styles.doctorSpec}>{doctor.specialization}</Text>
                    <Text style={styles.doctorHospital}>{doctor.hospital}</Text>
                  </View>
                </View>
                <TouchableOpacity
                  style={styles.requestBtn}
                  onPress={() => {
                    setSelectedDoctor(doctor);
                    setShowReasonModal(true);
                  }}
                >
                  <Text style={styles.requestBtnText}>Request</Text>
                </TouchableOpacity>
              </View>
            ))
          )}
        </View>
      </ScrollView>

      {/* Reason Modal */}
      <Modal
        visible={showReasonModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowReasonModal(false)}
      >
        <SafeAreaView style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <TouchableOpacity onPress={() => setShowReasonModal(false)}>
                <Text style={styles.closeBtn}>✕</Text>
              </TouchableOpacity>
              <Text style={styles.modalTitle}>Request Consultation</Text>
              <View style={{ width: 30 }} />
            </View>

            {selectedDoctor && (
              <>
                <View style={styles.selectedDoctorInfo}>
                  <Text style={styles.selectedDoctorName}>Dr. {selectedDoctor.full_name}</Text>
                  <Text style={styles.selectedDoctorSpec}>{selectedDoctor.specialization}</Text>
                </View>

                <View style={styles.reasonSection}>
                  <Text style={styles.reasonLabel}>Reason for Consultation</Text>
                  <TextInput
                    style={styles.reasonInput}
                    placeholder="Describe your symptoms or reason for consultation..."
                    placeholderTextColor="#94a3b8"
                    value={reason}
                    onChangeText={setReason}
                    multiline
                    numberOfLines={4}
                  />
                </View>

                <TouchableOpacity
                  style={[styles.submitBtn, requesting && styles.submitBtnDisabled]}
                  onPress={handleRequestConsultation}
                  disabled={requesting}
                >
                  {requesting ? (
                    <ActivityIndicator color="#fff" />
                  ) : (
                    <Text style={styles.submitBtnText}>Send Request</Text>
                  )}
                </TouchableOpacity>
              </>
            )}
          </View>
        </SafeAreaView>
      </Modal>
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
  loadingText: {
    marginTop: 12,
    color: '#64748b',
    fontSize: 14,
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
  filterSection: {
    paddingHorizontal: 24,
    paddingVertical: 20,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  filterLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#475569',
    marginBottom: 12,
  },
  filterScroll: {
    flexDirection: 'row',
  },
  filterBtn: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#f1f5f9',
    marginRight: 8,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  filterBtnActive: {
    backgroundColor: '#1a5c38',
    borderColor: '#1a5c38',
  },
  filterBtnText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#64748b',
  },
  filterBtnTextActive: {
    color: '#fff',
  },
  doctorsSection: {
    paddingHorizontal: 24,
    paddingVertical: 20,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1a1a2e',
    marginBottom: 16,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyIcon: {
    fontSize: 48,
    marginBottom: 12,
  },
  emptyText: {
    fontSize: 14,
    color: '#94a3b8',
  },
  doctorCard: {
    backgroundColor: '#fff',
    borderRadius: 14,
    padding: 16,
    marginBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
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
    marginBottom: 2,
  },
  doctorHospital: {
    fontSize: 12,
    color: '#94a3b8',
  },
  requestBtn: {
    backgroundColor: '#1a5c38',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
  },
  requestBtnText: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '700',
  },
  modalContainer: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 24,
    paddingTop: 20,
    paddingBottom: 40,
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  closeBtn: {
    fontSize: 24,
    color: '#64748b',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1a1a2e',
  },
  selectedDoctorInfo: {
    backgroundColor: '#EAF3DE',
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
  },
  selectedDoctorName: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1a5c38',
    marginBottom: 4,
  },
  selectedDoctorSpec: {
    fontSize: 13,
    color: '#1a5c38',
  },
  reasonSection: {
    marginBottom: 20,
  },
  reasonLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#475569',
    marginBottom: 10,
  },
  reasonInput: {
    backgroundColor: '#f8fafc',
    borderRadius: 12,
    padding: 14,
    fontSize: 14,
    color: '#1a1a2e',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    textAlignVertical: 'top',
  },
  submitBtn: {
    backgroundColor: '#1a5c38',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
  },
  submitBtnDisabled: {
    opacity: 0.6,
  },
  submitBtnText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
});

export default DoctorDiscovery;
