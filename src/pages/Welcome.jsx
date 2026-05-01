import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, SafeAreaView } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { StatusBar } from 'expo-status-bar';
import { useLanguage } from '../context/LanguageContext';

const Welcome = ({ navigation }) => {
  const { language, changeLanguage, t } = useLanguage();

  const toggleLanguage = () => {
    changeLanguage(language === 'en' ? 'fr' : 'en');
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar style="light" />
      <LinearGradient colors={['#1a5c38', '#185FA5']} style={styles.container}>
        {/* Language Switcher */}
        <TouchableOpacity style={styles.langBtn} onPress={toggleLanguage}>
          <Text style={styles.langBtnText}>{language === 'en' ? '🇫🇷 FR' : '🇬🇧 EN'}</Text>
        </TouchableOpacity>

        {/* Content */}
        <View style={styles.content}>
          <View style={styles.iconCircle}>
            <Text style={styles.icon}>🩺</Text>
          </View>
          <Text style={styles.title}>Beral Care</Text>
          <Text style={styles.subtitle}>Africa</Text>
          <View style={styles.tagline}>
            <Text style={styles.taglineText}>
              {language === 'en' ? 'Healthcare Made Simple' : 'Soins de Santé Simplifiés'}
            </Text>
          </View>
        </View>

        {/* Buttons - Properly Spaced */}
        <View style={styles.buttonContainer}>
          <TouchableOpacity 
            style={styles.loginBtn}
            onPress={() => navigation.navigate('Login')}
          >
            <Text style={styles.loginBtnText}>
              {language === 'en' ? 'Login' : 'Se Connecter'}
            </Text>
          </TouchableOpacity>

          <View style={styles.buttonSpacer} />

          <TouchableOpacity 
            style={styles.signupBtn}
            onPress={() => navigation.navigate('Register')}
          >
            <Text style={styles.signupBtnText}>
              {language === 'en' ? 'Sign Up' : "S'inscrire"}
            </Text>
          </TouchableOpacity>

          <Text style={styles.footerText}>
            {language === 'en' 
              ? 'Connect with doctors across Africa' 
              : 'Connectez-vous avec des médecins à travers l\'Afrique'}
          </Text>
        </View>
      </LinearGradient>
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
    justifyContent: 'space-between',
    paddingVertical: 40,
  },
  langBtn: {
    position: 'absolute',
    top: 60,
    right: 24,
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    zIndex: 10,
  },
  langBtnText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 40,
  },
  iconCircle: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: 'rgba(255,255,255,0.15)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
  },
  icon: {
    fontSize: 60,
  },
  title: {
    fontSize: 42,
    fontWeight: '800',
    color: '#fff',
    letterSpacing: -1,
  },
  subtitle: {
    fontSize: 32,
    fontWeight: '300',
    color: 'rgba(255,255,255,0.9)',
    marginTop: -8,
    marginBottom: 32,
  },
  tagline: {
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.2)',
  },
  taglineText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
    letterSpacing: 0.5,
  },
  buttonContainer: {
    paddingHorizontal: 32,
    paddingBottom: 20,
  },
  loginBtn: {
    backgroundColor: '#fff',
    borderRadius: 16,
    paddingVertical: 18,
    alignItems: 'center',
    marginBottom: 0,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  loginBtnText: {
    color: '#1a5c38',
    fontSize: 18,
    fontWeight: '700',
  },
  buttonSpacer: {
    height: 20,
  },
  signupBtn: {
    backgroundColor: 'transparent',
    borderWidth: 2,
    borderColor: '#fff',
    borderRadius: 16,
    paddingVertical: 18,
    alignItems: 'center',
    marginBottom: 0,
  },
  signupBtnText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '700',
  },
  footerText: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 14,
    textAlign: 'center',
    marginTop: 28,
  },
});

export default Welcome;
