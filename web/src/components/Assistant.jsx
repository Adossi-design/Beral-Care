import React, { useState, useRef, useEffect } from 'react';
import { Icon, IconButton, Notice } from './ui';
import Markdown from '../lib/markdown';
import { assistant } from '../lib/services';
import { errorMessage } from '../lib/api';

// Docked panel on desktop, full sheet on phones. Posts to /api/ai/{audience};
// the server decides which model answers.
export default function Assistant({ audience, name, patientId, greeting, prompts, disclaimer }) {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState([]);
  const [draft, setDraft] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const bodyRef = useRef(null);
  const inputRef = useRef(null);

  const title = audience === 'doctor' ? 'MedAssist' : 'HealthGuide';

  useEffect(() => {
    if (open) {
      bodyRef.current?.scrollTo({ top: bodyRef.current.scrollHeight, behavior: 'smooth' });
      inputRef.current?.focus();
    }
  }, [open, messages, busy]);

  useEffect(() => {
    const onKey = (e) => { if (e.key === 'Escape' && open) setOpen(false); };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [open]);

  const send = async (text) => {
    const content = (text ?? draft).trim();
    if (!content || busy) return;

    setError('');
    setDraft('');
    const next = [...messages, { role: 'user', content }];
    setMessages(next);
    setBusy(true);

    try {
      const data = await assistant.ask(audience, next, patientId);
      setMessages([...next, { role: 'assistant', content: data.reply }]);
    } catch (err) {
      setError(errorMessage(err, 'The assistant is not available right now. Please try again in a moment.'));
      setMessages(next);
    } finally {
      setBusy(false);
    }
  };

  if (!open) {
    return (
      <button type="button" className="ai-fab no-print" onClick={() => setOpen(true)}>
        <Icon name="sparkle" size={17} />
        {title}
      </button>
    );
  }

  return (
    <div className="ai-panel no-print" role="dialog" aria-label={`${title} assistant`}>
      <header className="ai-panel__head">
        <span
          style={{
            width: 32, height: 32, borderRadius: 'var(--r-md)',
            background: 'rgba(255,255,255,0.14)', display: 'grid', placeItems: 'center',
          }}
        >
          <Icon name="sparkle" size={17} />
        </span>
        <div className="grow">
          <div className="strong">{title}</div>
          <div className="text-xs" style={{ color: 'var(--pine-200)' }}>
            {audience === 'doctor' ? 'Help while you work' : 'Your health helper'}
          </div>
        </div>
        <button
          type="button"
          className="iconbtn"
          style={{ color: '#fff' }}
          onClick={() => setOpen(false)}
          aria-label="Close assistant"
        >
          <Icon name="x" size={19} />
        </button>
      </header>

      <div className="ai-panel__body" ref={bodyRef}>
        {messages.length === 0 ? (
          <>
            <div className="bubble bubble--ai">
              {greeting || `Hello ${name || 'there'}. How can I help?`}
            </div>
            <div className="ai-prompts">
              {(prompts || []).map((p) => (
                <button key={p.label} type="button" className="ai-prompt" onClick={() => send(p.prompt)}>
                  {p.label}
                </button>
              ))}
            </div>
          </>
        ) : (
          messages.map((m, i) => (
            <div key={i} className={`bubble ${m.role === 'user' ? 'bubble--me' : 'bubble--ai'}`}>
              {m.role === 'user'
                ? String(m.content).split('\n').filter(Boolean).map((line, j) => <p key={j}>{line}</p>)
                : <Markdown text={m.content} />}
            </div>
          ))
        )}

        {busy ? (
          <div className="bubble bubble--ai">
            <span className="typing"><span /><span /><span /></span>
          </div>
        ) : null}

        {error ? <Notice tone="danger">{error}</Notice> : null}
      </div>

      <div className="ai-panel__foot">
        <form
          className="input-wrap"
          onSubmit={(e) => { e.preventDefault(); send(); }}
        >
          <input
            ref={inputRef}
            className="input"
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            placeholder={audience === 'doctor' ? 'Ask a medical question' : 'Ask about your health'}
            aria-label="Message"
            disabled={busy}
          />
          <IconButton icon="send" label="Send" type="submit" disabled={!draft.trim() || busy} />
        </form>

        {disclaimer ? (
          <p className="muted text-xs mt-2" style={{ lineHeight: 1.45 }}>{disclaimer}</p>
        ) : null}
      </div>
    </div>
  );
}

export const PATIENT_PROMPTS = [
  { label: 'Explain my illness', prompt: 'Can you explain my most recent diagnosis in simple words?' },
  { label: 'About my medicine', prompt: 'Tell me about my medicine. What does it do, and how do I take it?' },
  { label: 'Side effects', prompt: 'What side effects should I watch out for with my medication?' },
  { label: 'Get ready for my visit', prompt: 'Help me prepare questions to ask my doctor at my next visit.' },
  { label: 'Staying healthy', prompt: 'What healthy habits would help with my condition?' },
];

export const DOCTOR_PROMPTS = [
  { label: 'Possible diagnoses', prompt: 'Help me build a differential diagnosis for this presentation.' },
  { label: 'Drug reactions', prompt: 'Check for interactions between the medicines in this patient record.' },
  { label: 'Treatment steps', prompt: 'What is the current WHO Africa treatment protocol for this condition?' },
  { label: 'Dose guide', prompt: 'Give me the dosing guidance for this medicine, including renal adjustment.' },
  { label: 'Read lab results', prompt: 'Help me interpret these laboratory results.' },
  { label: 'Refer or treat?', prompt: 'Should this patient be referred, or can this be managed at primary level?' },
];
