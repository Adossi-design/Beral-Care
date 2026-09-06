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

  const askToConnect = async () => {
    setBusy(true);
    try {
      await clinicApi.askConnect(scanned.patient.patient_id, reason.trim() || null);
      setScanned((s) => ({ ...s, state: 'waiting' }));
      setReason('');
      toast.success(`Your request was sent to ${scanned.patient.full_name}.`);
    } catch (err) {
      toast.error(errorMessage(err));
    } finally {
      setBusy(false);
    }
  };

  const askForRecords = async () => {
    setBusy(true);
    try {
      await clinicApi.askRecords(scanned.patient.patient_id, reason.trim() || null);
      setScanned((s) => ({ ...s, records_status: 'pending' }));
      setReason('');
      toast.success('Your request was sent. You will see the records once they agree.');
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
  const records = scanned?.records_status;
  const person = scanned?.patient;

  return (
    <Dialog
      open={open}
      onClose={close}
      title={loading ? 'Reading the code' : 'Patient code'}
      subtitle={
        loading ? undefined
          : state === 'connected' ? 'You are connected with this person.'
            : 'Check this is the right person, then ask to connect with them.'
      }
      width={460}
      footer={
        loading ? null : (
          <>
            <Button onClick={close} block>Close</Button>
            {state === 'connected' ? (
              <Button variant="primary" iconRight="chevronRight" onClick={openFile} block>
                Open their page
              </Button>
            ) : state === 'none' || state === 'refused' ? (
              <Button variant="primary" icon="send" onClick={askToConnect} loading={busy} block>
                Ask to connect
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
              {state === 'connected' ? <Badge tone="accepted">Connected</Badge> : null}
              {state === 'waiting' ? <Badge tone="pending">Waiting for their answer</Badge> : null}
              {state === 'connected' && records === 'granted' ? (
                <Badge tone="brand">You can see their records</Badge>
              ) : null}
              {state === 'connected' && records === 'pending' ? (
                <Badge tone="pending">Records request waiting</Badge>
              ) : null}
            </div>
          ) : null}

          {state === 'none' ? (
            <>
              <Notice tone="info">
                Connecting lets the two of you work together and see each other's profile.
                It does not open any health record.
              </Notice>
              <Field
                label="Why do you want to connect?"
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
              home page. As soon as they say yes, you are connected and they appear in your
              patient list.
            </Notice>
          ) : null}

          {state === 'their_request' ? (
            <Notice tone="warning" title="They already asked you">
              This person asked to connect with you
              {scanned?.request?.created_at ? ` ${relativeDate(scanned.request.created_at, lang)}` : ''}.
              Answer them on the Requests page.
            </Notice>
          ) : null}

          {/* Second step: the health records, asked for once connected */}
          {state === 'connected' && (records === 'none' || records === 'refused') ? (
            <>
              <Notice tone="info" title="Their health records are separate">
                Being connected shows you who they are. To read their past visits, medicines
                and diagnoses, ask them for that as well.
              </Notice>
              <Field
                label="Why do you need their health records?"
                textarea
                rows={3}
                placeholder="For example: to check what medicine they were given last time."
                hint="You can leave this empty."
                value={reason}
                onChange={(e) => setReason(e.target.value)}
              />
              <Button variant="primary" icon="records" onClick={askForRecords} loading={busy} block>
                Ask to see their health records
              </Button>
            </>
          ) : null}

          {state === 'connected' && records === 'pending' ? (
            <Notice tone="info">
              You asked to see their health records. They will answer on their home page.
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
              A code alone never opens a health record. Only the patient can allow you.
            </p>
          ) : null}
        </div>
      )}
    </Dialog>
  );
}
