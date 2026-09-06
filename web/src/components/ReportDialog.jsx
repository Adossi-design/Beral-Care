import React, { useState, useRef } from 'react';
import { Dialog, Button, Field, ChipGroup, Notice, Icon, useToast } from './ui';
import { reports } from '../lib/services';
import { errorMessage } from '../lib/api';

export const REPORT_REASONS = [
  { value: 'inappropriate_behaviour', label: 'Inappropriate behaviour' },
  { value: 'harassment', label: 'Harassment' },
  { value: 'abuse', label: 'Abuse' },
  { value: 'false_information', label: 'False information' },
  { value: 'misuse_of_platform', label: 'Misuse of the platform' },
  { value: 'other', label: 'Something else' },
];

const MAX_FILE = 5 * 1024 * 1024;

// Reporting another account. Kept short on purpose: a reason, what happened,
// and a file only if they have one.
export default function ReportDialog({ open, onClose, person, onSent }) {
  const toast = useToast();
  const fileRef = useRef(null);

  const [reason, setReason] = useState('');
  const [explanation, setExplanation] = useState('');
  const [evidence, setEvidence] = useState(null);
  const [errors, setErrors] = useState({});
  const [busy, setBusy] = useState(false);

  const reset = () => {
    setReason(''); setExplanation(''); setEvidence(null); setErrors({});
  };

  const close = () => { reset(); onClose(); };

  const pickFile = (e) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    if (file.size > MAX_FILE) {
      toast.error('That file is larger than 5 MB. Please choose a smaller one.');
      return;
    }
    setEvidence(file);
  };

  const submit = async () => {
    const next = {};
    if (!reason) next.reason = 'Please choose a reason.';
    if (explanation.trim().length < 20) {
      next.explanation = 'Please describe what happened in a little more detail.';
    }
    setErrors(next);
    if (Object.keys(next).length) return;

    setBusy(true);
    try {
      await reports.submit({
        reportedId: person.id,
        reason,
        explanation: explanation.trim(),
        evidence,
      });
      toast.success('Thank you. An administrator will look at this.');
      reset();
      onSent?.();
      onClose();
    } catch (err) {
      toast.error(errorMessage(err));
    } finally {
      setBusy(false);
    }
  };

  return (
    <Dialog
      open={open}
      onClose={close}
      title={`Report ${person?.name || 'this account'}`}
      subtitle="Tell us what happened. An administrator will read this before anything is decided."
      width={520}
      footer={
        <>
          <Button onClick={close} block>Cancel</Button>
          <Button variant="primary" onClick={submit} loading={busy} block>Send report</Button>
        </>
      }
    >
      <div className="stack gap-5">
        <Notice tone="info">
          Reporting someone does not block them straight away. An administrator reads
          every report first and decides what to do.
        </Notice>

        <ChipGroup
          label="Why are you reporting this account?"
          options={REPORT_REASONS}
          value={reason}
          onChange={(v) => { setReason(v); setErrors((e) => ({ ...e, reason: undefined })); }}
          hint={errors.reason}
        />

        <Field
          label="What happened?"
          textarea
          rows={5}
          required
          placeholder="Describe what happened, and when. The more clearly you explain, the easier it is to look into."
          value={explanation}
          onChange={(e) => {
            setExplanation(e.target.value);
            setErrors((x) => ({ ...x, explanation: undefined }));
          }}
          error={errors.explanation}
        />

        <div className="field">
          <div className="field__label"><span>Evidence (optional)</span></div>

          {evidence ? (
            <div className="row gap-3 evidence-picked">
              <Icon name="clipboard" size={17} />
              <span className="grow truncate text-sm">{evidence.name}</span>
              <Button size="sm" variant="ghost" icon="x" onClick={() => setEvidence(null)} aria-label="Remove file" />
            </div>
          ) : (
            <Button icon="plus" onClick={() => fileRef.current?.click()}>
              Add a screenshot or file
            </Button>
          )}

          <input
            ref={fileRef}
            type="file"
            accept="image/*,application/pdf"
            onChange={pickFile}
            style={{ display: 'none' }}
            tabIndex={-1}
            aria-hidden="true"
          />
          <p className="field__msg">
            A picture or PDF, up to 5 MB. Only administrators can open it. You can send a
            report without one.
          </p>
        </div>
      </div>
    </Dialog>
  );
}
