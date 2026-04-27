import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, SafeAreaView } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useAuth } from '../../context/AuthContext';
import api from '../../../client-services/api';

const AdminLogin = ({ navigation }) => {
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    if (!email || !password) return;
    setLoading(true);
    try {
      const res = await api.post('/api/auth/login', { email, password });
      if (res.data.user.role !== 'admin') {
        Alert.alert('', 'Invalid credentials');
        return;
      }
      await login(res.data.user, res.data.token);
      navigation.replace('AdminDashboard');
    } catch {
      Alert.alert('', 'Invalid credentials');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="dark" />
      <View style={styles.inner}>
        <Text style={styles.title}>System Administration</Text>
        <Text style={styles.subtitle}>Authorized access only</Text>

        <TextInput
          style={styles.input}
          placeholder="Email"
          placeholderTextColor="#aaa"
          value={email}
          onChangeText={setEmail}
          keyboardType="email-address"
          autoCapitalize="none"
        />
        <TextInput
          style={styles.input}
          placeholder="Password"
          placeholderTextColor="#aaa"
          secureTextEntry
          value={password}
          onChangeText={setPassword}
        />

        <TouchableOpacity
          style={[styles.btn, loading && styles.btnDisabled]}
          onPress={handleLogin}
          disabled={loading}
        >
          <Text style={styles.btnText}>{loading ? 'Signing in...' : 'Sign In'}</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container:  { flex: 1, backgroundColor: '#0f172a', justifyContent: 'center' },
  inner:      { paddingHorizontal: 32 },
  title:      { fontSize: 22, fontWeight: 'bold', color: '#f1f5f9', marginBottom: 6, textAlign: 'center' },
  subtitle:   { fontSize: 13, color: '#64748b', textAlign: 'center', marginBottom: 36 },
  input:      { backgroundColor: '#1e293b', borderRadius: 12, padding: 14, fontSize: 15, color: '#f1f5f9', borderWidth: 1, borderColor: '#334155', marginBottom: 14 },
  btn:        { backgroundColor: '#334155', borderRadius: 12, paddingVertical: 15, alignItems: 'center', marginTop: 8 },
  btnDisabled:{ opacity: 0.5 },
  btnText:    { color: '#f1f5f9', fontSize: 15, fontWeight: '600' },
});

export default AdminLogin;
