import React, { useState, useEffect, useRef } from 'react';
import {
  Modal, View, Text, TouchableOpacity, StyleSheet, Alert,
} from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';

const QRScannerModal = ({ visible, onScanned, onClose, mode = 'patient', title = 'Scan QR Code' }) => {
  const [permission, requestPermission] = useCameraPermissions();
  const [scanned, setScanned] = useState(false);

  const getValidationPattern = () => {
    if (mode === 'doctor') return /^DR-\d{4}-\d{5}$/;
    if (mode === 'any') return /^(BC|DR)-\d{4}-\d{5}$/;
    return /^BC-\d{4}-\d{5}$/;
  };

  const getErrorMessage = () => {
    if (mode === 'doctor') return 'This QR code does not contain a valid Beral Care Doctor ID.';
    if (mode === 'any') return 'This QR code does not contain a valid Beral Care ID (Patient or Doctor).';
    return 'This QR code does not contain a valid Beral Care Patient ID.';
  };

  useEffect(() => {
    if (visible) setScanned(false);
  }, [visible]);

  const handleBarCodeScanned = ({ data }) => {
    if (scanned) return;
    setScanned(true);
    const pattern = getValidationPattern();
    if (pattern.test(data)) {
      onScanned(data);
      onClose();
    } else {
      Alert.alert(
        'Invalid QR Code',
        getErrorMessage(),
        [{ text: 'Try Again', onPress: () => setScanned(false) }, { text: 'Cancel', onPress: onClose }]
      );
    }
  };

  const handleRequestPermission = async () => {
    const result = await requestPermission();
    if (!result.granted) {
      Alert.alert('Permission Required', 'Camera access is needed to scan QR codes.');
    }
  };

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>{title}</Text>
          <TouchableOpacity onPress={onClose}>
            <Text style={styles.closeText}>✕ Close</Text>
          </TouchableOpacity>
        </View>

        {!permission ? (
          <View style={styles.center}>
            <Text style={styles.permText}>Checking camera permissions...</Text>
          </View>
        ) : !permission.granted ? (
          <View style={styles.center}>
            <Text style={styles.permText}>Camera access is required to scan QR codes.</Text>
            <TouchableOpacity style={styles.permBtn} onPress={handleRequestPermission}>
              <Text style={styles.permBtnText}>Grant Camera Access</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.cameraContainer}>
            <CameraView
              style={styles.camera}
              facing="back"
              onBarcodeScanned={scanned ? undefined : handleBarCodeScanned}
              barcodeScannerSettings={{ barcodeTypes: ['qr'] }}
            />
            <View style={styles.overlay}>
              <View style={styles.scanFrame} />
              <Text style={styles.scanHint}>
                {scanned ? 'Processing...' : 'Point camera at the patient\'s QR code'}
              </Text>
            </View>
          </View>
        )}
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container:      { flex: 1, backgroundColor: '#0f172a' },

  header:         { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#185FA5', paddingHorizontal: 20, paddingVertical: 16, paddingTop: 52 },
  headerTitle:    { color: '#fff', fontSize: 17, fontWeight: '700' },
  closeText:      { color: 'rgba(255,255,255,0.8)', fontSize: 15 },

  center:         { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 32 },
  permText:       { color: '#94a3b8', fontSize: 15, textAlign: 'center', marginBottom: 20 },
  permBtn:        { backgroundColor: '#185FA5', borderRadius: 12, paddingHorizontal: 24, paddingVertical: 12 },
  permBtnText:    { color: '#fff', fontWeight: '700', fontSize: 15 },

  cameraContainer: { flex: 1, position: 'relative' },
  camera:          { flex: 1 },

  overlay:        { ...StyleSheet.absoluteFillObject, justifyContent: 'center', alignItems: 'center' },
  scanFrame:      { width: 220, height: 220, borderRadius: 16, borderWidth: 3, borderColor: '#185FA5', backgroundColor: 'transparent', marginBottom: 24 },
  scanHint:       { color: '#fff', fontSize: 14, textAlign: 'center', backgroundColor: 'rgba(0,0,0,0.5)', paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20 },
});

export default QRScannerModal;
