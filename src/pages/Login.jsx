import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity,
  StyleSheet, ScrollView, Alert, SafeAreaView, Dimensions,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { StatusBar } from 'expo-status-bar';
import { useAuth } from '../context/AuthContext';
import api from '../../client-services/api';

const { width } = Dimensions.get('window');

const ROLE_DASHBOARDS = {
  admin:   'AdminDashboard',
  doctor:  'DoctorDashboard',
  patient: 'PatientDashboard',
};

const Login = ({ navigation }) => {
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert('Missing fields', 'Please enter your email and password');
      return;
    }
    setLoading(true);
    try {
      const res = await api.post('/api/auth/login', { email, password });
      await login(res.data.user, res.data.token);
      navigation.replace(ROLE_DASHBOARDS[res.data.user.role] || 'PatientDashboard');
    } catch (error) {
      Alert.alert('Login Failed', error.response?.data?.error || 'Invalid email or password');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.root}>
      <StatusBar style="light" />

      {/* Top gradient band */}
      <LinearGradient colors={['#1a5c38', '#185FA5']} style={styles.topBand} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}>
        <SafeAreaView>
          <View style={styles.topContent}>
            <Text style={styles.topEmoji}>🩺</Text>
            <Text style={styles.topTitle}>Welcome Back</Text>
            <Text style={styles.topSub}>Sign in to Beral Care</Text>
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
            <Text style={styles.dividerText}>or sign in with email</Text>
            <View style={styles.dividerLine} />
          </View>

          {/* Email */}
          <Text style={styles.label}>Email address</Text>
          <View style={styles.inputWrap}>
            <Text style={styles.inputIcon}>✉️</Text>
            <TextInput
              style={styles.input}
              placeholder="your@email.com"
              placeholderTextColor="#b0bec5"
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
            />
          </View>

          {/* Password */}
          <Text style={styles.label}>Password</Text>
          <View style={styles.inputWrap}>
            <Text style={styles.inputIcon}>🔒</Text>
            <TextInput
              style={[styles.input, { flex: 1 }]}
              placeholder="Your password"
              placeholderTextColor="#b0bec5"
              secureTextEntry={!showPassword}
              value={password}
              onChangeText={setPassword}
            />
            <TouchableOpacity onPress={() => setShowPassword(!showPassword)} style={styles.eyeBtn}>
              <Text style={styles.eyeIcon}>{showPassword ? '🙈' : '👁️'}</Text>
            </TouchableOpacity>
          </View>

          {/* Sign in button */}
          <TouchableOpacity onPress={handleLogin} disabled={loading} style={{ marginTop: 28 }}>
            <LinearGradient
              colors={loading ? ['#94a3b8', '#94a3b8'] : ['#1a5c38', '#185FA5']}
              style={styles.loginBtn}
              start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
            >
              <Text style={styles.loginBtnText}>{loading ? 'Signing in...' : 'Sign In'}</Text>
            </LinearGradient>
          </TouchableOpacity>

          <TouchableOpacity style={styles.registerLink} onPress={() => navigation.navigate('Register')}>
            <Text style={styles.registerLinkText}>
              Don't have an account?{'  '}
              <Text style={styles.registerLinkBold}>Create one</Text>
            </Text>
          </TouchableOpacity>
        </View>

        {/* Bottom decorative dots */}
        <View style={styles.dotsRow}>
          {['#1a5c38', '#185FA5', '#EAF3DE', '#E6F1FB'].map((c, i) => (
            <View key={i} style={[styles.dot, { backgroundColor: c }]} />
          ))}
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  root:           { flex: 1, backgroundColor: '#FFFFFF' },

  topBand:        { paddingBottom: 44 },
  topContent:     { alignItems: 'center', paddingHorizontal: 24, paddingTop: 16, paddingBottom: 10 },
  topEmoji:       { fontSize: 44, marginBottom: 10 },
  topTitle:       { fontSize: 28, fontWeight: '800', color: '#fff', marginBottom: 6 },
  topSub:         { fontSize: 14, color: 'rgba(255,255,255,0.82)' },
  wave:           { height: 32, backgroundColor: '#FFFFFF', borderTopLeftRadius: 32, borderTopRightRadius: 32 },

  scroll:         { paddingHorizontal: 22, paddingTop: 4, paddingBottom: 32 },

  card:           { backgroundColor: '#fff', borderRadius: 24, padding: 24, shadowColor: '#185FA5', shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.08, shadowRadius: 20, elevation: 6, borderWidth: 1, borderColor: '#f1f5f9' },

  googleBtn:      { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', borderWidth: 1.5, borderColor: '#e2e8f0', borderRadius: 14, paddingVertical: 13, gap: 10, backgroundColor: '#fafafa' },
  googleIcon:     { fontSize: 16, fontWeight: '800', color: '#4285F4', width: 22, textAlign: 'center' },
  googleText:     { fontSize: 15, fontWeight: '600', color: '#1a1a2e' },

  dividerRow:     { flexDirection: 'row', alignItems: 'center', marginVertical: 20, gap: 10 },
  dividerLine:    { flex: 1, height: 1, backgroundColor: '#e2e8f0' },
  dividerText:    { color: '#94a3b8', fontSize: 12 },

  label:          { fontSize: 13, fontWeight: '700', color: '#475569', marginBottom: 8, marginTop: 14, textTransform: 'uppercase', letterSpacing: 0.5 },
  inputWrap:      { flexDirection: 'row', alignItems: 'center', backgroundColor: '#f8fafc', borderRadius: 14, borderWidth: 1.5, borderColor: '#e2e8f0', paddingHorizontal: 14, paddingVertical: 2 },
  inputIcon:      { fontSize: 16, marginRight: 10 },
  input:          { flex: 1, fontSize: 15, color: '#1a1a2e', paddingVertical: 13 },
  eyeBtn:         { padding: 6 },
  eyeIcon:        { fontSize: 16 },

  loginBtn:       { borderRadius: 16, paddingVertical: 16, alignItems: 'center', shadowColor: '#1a5c38', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 10, elevation: 6 },
  loginBtnText:   { color: '#fff', fontSize: 16, fontWeight: '800', letterSpacing: 0.4 },

  registerLink:   { alignItems: 'center', marginTop: 20 },
  registerLinkText:{ color: '#64748b', fontSize: 14 },
  registerLinkBold:{ color: '#1a5c38', fontWeight: '700' },

  dotsRow:        { flexDirection: 'row', justifyContent: 'center', gap: 8, marginTop: 28 },
  dot:            { width: 10, height: 10, borderRadius: 5 },
});

export default Login;
