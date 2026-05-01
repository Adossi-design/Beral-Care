import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TextInput, TouchableOpacity, Alert, ActivityIndicator, Modal, Platform } from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import PatientLayout from '../../components/layouts/PatientLayout';
import ProtectedRoute from '../../components/ProtectedRoute';
import api from '@client-services/api';

const STATUS_COLORS = { pending: '#f59e0b', completed: '#22c55e', cancelled: '#ef4444' };

const PatientAppointments = ({ navigation }) => {
  const [appointments, setAppointments] = useState([]);
  const [doctors, setDoctors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedDoctor, setSelectedDoctor] = useState(null);
  const [date, setDate] = useState('');
  const [notes, setNotes] = useState('');
  const [booking, setBooking] = useState(false);
  const [showDoctorPicker, setShowDoctorPicker] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [selectedDate, setSelectedDate] = useState(new Date());

  const fetchData = () => {
    Promise.all([
      api.get('/api/patient/appointments'),
      api.get('/api/patient/doctors'),
    ])
      .then(([apptRes, doctorsRes]) => {
        setAppointments(apptRes.data);
        setDoctors(doctorsRes.data);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchData(); }, []);

  const handleBook = async () => {
    if (!selectedDoctor || !date) {
      Alert.alert('Error', 'Please select a doctor and date');
      return;
    }
    setBooking(true);
    try {
      await api.post('/api/patient/appointments', { 
        doctor_id: selectedDoctor.id, 
        consultation_date: date, 
        notes, 
        status: 'pending' 
      });
      Alert.alert('Success', 'Appointment booked!');
      setSelectedDoctor(null); 
      setDate(''); 
      setSelectedDate(new Date());
      setNotes('');
      fetchData();
    } catch (error) {
      Alert.alert('Error', error.response?.data?.error || 'Failed to book appointment');
    } finally {
      setBooking(false);
    }
  };

  const handleDateChange = (event, selected) => {
    if (Platform.OS === 'android') {
      setShowDatePicker(false);
    }
    if (selected) {
      setSelectedDate(selected);
      const formatted = selected.toISOString().split('T')[0];
      setDate(formatted);
    }
  };

  return (
    <ProtectedRoute requiredRole="patient" navigation={navigation}>
      <PatientLayout navigation={navigation} activeScreen="PatientAppointments">
        <ScrollView style={styles.scroll} contentContainerStyle={styles.content}>
          <Text style={styles.heading}>Appointments</Text>

          {/* Booking form */}
          <View style={styles.bookCard}>
            <Text style={styles.bookTitle}>Book New Appointment</Text>
            
            <Text style={styles.label}>Select Doctor</Text>
            <TouchableOpacity 
              style={styles.pickerBtn} 
              onPress={() => setShowDoctorPicker(true)}
            >
              <Text style={styles.pickerBtnText}>
                {selectedDoctor ? selectedDoctor.full_name : 'Tap to select a doctor'}
              </Text>
              <Text style={styles.pickerArrow}>▼</Text>
            </TouchableOpacity>
            
            <Text style={styles.label}>Date</Text>
            <TouchableOpacity 
              style={styles.pickerBtn} 
              onPress={() => setShowDatePicker(true)}
            >
              <Text style={styles.pickerBtnText}>
                {date || 'Tap to select date'}
              </Text>
              <Text style={styles.pickerArrow}>📅</Text>
            </TouchableOpacity>
            
            {showDatePicker && (
              <DateTimePicker
                value={selectedDate}
                mode="date"
                display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                onChange={handleDateChange}
                minimumDate={new Date()}
              />
            )}
            
            {Platform.OS === 'ios' && showDatePicker && (
              <TouchableOpacity 
                style={styles.datePickerDone}
                onPress={() => setShowDatePicker(false)}
              >
                <Text style={styles.datePickerDoneText}>Done</Text>
              </TouchableOpacity>
            )}
            
            <Text style={styles.label}>Notes (optional)</Text>
            <TextInput 
              style={[styles.input, styles.textArea]} 
              placeholder="Describe your concern..." 
              placeholderTextColor="#aaa" 
              value={notes} 
              onChangeText={setNotes} 
              multiline 
              numberOfLines={3} 
              textAlignVertical="top" 
            />
            
            <TouchableOpacity 
              style={[styles.bookBtn, booking && styles.bookBtnDisabled]} 
              onPress={handleBook} 
              disabled={booking}
            >
              <Text style={styles.bookBtnText}>{booking ? 'Booking...' : 'Book Appointment'}</Text>
            </TouchableOpacity>
          </View>

          {/* Doctor Picker Modal */}
          <Modal
            visible={showDoctorPicker}
            transparent
            animationType="slide"
            onRequestClose={() => setShowDoctorPicker(false)}
          >
            <View style={styles.modalOverlay}>
              <View style={styles.modalContent}>
                <View style={styles.modalHeader}>
                  <Text style={styles.modalTitle}>Select a Doctor</Text>
                  <TouchableOpacity onPress={() => setShowDoctorPicker(false)}>
                    <Text style={styles.modalClose}>✕</Text>
                  </TouchableOpacity>
                </View>
                <ScrollView style={styles.doctorList}>
                  {doctors.length === 0 ? (
                    <Text style={styles.noDoctors}>No doctors available</Text>
                  ) : (
                    doctors.map(doc => (
                      <TouchableOpacity
                        key={doc.id}
                        style={[
                          styles.doctorItem,
                          selectedDoctor?.id === doc.id && styles.doctorItemSelected
                        ]}
                        onPress={() => {
                          setSelectedDoctor(doc);
                          setShowDoctorPicker(false);
                        }}
                      >
                        <View style={styles.doctorAvatar}>
                          <Text style={styles.doctorAvatarText}>{doc.full_name[0].toUpperCase()}</Text>
                        </View>
                        <View style={styles.doctorInfo}>
                          <Text style={styles.doctorName}>{doc.full_name}</Text>
                          <Text style={styles.doctorEmail}>{doc.email}</Text>
                        </View>
                        {selectedDoctor?.id === doc.id && (
                          <Text style={styles.checkMark}>✓</Text>
                        )}
                      </TouchableOpacity>
                    ))
                  )}
                </ScrollView>
              </View>
            </View>
          </Modal>

          {/* Appointments list */}
          <Text style={styles.sectionTitle}>My Appointments</Text>
          {loading ? (
            <ActivityIndicator color="#1a5c38" />
          ) : appointments.length === 0 ? (
            <Text style={styles.emptyText}>No appointments yet</Text>
          ) : (
            appointments.map(a => (
              <View key={a.id} style={styles.card}>
                <View style={styles.cardLeft}>
                  {a.doctor_name && <Text style={styles.doctorNameCard}>Dr. {a.doctor_name}</Text>}
                  <Text style={styles.date}>{new Date(a.consultation_date).toLocaleDateString()}</Text>
                  {a.notes && <Text style={styles.notes}>{a.notes}</Text>}
                </View>
                <View style={[styles.badge, { backgroundColor: (STATUS_COLORS[a.status] || '#94a3b8') + '22' }]}>
                  <Text style={[styles.badgeText, { color: STATUS_COLORS[a.status] || '#94a3b8' }]}>{a.status}</Text>
                </View>
              </View>
            ))
          )}
        </ScrollView>
      </PatientLayout>
    </ProtectedRoute>
  );
};

const styles = StyleSheet.create({
  scroll:          { flex: 1 },
  content:         { padding: 20, paddingBottom: 40 },
  heading:         { fontSize: 20, fontWeight: 'bold', color: '#1a1a2e', marginBottom: 20 },
  bookCard:        { backgroundColor: '#fff', borderRadius: 16, padding: 18, marginBottom: 24, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 8, elevation: 2 },
  bookTitle:       { fontSize: 16, fontWeight: '700', color: '#1a5c38', marginBottom: 14 },
  label:           { fontSize: 14, fontWeight: '600', color: '#1a1a2e', marginBottom: 6, marginTop: 10 },
  
  pickerBtn:       { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#f4f6f8', borderRadius: 12, padding: 13, borderWidth: 1, borderColor: '#e2e8f0' },
  pickerBtnText:   { fontSize: 15, color: '#1a1a2e', flex: 1 },
  pickerArrow:     { fontSize: 16, color: '#64748b' },
  
  datePickerDone:  { backgroundColor: '#1a5c38', borderRadius: 10, paddingVertical: 10, alignItems: 'center', marginTop: 10 },
  datePickerDoneText: { color: '#fff', fontWeight: '700', fontSize: 14 },
  
  input:           { backgroundColor: '#f4f6f8', borderRadius: 12, padding: 13, fontSize: 15, color: '#1a1a2e', borderWidth: 1, borderColor: '#e2e8f0' },
  textArea:        { height: 80 },
  bookBtn:         { backgroundColor: '#1a5c38', borderRadius: 14, paddingVertical: 14, alignItems: 'center', marginTop: 18 },
  bookBtnDisabled: { opacity: 0.6 },
  bookBtnText:     { color: '#fff', fontWeight: 'bold', fontSize: 15 },
  
  modalOverlay:    { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalContent:    { backgroundColor: '#fff', borderTopLeftRadius: 24, borderTopRightRadius: 24, maxHeight: '70%' },
  modalHeader:     { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 20, borderBottomWidth: 1, borderBottomColor: '#f1f5f9' },
  modalTitle:      { fontSize: 18, fontWeight: '700', color: '#1a1a2e' },
  modalClose:      { fontSize: 24, color: '#64748b' },
  
  doctorList:      { padding: 16 },
  noDoctors:       { textAlign: 'center', color: '#94a3b8', fontSize: 14, paddingVertical: 40 },
  doctorItem:      { flexDirection: 'row', alignItems: 'center', padding: 14, borderRadius: 12, marginBottom: 10, backgroundColor: '#f8fafc', borderWidth: 1, borderColor: '#e2e8f0' },
  doctorItemSelected: { backgroundColor: '#EAF3DE', borderColor: '#1a5c38' },
  doctorAvatar:    { width: 44, height: 44, borderRadius: 22, backgroundColor: '#185FA5', justifyContent: 'center', alignItems: 'center', marginRight: 12 },
  doctorAvatarText:{ color: '#fff', fontSize: 16, fontWeight: '800' },
  doctorInfo:      { flex: 1 },
  doctorName:      { fontSize: 15, fontWeight: '700', color: '#1a1a2e', marginBottom: 2 },
  doctorEmail:     { fontSize: 12, color: '#64748b' },
  checkMark:       { fontSize: 20, color: '#1a5c38', fontWeight: '700' },
  
  sectionTitle:    { fontSize: 16, fontWeight: '700', color: '#1a1a2e', marginBottom: 12 },
  emptyText:       { color: '#94a3b8', fontSize: 14 },
  card:            { backgroundColor: '#fff', borderRadius: 14, padding: 16, marginBottom: 10, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderLeftWidth: 3, borderLeftColor: '#1a5c38', shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 6, elevation: 2 },
  cardLeft:        { flex: 1 },
  doctorNameCard:  { fontSize: 13, fontWeight: '700', color: '#185FA5', marginBottom: 4 },
  date:            { fontWeight: '700', color: '#1a1a2e', fontSize: 15 },
  notes:           { color: '#64748b', fontSize: 13, marginTop: 4 },
  badge:           { paddingHorizontal: 12, paddingVertical: 4, borderRadius: 20 },
  badgeText:       { fontSize: 12, fontWeight: '600', textTransform: 'capitalize' },
});

export default PatientAppointments;
