import React, { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Dialog, Button, Badge, Notice, Field, Skeleton, Icon, useToast } from './ui';
import { QrScannerDialog } from './QrCode';
import PersonAvatar from './PersonCard';
import { clinic as clinicApi } from '../lib/services';
import { assetUrl, errorMessage } from '../lib/api';
import { relativeDate } from '../lib/format';
import { useI18n } from '../lib/i18n';

const ID_PATTERN = /BC-\d{4}-\d+/i;

/**
 * Scanning a patient code from start to finish: read the code, show who the
 * code belongs to, and ask that person for permission. A doctor sees a name
 * and a picture so they know they have the right person in front of them.
 * Nothing else opens until the patient says yes in their own account.
 */
export default function PatientScan({ open, onClose, onConnected }) {
  const { lang } = useI18n();
  const navigate = useNavigate();
  const toast = useToast();

  const [scanned, setScanned] = useState(null);   // { patient, state, request }
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [reason, setReason] = useState('');
  const [busy, setBusy] = useState(false);

  const close = () => {
    setScanned(null); setError(null); setReason(''); onClose();
  };

  const lookUp = useCallback(async (value) => {
    const match = String(value).match(ID_PATTERN);
    const id = (match ? match[0] : String(value)).toUpperCase();

    setLoading(true);
    setError(null);
    try {
      setScanned(await clinicApi.scan(id));
    } catch (err) {
      setError(errorMessage(err));
      setScanned({ patient: { patient_id: id }, state: 'unknown' });
    } finally {
      setLoading(false);
    }
  }, []);

  const ask = async () => {
    setBusy(true);
    try {
      await clinicApi.askAccess(scanned.patient.patient_id, reason.trim() || null);
      setScanned((s) => ({ ...s, state: 'waiting' }));
      setReason('');
      toast.success(`Your request was sent to ${scanned.patient.full_name}.`);
    } catch (err) {
      toast.error(errorMessage(err));
    } finally {
      setBusy(false);
    }
  };

  const openFile = () => {
    const id = scanned.patient.patient_id;
    close();
    onConnected?.();
    navigate(`/clinic/patients/${encodeURIComponent(id)}`);
  };

  // Step one: the camera
  if (open && !scanned && !loading) {
    return (
      <QrScannerDialog
        open
        onClose={close}
        onResult={lookUp}
        title="Scan a patient code"
        pattern={ID_PATTERN}
      />
    );
  }

  const state = scanned?.state;
  const person = scanned?.patient;

  return (
    <Dialog
      open={open}
      onClose={close}
      title={loading ? 'Reading the code' : 'Patient code'}
      subtitle={
        loading ? undefined
          : state === 'connected' ? 'This person has allowed you to see their file.'
            : 'Check this is the right person, then ask them for permission.'
      }
      width={460}
      footer={
        loading ? null : (
          <>
            <Button onClick={close} block>Close</Button>
            {state === 'connected' ? (
              <Button variant="primary" iconRight="chevronRight" onClick={openFile} block>
                Open the file
              </Button>
            ) : state === 'none' || state === 'refused' ? (
              <Button variant="primary" icon="send" onClick={ask} loading={busy} block>
                Ask for permission
              </Button>
            ) : null}
          </>
        )
      }
    >
      {loading ? (
        <div className="stack center gap-3">
          <Skeleton height={72} width={72} radius="50%" />
          <Skeleton height={18} width={180} />
        </div>
      ) : (
        <div className="stack gap-5">
          {error ? <Notice tone="danger">{error}</Notice> : null}

          {person?.full_name ? (
            <div className="stack center gap-3" style={{ textAlign: 'center' }}>
              <PersonAvatar
                id={person.id}
                name={person.full_name}
                src={assetUrl(person.profile_image_url)}
                size={76}
              />
              <div>
                <div className="strong" style={{ fontSize: 'var(--fs-md)' }}>{person.full_name}</div>
                <div className="mono muted text-sm mt-1">{person.patient_id}</div>
              </div>
              {state === 'connected' ? <Badge tone="accepted">You can see this file</Badge> : null}
              {state === 'waiting' ? <Badge tone="pending">Waiting for their answer</Badge> : null}
            </div>
          ) : null}

          {state === 'none' ? (
            <>
              <Notice tone="info">
                You can see the name and the picture so you know you have the right person.
                Their records stay closed until they allow you.
              </Notice>
              <Field
                label="Why do you need to see this file?"
                textarea
                rows={3}
                placeholder="For example: they came to the clinic today with chest pain."
                hint="This is shown to the patient with your request. You can leave it empty."
                value={reason}
                onChange={(e) => setReason(e.target.value)}
              />
            </>
          ) : null}

          {state === 'waiting' ? (
            <Notice tone="info" title="Nothing more to do for now">
              {person?.full_name?.split(' ')[0] || 'This person'} sees your request on their
              home page. As soon as they say yes, this file opens for you and they appear in
              your patient list.
            </Notice>
          ) : null}

          {state === 'their_request' ? (
            <Notice tone="warning" title="They already asked you">
              This person asked you to be their doctor
              {scanned?.request?.created_at ? ` ${relativeDate(scanned.request.created_at, lang)}` : ''}.
              Answer them on the Requests page and their file opens for you.
            </Notice>
          ) : null}

          {state === 'refused' ? (
            <>
              <Notice tone="warning">
                This person said no the last time. You can ask again if they are with you now
                and agree to it.
              </Notice>
              <Field
                label="Why are you asking again?"
                textarea
                rows={3}
                value={reason}
                onChange={(e) => setReason(e.target.value)}
              />
            </>
          ) : null}

          {state === 'unknown' ? (
            <Button icon="scan" onClick={() => { setScanned(null); setError(null); }} block>
              Scan again
            </Button>
          ) : null}

          {state && state !== 'unknown' ? (
            <p className="muted text-xs row gap-2">
              <Icon name="lock" size={14} />
              A code alone never opens a file. Only the patient can allow you.
            </p>
          ) : null}
        </div>
      )}
    </Dialog>
  );
}
