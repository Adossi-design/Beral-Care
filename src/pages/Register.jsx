import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, ScrollView,
  StyleSheet, KeyboardAvoidingView, Platform, Alert, ActivityIndicator, SafeAreaView,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import api from '@client-services/api';

const ROLE_DASHBOARDS = { doctor: 'DoctorDashboard', patient: 'PatientDashboard' };

const Register = ({ navigation }) => {
  const { login } = useAuth();
  const { language, changeLanguage, t } = useLanguage();
  const [role, setRole] = useState('patient');
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [specialization, setSpecialization] = useState('');
  const [hospitalName, setHospitalName] = useState('');
  const [hospitalLocation, setHospitalLocation] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const validateForm = () => {
    if (!fullName.trim()) return 'Full name is required';
    if (!email.trim()) return 'Email is required';
    if (!phone.trim()) return 'Phone number is required';
    if (!password) return 'Password is required';
    if (!confirmPassword) return 'Confirm password is required';
    if (password !== confirmPassword) return 'Passwords do not match';
    if (password.length < 8) return 'Password must be at least 8 characters';
    if (!/[A-Z]/.test(password)) return 'Password must contain uppercase letter';
    if (!/[a-z]/.test(password)) return 'Password must contain lowercase letter';
    if (!/[0-9]/.test(password)) return 'Password must contain number';
    if (role === 'doctor') {
      if (!specialization.trim()) return 'Specialization is required for doctors';
      if (!hospitalName.trim()) return 'Hospital name is required for doctors';
      if (!hospitalLocation.trim()) return 'Hospital location is required for doctors';
    }
    return null;
  };

  const handleRegister = async () => {
    const error = validateForm();
    if (error) {
      Alert.alert('Validation Error', error);
      return;
    }

    setLoading(true);
    try {
      const hospital = role === 'doctor' ? `${hospitalName}, ${hospitalLocation}` : undefined;
      const res = await api.post('/api/auth/register', { 
        full_name: fullName, 
        email, 
        phone, 
        password, 
        role, 
        specialization: role === 'doctor' ? specialization : undefined,
        hospital,
      });
      await login(res.data.user, res.data.token);
      navigation.replace(ROLE_DASHBOARDS[res.data.user.role] || 'PatientDashboard');
    } catch (error) {
      Alert.alert('Registration Failed', error.response?.data?.error || 'Failed to create account');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    Alert.alert('Not Available', 'Google Sign-In has been disabled. Please use email and password to register.');
  };

  const toggleLanguage = () => {
    changeLanguage(language === 'en' ? 'fr' : 'en');
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar style="light" />
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.container}
      >
        {/* Green Header */}
        <View style={styles.header}>
          <View style={styles.headerTop}>
            <TouchableOpacity 
              style={styles.backBtn}
              onPress={() => navigation.goBack()}
            >
              <Text style={styles.backBtnText}>←</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.langBtn} onPress={toggleLanguage}>
              <Text style={styles.langBtnText}>{language === 'en' ? '🇫🇷 FR' : '🇬🇧 EN'}</Text>
            </TouchableOpacity>
          </View>
          <Text style={styles.title}>Create Account</Text>
          <Text style={styles.subtitle}>Sign up to get started</Text>
        </View>

        <ScrollView 
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Role Selection */}
          <View style={styles.roleSection}>
            <Text style={styles.roleLabel}>{t('iAmA')}</Text>
            <View style={styles.roleRow}>
              <TouchableOpacity
                style={[styles.roleCard, role === 'patient' && styles.roleCardActive]}
                onPress={() => setRole('patient')}
              >
                <Text style={styles.roleIcon}>🧑⚕️</Text>
                <Text style={[styles.roleText, role === 'patient' && styles.roleTextActive]}>{t('patient')}</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.roleCard, role === 'doctor' && styles.roleCardActive]}
                onPress={() => setRole('doctor')}
              >
                <Text style={styles.roleIcon}>👨⚕️</Text>
                <Text style={[styles.roleText, role === 'doctor' && styles.roleTextActive]}>{t('doctor')}</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Form */}
          <View style={styles.form}>
            <View style={styles.inputGroup}>
              <Text style={styles.label}>{t('fullName')}</Text>
              <TextInput
                style={styles.input}
                placeholder={language === 'en' ? 'Your full name' : 'Votre nom complet'}
                placeholderTextColor="#94a3b8"
                value={fullName}
                onChangeText={setFullName}
                autoCapitalize="words"
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>{t('email')}</Text>
              <TextInput
                style={styles.input}
                placeholder="your@email.com"
                placeholderTextColor="#94a3b8"
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>{t('phoneNumber')}</Text>
              <TextInput
                style={styles.input}
                placeholder="+250 788 000 000"
                placeholderTextColor="#94a3b8"
                value={phone}
                onChangeText={setPhone}
                keyboardType="phone-pad"
              />
            </View>

            {role === 'doctor' && (
              <>
                <View style={styles.inputGroup}>
                  <Text style={styles.label}>{t('specialization')}</Text>
                  <TextInput
                    style={styles.input}
                    placeholder={language === 'en' ? 'e.g. Cardiology, Pediatrics' : 'ex. Cardiologie, Pédiatrie'}
                    placeholderTextColor="#94a3b8"
                    value={specialization}
                    onChangeText={setSpecialization}
                    autoCapitalize="words"
                  />
                </View>

                <View style={styles.inputGroup}>
                  <Text style={styles.label}>Hospital Name</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="e.g. Kigali Central Hospital"
                    placeholderTextColor="#94a3b8"
                    value={hospitalName}
                    onChangeText={setHospitalName}
                    autoCapitalize="words"
                  />
                </View>

                <View style={styles.inputGroup}>
                  <Text style={styles.label}>Hospital Location</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="e.g. Kigali, Rwanda"
                    placeholderTextColor="#94a3b8"
                    value={hospitalLocation}
                    onChangeText={setHospitalLocation}
                    autoCapitalize="words"
                  />
                </View>
              </>
            )}

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Password</Text>
              <View style={styles.passwordContainer}>
                <TextInput
                  style={[styles.input, styles.passwordInput]}
                  placeholder="••••••••"
                  placeholderTextColor="#94a3b8"
                  secureTextEntry={!showPassword}
                  value={password}
                  onChangeText={setPassword}
                  autoCapitalize="none"
                />
                <TouchableOpacity 
                  style={styles.eyeBtn} 
                  onPress={() => setShowPassword(!showPassword)}
                >
                  <Text style={styles.eyeIcon}>{showPassword ? '👁️' : '👁️🗨️'}</Text>
                </TouchableOpacity>
              </View>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Confirm Password</Text>
              <View style={styles.passwordContainer}>
                <TextInput
                  style={[styles.input, styles.passwordInput]}
                  placeholder="••••••••"
                  placeholderTextColor="#94a3b8"
                  secureTextEntry={!showConfirmPassword}
                  value={confirmPassword}
                  onChangeText={setConfirmPassword}
                  autoCapitalize="none"
                />
                <TouchableOpacity 
                  style={styles.eyeBtn} 
                  onPress={() => setShowConfirmPassword(!showConfirmPassword)}
                >
                  <Text style={styles.eyeIcon}>{showConfirmPassword ? '👁️' : '👁️🗨️'}</Text>
                </TouchableOpacity>
              </View>
            </View>

            <TouchableOpacity 
              style={[styles.registerBtn, loading && styles.registerBtnDisabled]} 
              onPress={handleRegister}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.registerBtnText}>Sign Up</Text>
              )}
            </TouchableOpacity>

            <TouchableOpacity 
              style={styles.loginLink}
              onPress={() => navigation.navigate('Login')}
            >
              <Text style={styles.loginLinkText}>
                Already have an account? <Text style={styles.loginLinkBold}>Login</Text>
              </Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#1a5c38',
  },
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    backgroundColor: '#1a5c38',
    paddingTop: Platform.OS === 'ios' ? 20 : 40,
    paddingBottom: 32,
    paddingHorizontal: 24,
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  backBtnText: {
    fontSize: 24,
    color: '#fff',
  },
  langBtn: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  langBtnText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: '#fff',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#d1fae5',
  },
  scrollContent: {
    paddingHorizontal: 24,
    paddingBottom: 40,
  },
  roleSection: {
    marginTop: 28,
    marginBottom: 28,
  },
  roleLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#475569',
    marginBottom: 14,
  },
  roleRow: {
    flexDirection: 'row',
    gap: 14,
  },
  roleCard: {
    flex: 1,
    backgroundColor: '#f8fafc',
    borderRadius: 14,
    padding: 22,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#e2e8f0',
  },
  roleCardActive: {
    backgroundColor: '#EAF3DE',
    borderColor: '#1a5c38',
  },
  roleIcon: {
    fontSize: 36,
    marginBottom: 10,
  },
  roleText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#64748b',
  },
  roleTextActive: {
    color: '#1a5c38',
  },
  form: {
    flex: 1,
  },
  inputGroup: {
    marginBottom: 22,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#475569',
    marginBottom: 10,
  },
  input: {
    backgroundColor: '#f8fafc',
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    color: '#1a1a2e',
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  passwordContainer: {
    position: 'relative',
  },
  passwordInput: {
    paddingRight: 50,
  },
  eyeBtn: {
    position: 'absolute',
    right: 16,
    top: 16,
    padding: 4,
  },
  eyeIcon: {
    fontSize: 20,
  },
  registerBtn: {
    backgroundColor: '#1a5c38',
    borderRadius: 12,
    padding: 18,
    alignItems: 'center',
    marginTop: 8,
    shadowColor: '#1a5c38',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  registerBtnDisabled: {
    opacity: 0.6,
  },
  registerBtnText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 28,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: '#e2e8f0',
  },
  dividerText: {
    marginHorizontal: 16,
    color: '#94a3b8',
    fontSize: 14,
  },
  googleBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fff',
    borderWidth: 2,
    borderColor: '#e2e8f0',
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  googleIcon: {
    fontSize: 20,
    marginRight: 12,
  },
  googleBtnText: {
    color: '#1a1a2e',
    fontSize: 16,
    fontWeight: '600',
  },
  loginLink: {
    alignItems: 'center',
    marginTop: 8,
    paddingVertical: 12,
  },
  loginLinkText: {
    color: '#64748b',
    fontSize: 14,
  },
  loginLinkBold: {
    color: '#1a5c38',
    fontWeight: '700',
  },
});

export default Register;
