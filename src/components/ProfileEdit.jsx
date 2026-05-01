import React, { useEffect, useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, ActivityIndicator,
  TextInput, Image, SafeAreaView
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import * as ImagePicker from 'expo-image-picker';
import api from '@client-services/api';

/**
 * Shared ProfileEdit Component
 * Used by both Patient and Doctor profile edit screens
 * 
 * Props:
 * - role: 'patient' or 'doctor'
 * - Layout: Layout component to wrap the screen
 * - navigation: Navigation object
 * - activeScreen: Active screen name for layout
 */
const ProfileEdit = ({ role, Layout, navigation, activeScreen }) => {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [editMode, setEditMode] = useState(false);
  const [uploading, setUploading] = useState(false);

  // Edit form state
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [specialization, setSpecialization] = useState('');
  const [hospital, setHospital] = useState('');

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      setLoading(true);
      const res = await api.get('/api/profile');
      setProfile(res.data);
      setFullName(res.data.full_name);
      setPhone(res.data.phone || '');
      if (role === 'doctor') {
        setSpecialization(res.data.specialization || '');
        setHospital(res.data.hospital || '');
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to load profile');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveProfile = async () => {
    if (!fullName.trim()) {
      Alert.alert('Error', 'Full name is required');
      return;
    }

    if (role === 'doctor' && (!specialization.trim() || !hospital.trim())) {
      Alert.alert('Error', 'Specialization and hospital are required');
      return;
    }

    try {
      setLoading(true);
      const updateData = {
        full_name: fullName,
        phone: phone || null,
      };

      if (role === 'doctor') {
        updateData.specialization = specialization;
        updateData.hospital = hospital;
      }

      await api.put('/api/profile', updateData);
      Alert.alert('Success', 'Profile updated successfully');
      setEditMode(false);
      await fetchProfile();
    } catch (error) {
      Alert.alert('Error', error.response?.data?.error || 'Failed to update profile');
    } finally {
      setLoading(false);
    }
  };

  const handlePickImage = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (!result.canceled) {
        await uploadImage(result.assets[0]);
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to pick image');
    }
  };

  const uploadImage = async (imageAsset) => {
    try {
      setUploading(true);
      const formData = new FormData();
      formData.append('image', {
        uri: imageAsset.uri,
        type: imageAsset.type || 'image/jpeg',
        name: `profile_${Date.now()}.jpg`,
      });

      await api.post('/api/profile/upload-image', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      Alert.alert('Success', 'Image uploaded successfully');
      await fetchProfile();
    } catch (error) {
      Alert.alert('Error', 'Failed to upload image');
      console.error(error);
    } finally {
      setUploading(false);
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <ActivityIndicator size="large" color="#1a5c38" style={{ marginTop: 40 }} />
      </SafeAreaView>
    );
  }

  if (!profile) {
    return (
      <SafeAreaView style={styles.container}>
        <Text style={styles.errorText}>Failed to load profile</Text>
      </SafeAreaView>
    );
  }

  const headerGradient = role === 'doctor' ? ['#0c4a6e', '#0369a1'] : ['#1a5c38', '#2d8653'];
  const primaryColor = role === 'doctor' ? '#0369a1' : '#1a5c38';

  const content = (
    <ScrollView style={styles.scroll} contentContainerStyle={styles.content}>
      {/* Profile Header */}
      <LinearGradient colors={headerGradient} style={styles.header}>
        <View style={styles.avatarContainer}>
          {profile.profile_image_url ? (
            <Image
              source={{ uri: profile.profile_image_url }}
              style={styles.avatar}
            />
          ) : (
            <View style={styles.avatarPlaceholder}>
              <Text style={styles.avatarText}>{profile.full_name?.[0]?.toUpperCase() || 'U'}</Text>
            </View>
          )}
          {!editMode && (
            <TouchableOpacity
              style={styles.cameraBtn}
              onPress={handlePickImage}
              disabled={uploading}
            >
              <Text style={styles.cameraBtnText}>📷</Text>
            </TouchableOpacity>
          )}
        </View>
        <Text style={styles.headerName}>{profile.full_name}</Text>
        {role === 'patient' && <Text style={styles.headerPatientId}>{profile.patient_id}</Text>}
        {role === 'doctor' && <Text style={styles.headerPatientId}>{profile.specialization}</Text>}
      </LinearGradient>

      {!editMode ? (
        <>
          {/* View Mode */}
          <View style={styles.infoCard}>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Email</Text>
              <Text style={styles.infoValue}>{profile.email}</Text>
            </View>
            <View style={styles.divider} />
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Phone</Text>
              <Text style={styles.infoValue}>{profile.phone || 'Not provided'}</Text>
            </View>
            {role === 'doctor' && (
              <>
                <View style={styles.divider} />
                <View style={styles.infoRow}>
                  <Text style={styles.infoLabel}>Specialization</Text>
                  <Text style={styles.infoValue}>{profile.specialization || 'Not provided'}</Text>
                </View>
                <View style={styles.divider} />
                <View style={styles.infoRow}>
                  <Text style={styles.infoLabel}>Hospital</Text>
                  <Text style={styles.infoValue}>{profile.hospital || 'Not provided'}</Text>
                </View>
              </>
            )}
            <View style={styles.divider} />
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Member Since</Text>
              <Text style={styles.infoValue}>
                {new Date(profile.created_at).toLocaleDateString()}
              </Text>
            </View>
          </View>

          <TouchableOpacity
            style={[styles.editBtn, { backgroundColor: primaryColor }]}
            onPress={() => setEditMode(true)}
          >
            <Text style={styles.editBtnText}>✏️ Edit Profile</Text>
          </TouchableOpacity>
        </>
      ) : (
        <>
          {/* Edit Mode */}
          <View style={styles.formCard}>
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Full Name</Text>
              <TextInput
                style={styles.input}
                value={fullName}
                onChangeText={setFullName}
                placeholder="Enter your full name"
                placeholderTextColor="#94a3b8"
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Phone</Text>
              <TextInput
                style={styles.input}
                value={phone}
                onChangeText={setPhone}
                placeholder="Enter your phone number"
                placeholderTextColor="#94a3b8"
                keyboardType="phone-pad"
              />
            </View>

            {role === 'doctor' && (
              <>
                <View style={styles.inputGroup}>
                  <Text style={styles.label}>Specialization</Text>
                  <TextInput
                    style={styles.input}
                    value={specialization}
                    onChangeText={setSpecialization}
                    placeholder="Enter your specialization"
                    placeholderTextColor="#94a3b8"
                  />
                </View>

                <View style={styles.inputGroup}>
                  <Text style={styles.label}>Hospital</Text>
                  <TextInput
                    style={styles.input}
                    value={hospital}
                    onChangeText={setHospital}
                    placeholder="Enter your hospital"
                    placeholderTextColor="#94a3b8"
                  />
                </View>
              </>
            )}

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Email (Read-only)</Text>
              <TextInput
                style={[styles.input, styles.inputDisabled]}
                value={profile.email}
                editable={false}
                placeholderTextColor="#94a3b8"
              />
            </View>

            <View style={styles.buttonRow}>
              <TouchableOpacity
                style={[styles.saveBtn, loading && styles.btnDisabled, { backgroundColor: primaryColor }]}
                onPress={handleSaveProfile}
                disabled={loading}
              >
                <Text style={styles.saveBtnText}>✓ Save Changes</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.cancelBtn}
                onPress={() => {
                  setEditMode(false);
                  setFullName(profile.full_name);
                  setPhone(profile.phone || '');
                  if (role === 'doctor') {
                    setSpecialization(profile.specialization || '');
                    setHospital(profile.hospital || '');
                  }
                }}
                disabled={loading}
              >
                <Text style={styles.cancelBtnText}>✕ Cancel</Text>
              </TouchableOpacity>
            </View>
          </View>
        </>
      )}

      <View style={{ height: 20 }} />
    </ScrollView>
  );

  if (Layout) {
    return (
      <Layout navigation={navigation} activeScreen={activeScreen}>
        {content}
      </Layout>
    );
  }

  return content;
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8fafc' },
  scroll: { flex: 1, backgroundColor: '#f8fafc' },
  content: { paddingBottom: 40 },

  header: { paddingVertical: 32, paddingHorizontal: 24, alignItems: 'center' },
  avatarContainer: { position: 'relative', marginBottom: 16 },
  avatar: { width: 100, height: 100, borderRadius: 50, borderWidth: 3, borderColor: '#fff' },
  avatarPlaceholder: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: 'rgba(255,255,255,0.3)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: '#fff',
  },
  avatarText: { fontSize: 40, fontWeight: '800', color: '#fff' },
  cameraBtn: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 4,
  },
  cameraBtnText: { fontSize: 20 },

  headerName: { fontSize: 22, fontWeight: '800', color: '#fff', marginBottom: 4 },
  headerPatientId: { fontSize: 13, color: 'rgba(255,255,255,0.8)', letterSpacing: 1 },

  infoCard: { backgroundColor: '#fff', marginHorizontal: 20, marginTop: 20, borderRadius: 14, padding: 16 },
  infoRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 12 },
  infoLabel: { fontSize: 13, color: '#94a3b8', fontWeight: '600' },
  infoValue: { fontSize: 14, color: '#1a1a2e', fontWeight: '600', maxWidth: '60%', textAlign: 'right' },
  divider: { height: 1, backgroundColor: '#f1f5f9' },

  editBtn: {
    marginHorizontal: 20,
    marginTop: 20,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  editBtnText: { color: '#fff', fontSize: 15, fontWeight: '700' },

  formCard: { backgroundColor: '#fff', marginHorizontal: 20, marginTop: 20, borderRadius: 14, padding: 16 },
  inputGroup: { marginBottom: 16 },
  label: { fontSize: 13, fontWeight: '600', color: '#475569', marginBottom: 8 },
  input: {
    backgroundColor: '#f8fafc',
    borderRadius: 10,
    padding: 12,
    fontSize: 14,
    color: '#1a1a2e',
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  inputDisabled: { backgroundColor: '#f1f5f9', color: '#94a3b8' },

  buttonRow: { flexDirection: 'row', gap: 10, marginTop: 20 },
  saveBtn: { flex: 1, paddingVertical: 12, borderRadius: 10, alignItems: 'center' },
  saveBtnText: { color: '#fff', fontSize: 14, fontWeight: '700' },
  cancelBtn: { flex: 1, backgroundColor: '#f1f5f9', paddingVertical: 12, borderRadius: 10, alignItems: 'center', borderWidth: 1, borderColor: '#e2e8f0' },
  cancelBtnText: { color: '#1a5c38', fontSize: 14, fontWeight: '700' },
  btnDisabled: { opacity: 0.6 },

  errorText: { color: '#ef4444', fontSize: 14, textAlign: 'center', marginTop: 20 },
});

export default ProfileEdit;
