import React, { useState } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet,
  ActivityIndicator, Alert, SafeAreaView, TextInput, KeyboardAvoidingView, Platform
} from 'react-native';
import api from '@client-services/api';

const CreateConsultation = ({ navigation, route }) => {
  const { doctor_id, request_id, patient_id, doctor_name } = route.params;
  const [consultationDate, setConsultationDate] = useState(new Date().toISOString().split('T')[0]);
  const [notes, setNotes] = useState('');
  const [diagnosis, setDiagnosis] = useState('');
  const [prescription, setPrescription] = useState('');
  const [loading, setLoading] = useState(false);

  const handleCreateConsultation = async () => {
    // Validation
    if (!consultationDate.trim()) {
      Alert.alert('Required', 'Please enter consultation date');
      return;
    }

    if (!diagnosis.trim()) {
      Alert.alert('Required', 'Please enter diagnosis');
      return;
    }

    if (!prescription.trim()) {
      Alert.alert('Required', 'Please enter prescription');
      return;
    }

    setLoading(true);
    try {
      await api.post('/api/doctor/consultations', {
        patient_id,
        request_id,
        consultation_date: consultationDate,
        notes: notes || null,
        diagnosis,
        prescription
      });

      Alert.alert('Success', 'Consultation record created successfully');
      navigation.navigate('DoctorDashboard');
    } catch (error) {
      Alert.alert('Error', error.response?.data?.error || 'Failed to create consultation');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        <ScrollView showsVerticalScrollIndicator={false}>
          {/* Header */}
          <View style={styles.header}>
            <TouchableOpacity onPress={() => navigation.goBack()}>
              <Text style={styles.backBtn}>←</Text>
            </TouchableOpacity>
            <Text style={styles.title}>Create Consultation</Text>
          </View>

          {/* Patient Info */}
          <View style={styles.patientInfoSection}>
            <View style={styles.patientAvatar}>
              <Text style={styles.avatarText}>🧑⚕️</Text>
            </View>
            <View style={styles.patientDetails}>
              <Text style={styles.patientLabel}>Patient</Text>
              <Text style={styles.patientName}>Patient ID: {patient_id}</Text>
            </View>
          </View>

          {/* Form */}
          <View style={styles.formSection}>
            {/* Date */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Consultation Date</Text>
              <TextInput
                style={styles.input}
                placeholder="YYYY-MM-DD"
                placeholderTextColor="#94a3b8"
                value={consultationDate}
                onChangeText={setConsultationDate}
              />
              <Text style={styles.hint}>Format: YYYY-MM-DD (e.g., 2026-01-15)</Text>
            </View>

            {/* Diagnosis */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Diagnosis *</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                placeholder="Enter diagnosis (e.g., Hypertension, Type 2 Diabetes)"
                placeholderTextColor="#94a3b8"
                value={diagnosis}
                onChangeText={setDiagnosis}
                multiline
                numberOfLines={3}
              />
            </View>

            {/* Prescription */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Prescription *</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                placeholder="Enter prescription (e.g., Lisinopril 10mg daily, Metformin 500mg twice daily)"
                placeholderTextColor="#94a3b8"
                value={prescription}
                onChangeText={setPrescription}
                multiline
                numberOfLines={3}
              />
            </View>

            {/* Notes */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Additional Notes (Optional)</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                placeholder="Any additional notes about the consultation..."
                placeholderTextColor="#94a3b8"
                value={notes}
                onChangeText={setNotes}
                multiline
                numberOfLines={3}
              />
            </View>

            {/* Submit Button */}
            <TouchableOpacity
              style={[styles.submitBtn, loading && styles.submitBtnDisabled]}
              onPress={handleCreateConsultation}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.submitBtnText}>Create Consultation Record</Text>
              )}
            </TouchableOpacity>

            {/* Cancel Button */}
            <TouchableOpacity
              style={styles.cancelBtn}
              onPress={() => navigation.goBack()}
              disabled={loading}
            >
              <Text style={styles.cancelBtnText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  keyboardView: {
    flex: 1,
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
  patientInfoSection: {
    backgroundColor: '#fff',
    marginHorizontal: 24,
    marginTop: 20,
    borderRadius: 14,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
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
  patientDetails: {
    flex: 1,
  },
  patientLabel: {
    fontSize: 12,
    color: '#94a3b8',
    fontWeight: '600',
    marginBottom: 2,
  },
  patientName: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1a1a2e',
  },
  formSection: {
    paddingHorizontal: 24,
    paddingVertical: 20,
  },
  inputGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#475569',
    marginBottom: 10,
  },
  input: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 14,
    fontSize: 14,
    color: '#1a1a2e',
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  textArea: {
    textAlignVertical: 'top',
    minHeight: 100,
  },
  hint: {
    fontSize: 12,
    color: '#94a3b8',
    marginTop: 6,
  },
  submitBtn: {
    backgroundColor: '#1a5c38',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    marginBottom: 12,
    shadowColor: '#1a5c38',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  submitBtnDisabled: {
    opacity: 0.6,
  },
  submitBtnText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
  cancelBtn: {
    backgroundColor: '#f1f5f9',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  cancelBtnText: {
    color: '#1a5c38',
    fontSize: 16,
    fontWeight: '700',
  },
});

export default CreateConsultation;
