import React from 'react';
import {
  Modal, View, Text, TouchableOpacity, StyleSheet,
  Share, Clipboard, Alert,
} from 'react-native';
import QRCode from 'react-native-qrcode-svg';

/**
 * PatientQRModal — shows the patient's QR code for sharing their Patient ID.
 * Props: visible, patientId, patientName, onClose
 */
const PatientQRModal = ({ visible, patientId, patientName, onClose }) => {
  const handleShare = async () => {
    try {
      await Share.share({
        message: `My Beral Care Patient ID: ${patientId}\nShare this with your doctor to grant them access to your records.`,
        title: 'My Patient ID',
      });
    } catch (e) {
      Alert.alert('Error', 'Could not share Patient ID');
    }
  };

  const handleCopy = () => {
    Clipboard.setString(patientId || '');
    Alert.alert('Copied!', `Patient ID ${patientId} copied to clipboard`);
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.sheet}>
          <Text style={styles.title}>Your Patient QR Code</Text>
          <Text style={styles.subtitle}>{patientName}</Text>

          <View style={styles.qrBox}>
            {patientId ? (
              <QRCode
                value={patientId}
                size={200}
                color="#1a1a2e"
                backgroundColor="#fff"
              />
            ) : (
              <Text style={styles.noId}>No Patient ID assigned</Text>
            )}
          </View>

          <View style={styles.idRow}>
            <Text style={styles.idLabel}>Patient ID</Text>
            <Text style={styles.idValue}>{patientId || '—'}</Text>
          </View>

          <Text style={styles.hint}>
            Show this QR code or share your Patient ID with your doctor so they can request access to your records.
          </Text>

          <View style={styles.actions}>
            <TouchableOpacity style={styles.copyBtn} onPress={handleCopy}>
              <Text style={styles.copyBtnText}>📋  Copy ID</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.shareBtn} onPress={handleShare}>
              <Text style={styles.shareBtnText}>📤  Share</Text>
            </TouchableOpacity>
          </View>

          <TouchableOpacity style={styles.closeBtn} onPress={onClose}>
            <Text style={styles.closeBtnText}>Close</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay:      { flex: 1, backgroundColor: 'rgba(0,0,0,0.55)', justifyContent: 'center', alignItems: 'center', padding: 24 },
  sheet:        { backgroundColor: '#fff', borderRadius: 24, padding: 28, width: '100%', alignItems: 'center' },

  title:        { fontSize: 18, fontWeight: '800', color: '#1a1a2e', marginBottom: 4 },
  subtitle:     { fontSize: 14, color: '#64748b', marginBottom: 24 },

  qrBox:        { backgroundColor: '#f8fafc', borderRadius: 20, padding: 20, marginBottom: 20, borderWidth: 1, borderColor: '#e2e8f0' },
  noId:         { color: '#94a3b8', fontSize: 14 },

  idRow:        { flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: '#EAF3DE', borderRadius: 12, paddingHorizontal: 20, paddingVertical: 10, marginBottom: 16 },
  idLabel:      { color: '#64748b', fontSize: 12, textTransform: 'uppercase', letterSpacing: 0.8 },
  idValue:      { fontSize: 18, fontWeight: '800', color: '#1a5c38', letterSpacing: 2 },

  hint:         { fontSize: 12, color: '#94a3b8', textAlign: 'center', lineHeight: 18, marginBottom: 20 },

  actions:      { flexDirection: 'row', gap: 12, width: '100%', marginBottom: 14 },
  copyBtn:      { flex: 1, backgroundColor: '#E6F1FB', borderRadius: 12, paddingVertical: 12, alignItems: 'center' },
  copyBtnText:  { color: '#185FA5', fontWeight: '700', fontSize: 14 },
  shareBtn:     { flex: 1, backgroundColor: '#1a5c38', borderRadius: 12, paddingVertical: 12, alignItems: 'center' },
  shareBtnText: { color: '#fff', fontWeight: '700', fontSize: 14 },

  closeBtn:     { paddingVertical: 8 },
  closeBtnText: { color: '#94a3b8', fontSize: 14 },
});

export default PatientQRModal;
