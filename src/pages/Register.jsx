import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity,
  StyleSheet, ScrollView, Alert, SafeAreaView,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { StatusBar } from 'expo-status-bar';
import { useAuth } from '../context/AuthContext';
import api from '../../client-services/api';

const ROLE_DASHBOARDS = { doctor: 'DoctorDashboard', patient: 'PatientDashboard' };

const ROLES = [
  { key: 'patient', icon: '🧑⚕️', title: 'Patient',  desc: 'I need care',     activeColor: '#1a5c38', activeBg: '#EAF3DE' },
  { key: 'doctor',  icon: '👨⚕️', title: 'Doctor',   desc: 'I provide care',  activeColor: '#185FA5', activeBg: '#E6F1FB' },
];

const Register = ({ navigation }) => {
  const { login } = useAuth();
  const [role, setRole] = useState('patient');
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const activeRole = ROLES.find(r => r.key === role);

  const handleRegister = async () => {
    if (!fullName || !email || !phone || !password) {
      Alert.alert('Missing fields', 'All fields are required');
      return;
    }
    setLoading(true);
    try {
      const res = await api.post('/api/auth/register', { full_name: fullName, email, phone, password, role });
      await login(res.data.user, res.data.token);
      navigation.replace(ROLE_DASHBOARDS[res.data.user.role] || 'PatientDashboard');
    } catch (error) {
      Alert.alert('Registration Failed', error.response?.data?.error || 'Failed to create account');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.root}>
      <StatusBar style="light" />

      <LinearGradient colors={['#185FA5', '#1a5c38']} style={styles.topBand} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}>
        <SafeAreaView>
          <View style={styles.topContent}>
            <Text style={styles.topEmoji}>🩺</Text>
            <Text style={styles.topTitle}>Create Account</Text>
            <Text style={styles.topSub}>Join Beral Care today</Text>
          </View>
        </SafeAreaView>
        <View style={styles.wave} />
      </LinearGradient>

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <View style={styles.card}>

          {/* Google button */}
          <TouchableOpacity style={styles.googleBtn} onPress={() => Alert.alert('Coming Soon', 'Google Sign-In will be available soon')}>
            <Text style={styles.googleIcon}>G</Text>
            <Text style={styles.googleText}>Continue with Google</Text>
          </TouchableOpacity>

          <View style={styles.dividerRow}>
            <View style={styles.dividerLine} />
            <Text style={styles.dividerText}>or register with email</Text>
            <View style={styles.dividerLine} />
          </View>

          {/* Role selector — admin never appears here */}
          <Text style={styles.roleHeading}>I am joining as a...</Text>
          <View style={styles.roleRow}>
            {ROLES.map(r => (
              <TouchableOpacity
                key={r.key}
                style={[styles.roleCard, role === r.key && { borderColor: r.activeColor, backgroundColor: r.activeBg }]}
                onPress={() => setRole(r.key)}
                activeOpacity={0.8}
              >
                {role === r.key && (
                  <View style={[styles.roleCheck, { backgroundColor: r.activeColor }]}>
                    <Text style={styles.roleCheckMark}>✓</Text>
                  </View>
                )}
                <Text style={styles.roleCardIcon}>{r.icon}</Text>
                <Text style={[styles.roleCardTitle, role === r.key && { color: r.activeColor }]}>{r.title}</Text>
                <Text style={styles.roleCardDesc}>{r.desc}</Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Form fields */}
          {[
            { label: 'Full Name',     icon: '👤', value: fullName,  setter: setFullName,  placeholder: 'Your full name',        keyboard: 'default' },
            { label: 'Email',         icon: '✉️', value: email,     setter: setEmail,     placeholder: 'your@email.com',        keyboard: 'email-address', caps: 'none' },
            { label: 'Phone Number',  icon: '📱', value: phone,     setter: setPhone,     placeholder: '+250 788 000 000',      keyboard: 'phone-pad' },
          ].map(f => (
            <View key={f.label}>
              <Text style={styles.label}>{f.label}</Text>
              <View style={styles.inputWrap}>
                <Text style={styles.inputIcon}>{f.icon}</Text>
                <TextInput
                  style={[styles.input, { flex: 1 }]}
                  placeholder={f.placeholder}
                  placeholderTextColor="#b0bec5"
                  value={f.value}
                  onChangeText={f.setter}
                  keyboardType={f.keyboard || 'default'}
                  autoCapitalize={f.caps || 'words'}
                />
              </View>
            </View>
          ))}

          <Text style={styles.label}>Password</Text>
          <View style={styles.inputWrap}>
            <Text style={styles.inputIcon}>🔒</Text>
            <TextInput
              style={[styles.input, { flex: 1 }]}
              placeholder="Min 8 chars, uppercase & number"
              placeholderTextColor="#b0bec5"
              secureTextEntry={!showPassword}
              value={password}
              onChangeText={setPassword}
              autoCapitalize="none"
            />
            <TouchableOpacity onPress={() => setShowPassword(!showPassword)} style={styles.eyeBtn}>
              <Text style={styles.eyeIcon}>{showPassword ? '🙈' : '👁️'}</Text>
            </TouchableOpacity>
          </View>

          {/* Register button */}
          <TouchableOpacity onPress={handleRegister} disabled={loading} style={{ marginTop: 28 }}>
            <LinearGradient
              colors={loading ? ['#94a3b8', '#94a3b8'] : (role === 'doctor' ? ['#185FA5', '#1a5c38'] : ['#1a5c38', '#185FA5'])}
              style={styles.registerBtn}
              start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
            >
              <Text style={styles.registerBtnText}>{loading ? 'Creating account...' : `Create ${activeRole?.title} Account`}</Text>
            </LinearGradient>
          </TouchableOpacity>

          <TouchableOpacity style={styles.loginLink} onPress={() => navigation.navigate('Login')}>
            <Text style={styles.loginLinkText}>
              Already have an account?{'  '}
              <Text style={styles.loginLinkBold}>Sign In</Text>
            </Text>
          </TouchableOpacity>
        </View>

        <View style={{ height: 32 }} />
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  root:             { flex: 1, backgroundColor: '#FFFFFF' },

  topBand:          { paddingBottom: 44 },
  topContent:       { alignItems: 'center', paddingHorizontal: 24, paddingTop: 16, paddingBottom: 10 },
  topEmoji:         { fontSize: 40, marginBottom: 10 },
  topTitle:         { fontSize: 26, fontWeight: '800', color: '#fff', marginBottom: 4 },
  topSub:           { fontSize: 14, color: 'rgba(255,255,255,0.82)' },
  wave:             { height: 32, backgroundColor: '#FFFFFF', borderTopLeftRadius: 32, borderTopRightRadius: 32 },

  scroll:           { paddingHorizontal: 22, paddingTop: 4, paddingBottom: 32 },
  card:             { backgroundColor: '#fff', borderRadius: 24, padding: 24, shadowColor: '#185FA5', shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.08, shadowRadius: 20, elevation: 6, borderWidth: 1, borderColor: '#f1f5f9' },

  googleBtn:        { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', borderWidth: 1.5, borderColor: '#e2e8f0', borderRadius: 14, paddingVertical: 13, gap: 10, backgroundColor: '#fafafa' },
  googleIcon:       { fontSize: 16, fontWeight: '800', color: '#4285F4', width: 22, textAlign: 'center' },
  googleText:       { fontSize: 15, fontWeight: '600', color: '#1a1a2e' },

  dividerRow:       { flexDirection: 'row', alignItems: 'center', marginVertical: 18, gap: 10 },
  dividerLine:      { flex: 1, height: 1, backgroundColor: '#e2e8f0' },
  dividerText:      { color: '#94a3b8', fontSize: 12 },

  roleHeading:      { fontSize: 14, fontWeight: '700', color: '#475569', marginBottom: 12, textTransform: 'uppercase', letterSpacing: 0.5 },
  roleRow:          { flexDirection: 'row', gap: 12, marginBottom: 20 },
  roleCard:         { flex: 1, borderWidth: 2, borderColor: '#e2e8f0', borderRadius: 18, padding: 18, alignItems: 'center', position: 'relative' },
  roleCheck:        { position: 'absolute', top: 10, right: 10, width: 20, height: 20, borderRadius: 10, justifyContent: 'center', alignItems: 'center' },
  roleCheckMark:    { color: '#fff', fontSize: 11, fontWeight: '800' },
  roleCardIcon:     { fontSize: 32, marginBottom: 8 },
  roleCardTitle:    { fontSize: 15, fontWeight: '700', color: '#64748b', marginBottom: 2 },
  roleCardDesc:     { fontSize: 12, color: '#94a3b8' },

  label:            { fontSize: 13, fontWeight: '700', color: '#475569', marginBottom: 8, marginTop: 14, textTransform: 'uppercase', letterSpacing: 0.5 },
  inputWrap:        { flexDirection: 'row', alignItems: 'center', backgroundColor: '#f8fafc', borderRadius: 14, borderWidth: 1.5, borderColor: '#e2e8f0', paddingHorizontal: 14, paddingVertical: 2 },
  inputIcon:        { fontSize: 16, marginRight: 10 },
  input:            { fontSize: 15, color: '#1a1a2e', paddingVertical: 13 },
  eyeBtn:           { padding: 6 },
  eyeIcon:          { fontSize: 16 },

  registerBtn:      { borderRadius: 16, paddingVertical: 16, alignItems: 'center', shadowColor: '#1a5c38', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 10, elevation: 6 },
  registerBtnText:  { color: '#fff', fontSize: 16, fontWeight: '800', letterSpacing: 0.3 },

  loginLink:        { alignItems: 'center', marginTop: 20 },
  loginLinkText:    { color: '#64748b', fontSize: 14 },
  loginLinkBold:    { color: '#185FA5', fontWeight: '700' },
});

export default Register;
