import React, { useState, useRef, useEffect } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, ScrollView,
  StyleSheet, ActivityIndicator, Modal, KeyboardAvoidingView, Platform,
} from 'react-native';
import api from '@client-services/api';

/**
 * AIChat — reusable AI assistant panel used by both the doctor and patient dashboards.
 *
 * Props:
 *   visible       — whether the modal is open
 *   onClose       — called when the user closes the panel
 *   endpoint      — API path: '/api/ai/doctor' or '/api/ai/patient'
 *   accentColor   — theme color for the header, user bubbles, and send button
 *   title         — assistant name shown in the header (e.g. 'MedAssist')
 *   greeting      — first message shown when the panel opens
 *   quickPrompts  — array of { label, prompt } shown before the first reply
 *   patientId     — optional DB user id; injects patient context for the doctor AI
 *   disclaimer    — fine-print text at the bottom of the panel
 */
const AIChat = ({
  visible,
  onClose,
  endpoint,
  accentColor = '#1a5c38',
  title = 'AI Assistant',
  greeting = 'How can I help you today?',
  quickPrompts = [],
  patientId,
  disclaimer = 'For guidance only. Always apply your own judgment.',
}) => {
  const [messages, setMessages]   = useState([]);
  const [input, setInput]         = useState('');
  const [loading, setLoading]     = useState(false);
  const scrollRef                 = useRef(null);

  // Reset and show greeting each time the panel opens
  useEffect(() => {
    if (visible) {
      setMessages([{ role: 'assistant', content: greeting, isGreeting: true }]);
      setInput('');
    }
  }, [visible]);

  useEffect(() => {
    setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 80);
  }, [messages, loading]);

  const send = async (overrideText) => {
    const text = (overrideText ?? input).trim();
    if (!text || loading) return;

    // Build the conversation excluding the greeting stub
    const history = messages.filter(m => !m.isGreeting);
    const updated = [...history, { role: 'user', content: text }];

    setMessages(prev => [...prev, { role: 'user', content: text }]);
    setInput('');
    setLoading(true);

    try {
      const body = { messages: updated };
      if (patientId) body.patient_id = patientId;

      const res = await api.post(endpoint, body);
      setMessages(prev => [...prev, { role: 'assistant', content: res.data.reply }]);
    } catch (err) {
      const msg = err.response?.data?.error || 'Something went wrong. Please try again.';
      setMessages(prev => [...prev, { role: 'assistant', content: msg, isError: true }]);
    } finally {
      setLoading(false);
    }
  };

  const reset = () => {
    setMessages([{ role: 'assistant', content: greeting, isGreeting: true }]);
    setInput('');
  };

  const showQuickPrompts = messages.length <= 1 && quickPrompts.length > 0;

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.container}
      >
        {/* Header */}
        <View style={[styles.header, { backgroundColor: accentColor }]}>
          <View style={styles.headerLeft}>
            <View style={styles.headerIcon}>
              <Text style={styles.headerIconText}>✦</Text>
            </View>
            <View>
              <Text style={styles.headerTitle}>{title}</Text>
              <Text style={styles.headerSub}>AI Medical Assistant</Text>
            </View>
          </View>
          <View style={styles.headerBtns}>
            <TouchableOpacity onPress={reset} style={styles.headerBtn}>
              <Text style={styles.headerBtnText}>↺</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={onClose} style={styles.headerBtn}>
              <Text style={styles.headerBtnText}>✕</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Message list */}
        <ScrollView
          ref={scrollRef}
          style={styles.messages}
          contentContainerStyle={styles.messagesContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {messages.map((msg, i) => (
            <View
              key={i}
              style={[styles.row, msg.role === 'user' ? styles.rowUser : styles.rowAI]}
            >
              {msg.role === 'assistant' && (
                <View style={[styles.avatar, { backgroundColor: accentColor }]}>
                  <Text style={styles.avatarText}>✦</Text>
                </View>
              )}
              <View style={[
                styles.bubble,
                msg.role === 'user'
                  ? [styles.bubbleUser, { backgroundColor: accentColor }]
                  : styles.bubbleAI,
                msg.isError && styles.bubbleError,
              ]}>
                <Text style={[styles.bubbleText, msg.role === 'user' && styles.bubbleTextUser]}>
                  {msg.content}
                </Text>
              </View>
            </View>
          ))}

          {loading && (
            <View style={[styles.row, styles.rowAI]}>
              <View style={[styles.avatar, { backgroundColor: accentColor }]}>
                <Text style={styles.avatarText}>✦</Text>
              </View>
              <View style={[styles.bubble, styles.bubbleAI, styles.bubbleTyping]}>
                <ActivityIndicator size="small" color={accentColor} />
                <Text style={[styles.typingText, { color: accentColor }]}>Thinking…</Text>
              </View>
            </View>
          )}
        </ScrollView>

        {/* Quick prompts shown before first reply */}
        {showQuickPrompts && (
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={styles.quickBar}
            contentContainerStyle={styles.quickBarContent}
          >
            {quickPrompts.map((q, i) => (
              <TouchableOpacity
                key={i}
                style={[styles.chip, { borderColor: accentColor }]}
                onPress={() => send(q.prompt)}
              >
                <Text style={[styles.chipText, { color: accentColor }]}>{q.label}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        )}

        {/* Input bar */}
        <View style={styles.inputBar}>
          <TextInput
            style={styles.input}
            placeholder="Type your message…"
            placeholderTextColor="#94a3b8"
            value={input}
            onChangeText={setInput}
            multiline
            maxLength={600}
            returnKeyType="send"
            blurOnSubmit={false}
            onSubmitEditing={() => send()}
          />
          <TouchableOpacity
            style={[
              styles.sendBtn,
              { backgroundColor: accentColor },
              (!input.trim() || loading) && styles.sendBtnOff,
            ]}
            onPress={() => send()}
            disabled={!input.trim() || loading}
          >
            <Text style={styles.sendBtnText}>➤</Text>
          </TouchableOpacity>
        </View>

        <Text style={styles.disclaimer}>{disclaimer}</Text>
      </KeyboardAvoidingView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8fafc' },

  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: Platform.OS === 'ios' ? 52 : 28,
    paddingBottom: 16,
  },
  headerLeft:     { flexDirection: 'row', alignItems: 'center', gap: 12 },
  headerIcon:     { width: 38, height: 38, borderRadius: 19, backgroundColor: 'rgba(255,255,255,0.22)', justifyContent: 'center', alignItems: 'center' },
  headerIconText: { color: '#fff', fontSize: 16, fontWeight: '900' },
  headerTitle:    { color: '#fff', fontSize: 17, fontWeight: '800' },
  headerSub:      { color: 'rgba(255,255,255,0.68)', fontSize: 11, marginTop: 1 },
  headerBtns:     { flexDirection: 'row', gap: 10 },
  headerBtn:      { width: 34, height: 34, borderRadius: 17, backgroundColor: 'rgba(255,255,255,0.18)', justifyContent: 'center', alignItems: 'center' },
  headerBtnText:  { color: '#fff', fontSize: 15, fontWeight: '700' },

  messages:        { flex: 1 },
  messagesContent: { padding: 16, paddingBottom: 8 },

  row:     { flexDirection: 'row', alignItems: 'flex-end', marginBottom: 14, gap: 8 },
  rowUser: { justifyContent: 'flex-end' },
  rowAI:   { justifyContent: 'flex-start' },

  avatar:     { width: 30, height: 30, borderRadius: 15, justifyContent: 'center', alignItems: 'center', marginBottom: 2 },
  avatarText: { color: '#fff', fontSize: 12, fontWeight: '900' },

  bubble:        { maxWidth: '78%', borderRadius: 18, padding: 12 },
  bubbleUser:    { borderBottomRightRadius: 4 },
  bubbleAI:      { backgroundColor: '#fff', borderBottomLeftRadius: 4, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.07, shadowRadius: 4, elevation: 2 },
  bubbleError:   { opacity: 0.75 },
  bubbleTyping:  { flexDirection: 'row', alignItems: 'center', gap: 8, paddingVertical: 14 },
  bubbleText:    { fontSize: 14, color: '#1a1a2e', lineHeight: 21 },
  bubbleTextUser:{ color: '#fff' },
  typingText:    { fontSize: 13, fontWeight: '600' },

  quickBar:        { maxHeight: 54, borderTopWidth: 1, borderTopColor: '#f1f5f9' },
  quickBarContent: { paddingHorizontal: 14, paddingVertical: 10, gap: 8, flexDirection: 'row' },
  chip:            { borderWidth: 1.5, borderRadius: 22, paddingHorizontal: 14, paddingVertical: 7, backgroundColor: '#fff' },
  chipText:        { fontSize: 12, fontWeight: '700' },

  inputBar: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    paddingHorizontal: 14,
    paddingVertical: 12,
    gap: 10,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#f1f5f9',
  },
  input: {
    flex: 1,
    backgroundColor: '#f8fafc',
    borderRadius: 18,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 14,
    color: '#1a1a2e',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    maxHeight: 110,
  },
  sendBtn:    { width: 44, height: 44, borderRadius: 22, justifyContent: 'center', alignItems: 'center' },
  sendBtnOff: { opacity: 0.35 },
  sendBtnText:{ color: '#fff', fontSize: 18 },

  disclaimer: {
    textAlign: 'center',
    fontSize: 11,
    color: '#94a3b8',
    paddingHorizontal: 20,
    paddingBottom: Platform.OS === 'ios' ? 24 : 12,
    paddingTop: 6,
    backgroundColor: '#fff',
  },
});

export default AIChat;
