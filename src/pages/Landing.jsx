import React from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet,
  SafeAreaView, ScrollView, Dimensions,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { StatusBar } from 'expo-status-bar';

const { width } = Dimensions.get('window');

const FEATURES = [
  { icon: '🩺', title: 'Smart Consultations',  desc: 'Connect with verified doctors instantly' },
  { icon: '📅', title: 'Easy Appointments',    desc: 'Book and manage visits in seconds' },
  { icon: '🪪', title: 'Secure Health ID',     desc: 'Your unique Patient ID protects your data' },
  { icon: '📱', title: 'Works Offline',        desc: 'USSD access even without internet' },
];

const Landing = ({ navigation }) => (
  <View style={styles.root}>
    <StatusBar style="light" />

    {/* Hero gradient header */}
    <LinearGradient colors={['#1a5c38', '#185FA5']} style={styles.hero}>
      <SafeAreaView>
        <View style={styles.heroInner}>
          <View style={styles.logoWrap}>
            <Text style={styles.logoEmoji}>🩺</Text>
          </View>
          <Text style={styles.heroTitle}>Beral Care{'\n'}Africa</Text>
          <Text style={styles.heroSub}>
            Quality healthcare, accessible to everyone — anytime, anywhere across Africa.
          </Text>
        </View>
      </SafeAreaView>

      {/* Wave divider */}
      <View style={styles.wave} />
    </LinearGradient>

    {/* White content area */}
    <ScrollView style={styles.body} contentContainerStyle={styles.bodyContent} showsVerticalScrollIndicator={false}>

      {/* Feature cards */}
      <Text style={styles.sectionHeading}>Everything you need</Text>
      <View style={styles.featuresGrid}>
        {FEATURES.map((f, i) => (
          <View key={i} style={[styles.featureCard, i % 2 === 0 ? styles.featureCardGreen : styles.featureCardBlue]}>
            <Text style={styles.featureIcon}>{f.icon}</Text>
            <Text style={styles.featureTitle}>{f.title}</Text>
            <Text style={styles.featureDesc}>{f.desc}</Text>
          </View>
        ))}
      </View>

      {/* Trust badge */}
      <View style={styles.trustBadge}>
        <Text style={styles.trustText}>🔒  Your data is private and secure</Text>
      </View>

      {/* CTA buttons */}
      <TouchableOpacity onPress={() => navigation.navigate('Register')}>
        <LinearGradient colors={['#1a5c38', '#185FA5']} style={styles.primaryBtn} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}>
          <Text style={styles.primaryBtnText}>Get Started — It's Free</Text>
        </LinearGradient>
      </TouchableOpacity>

      <TouchableOpacity style={styles.secondaryBtn} onPress={() => navigation.navigate('Login')}>
        <Text style={styles.secondaryBtnText}>Already have an account? <Text style={styles.secondaryBtnBold}>Sign In</Text></Text>
      </TouchableOpacity>

      <View style={{ height: 32 }} />
    </ScrollView>
  </View>
);

const styles = StyleSheet.create({
  root:             { flex: 1, backgroundColor: '#FFFFFF' },

  // Hero
  hero:             { paddingBottom: 48 },
  heroInner:        { alignItems: 'center', paddingHorizontal: 28, paddingTop: 20, paddingBottom: 16 },
  logoWrap:         { width: 88, height: 88, borderRadius: 44, backgroundColor: 'rgba(255,255,255,0.18)', justifyContent: 'center', alignItems: 'center', marginBottom: 18, shadowColor: '#000', shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.2, shadowRadius: 12, elevation: 8 },
  logoEmoji:        { fontSize: 44 },
  heroTitle:        { fontSize: 36, fontWeight: '800', color: '#fff', textAlign: 'center', lineHeight: 42, marginBottom: 14 },
  heroSub:          { fontSize: 15, color: 'rgba(255,255,255,0.85)', textAlign: 'center', lineHeight: 23, maxWidth: 300 },
  wave:             { height: 36, backgroundColor: '#FFFFFF', borderTopLeftRadius: 36, borderTopRightRadius: 36, marginTop: -2 },

  // Body
  body:             { flex: 1, backgroundColor: '#FFFFFF' },
  bodyContent:      { paddingHorizontal: 22, paddingTop: 8 },
  sectionHeading:   { fontSize: 20, fontWeight: '700', color: '#1a1a2e', marginBottom: 16, marginTop: 4 },

  // Feature grid
  featuresGrid:     { flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginBottom: 24 },
  featureCard:      { width: (width - 56) / 2, borderRadius: 18, padding: 18 },
  featureCardGreen: { backgroundColor: '#EAF3DE' },
  featureCardBlue:  { backgroundColor: '#E6F1FB' },
  featureIcon:      { fontSize: 28, marginBottom: 10 },
  featureTitle:     { fontSize: 14, fontWeight: '700', color: '#1a1a2e', marginBottom: 4 },
  featureDesc:      { fontSize: 12, color: '#64748b', lineHeight: 17 },

  // Trust
  trustBadge:       { backgroundColor: '#f8fafc', borderRadius: 12, paddingVertical: 12, paddingHorizontal: 16, marginBottom: 24, borderWidth: 1, borderColor: '#e2e8f0', alignItems: 'center' },
  trustText:        { color: '#475569', fontSize: 13, fontWeight: '500' },

  // Buttons
  primaryBtn:       { borderRadius: 16, paddingVertical: 17, alignItems: 'center', marginBottom: 14, shadowColor: '#1a5c38', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.25, shadowRadius: 10, elevation: 6 },
  primaryBtnText:   { color: '#fff', fontSize: 16, fontWeight: '800', letterSpacing: 0.3 },
  secondaryBtn:     { alignItems: 'center', paddingVertical: 10 },
  secondaryBtnText: { color: '#64748b', fontSize: 14 },
  secondaryBtnBold: { color: '#185FA5', fontWeight: '700' },
});

export default Landing;
