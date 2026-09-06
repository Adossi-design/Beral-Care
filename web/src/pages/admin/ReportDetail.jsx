import React, { useState, useEffect, useCallback } from 'react';
import {
  Dialog, Button, Badge, Avatar, Notice, Field, SelectField, Icon,
  Skeleton, useToast,
} from '../../components/ui';
import { useI18n } from '../../lib/i18n';
import { moderation, reports as reportsApi } from '../../lib/services';
import { formatDate } from '../../lib/format';
import { errorMessage } from '../../lib/api';
import { REPORT_REASONS } from '../../components/ReportDialog';

const reasonLabel = (v) => REPORT_REASONS.find((r) => r.value === v)?.label || v;

const STATUS_LABEL = {
  pending: 'Waiting', under_review: 'Being checked',
  resolved: 'Resolved', dismissed: 'Dismissed',
};

const STATUS_TONE = {
  pending: 'pending', under_review: 'info', resolved: 'accepted', dismissed: 'neutral',
};

const ACTION_LABEL = {
  dismissed: 'Report dismissed',
  warning: 'Warning sent',
  temporary_block: 'Blocked for a time',
  permanent_block: 'Blocked permanently',
  deleted: 'Account deleted',
  unblocked: 'Block lifted',
};

// What the confirm button says, so it always names the action being taken
const CONFIRM_LABEL = {
  dismissed: 'Close this report',
  warning: 'Send the warning',
  temporary_block: 'Block for a time',
  permanent_block: 'Block for good',
  deleted: 'Delete this account',
};

const DAY_OPTIONS = [
  { value: '3', label: '3 days' },
  { value: '7', label: '7 days' },
  { value: '14', label: '14 days' },
  { value: '30', label: '30 days' },
  { value: '90', label: '90 days' },
];

function Line({ label, children }) {
  return (
    <div className="report-line">
      <div className="report-line__label">{label}</div>
      <div className="report-line__value">{children}</div>
    </div>
  );
}

// Evidence is only loaded when the administrator asks for it, and it is fetched
// with the token rather than linked, so the file is never a public URL.
function Evidence({ report }) {
  const [state, setState] = useState({ url: null, loading: false, error: null });
  const [shown, setShown] = useState(true);
  const isImage = (report.evidence_mime || '').startsWith('image/');

  useEffect(() => () => { if (state.url) URL.revokeObjectURL(state.url); }, [state.url]);

  const load = async () => {
    setState((s) => ({ ...s, loading: true, error: null }));
    try {
      const blob = await reportsApi.evidence(report.id);
      setState({ url: URL.createObjectURL(blob), loading: false, error: null });
    } catch (err) {
      setState({ url: null, loading: false, error: errorMessage(err) });
    }
  };

  if (!Number(report.has_evidence)) {
    return <span className="muted text-sm">Nothing was attached.</span>;
  }

  return (
    <div className="stack gap-3">
      <div className="row gap-3 evidence-picked">
        <Icon name="clipboard" size={17} />
        <span className="grow truncate text-sm">{report.evidence_name || 'Attached file'}</span>
        {!state.url ? (
          <Button size="sm" icon="eye" loading={state.loading} onClick={load}>Open</Button>
        ) : isImage ? (
          <Button size="sm" icon={shown ? 'eyeOff' : 'eye'} onClick={() => setShown((s) => !s)}>
            {shown ? 'Hide' : 'Show'}
          </Button>
        ) : null}
      </div>

      {state.error ? <Notice tone="danger">{state.error}</Notice> : null}

      {state.url && shown ? (
        isImage ? (
          <div className="evidence-view">
            <img src={state.url} alt={`Evidence for report ${report.id}`} />
          </div>
        ) : (
          <Button icon="external" href={state.url} target="_blank" rel="noreferrer">
            Open the file in a new tab
          </Button>
        )
      ) : null}

      <p className="muted text-xs">
        This file may contain personal information. Only you and the person who sent
        the report can open it.
      </p>
    </div>
  );
}

export default function ReportDetail({ id, onClose, onChanged }) {
  const { lang } = useI18n();
  const toast = useToast();

  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const [action, setAction] = useState('');
  const [message, setMessage] = useState('');
  const [days, setDays] = useState('7');
  const [typedName, setTypedName] = useState('');
  const [busy, setBusy] = useState(false);

  const reset = () => { setAction(''); setMessage(''); setDays('7'); setTypedName(''); };

  const load = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    setError(null);
    try {
      setData(await moderation.detail(id));
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => { reset(); setData(null); load(); }, [id, load]);

  const report = data?.report;
  const history = data?.history || [];
  const others = data?.other_reports || [];
  const accountGone = report && !report.reported_id;

  const markUnderReview = async () => {
    try {
      await moderation.setStatus(id, 'under_review');
      await load();
      onChanged?.();
    } catch (err) {
      toast.error(errorMessage(err));
    }
  };

  const unblock = async () => {
    setBusy(true);
    try {
      await moderation.unblock(id);
      toast.success('The account can log in again.');
      await load();
      onChanged?.();
    } catch (err) {
      toast.error(errorMessage(err));
    } finally {
      setBusy(false);
    }
  };

  const apply = async () => {
    if (action === 'warning' && !message.trim()) {
      toast.error('Please write the message this person will receive.');
      return;
    }
    if (action === 'deleted' && typedName.trim() !== (report.reported_name || '').trim()) {
      toast.error('Type the name exactly as it is written above to confirm.');
      return;
    }

    setBusy(true);
    try {
      await moderation.act(id, {
        action,
        message: message.trim() || undefined,
        days: action === 'temporary_block' ? Number(days) : undefined,
        confirm_delete: action === 'deleted' ? true : undefined,
      });
      toast.success(ACTION_LABEL[action]);
      onChanged?.();
      onClose();
    } catch (err) {
      toast.error(errorMessage(err));
    } finally {
      setBusy(false);
    }
  };

  const ACTIONS = [
    { value: 'dismissed', label: 'Nothing is wrong', icon: 'check' },
    { value: 'warning', label: 'Send a warning', icon: 'mail' },
    { value: 'temporary_block', label: 'Block for a time', icon: 'clock' },
    { value: 'permanent_block', label: 'Block for good', icon: 'lock' },
    { value: 'deleted', label: 'Delete the account', icon: 'trash' },
  ];

  return (
    <Dialog
      open={!!id}
      onClose={onClose}
      title="Report"
      subtitle={
        history.length
          ? 'Read what was sent, and what has already been done about it.'
          : 'Read what was sent before you decide. Nothing has happened to this account yet.'
      }
      width={640}
      footer={
        <>
          <Button onClick={onClose} block>Close</Button>
          {action ? (
            <Button
              variant={action === 'deleted' || action === 'permanent_block' ? 'danger' : 'primary'}
              onClick={apply}
              loading={busy}
              block
            >
              {CONFIRM_LABEL[action]}
            </Button>
          ) : null}
        </>
      }
    >
      {loading && !report ? (
        <div className="stack gap-3">
          <Skeleton height={64} radius="var(--r-lg)" />
          <Skeleton height={120} radius="var(--r-lg)" />
        </div>
      ) : error ? (
        <Notice tone="danger" action={<Button size="sm" onClick={load}>Try again</Button>}>{error}</Notice>
      ) : !report ? null : (
        <div className="stack gap-5">
          <div className="row gap-3 spread wrap">
            <div className="row gap-3">
              <Avatar name={report.reported_name} size={44} />
              <div>
                <div className="strong">{report.reported_name || 'Deleted account'}</div>
                <div className="muted text-sm">
                  {report.reported_role === 'doctor' ? 'Doctor' : 'Patient'}
                  {report.patient_id || report.doctor_id
                    ? ` · ${report.patient_id || report.doctor_id}` : ''}
                </div>
              </div>
            </div>
            <div className="row gap-2">
              {report.suspended ? (
                <Badge tone="suspended">
                  {report.suspended_until
                    ? `Blocked until ${formatDate(report.suspended_until, lang)}`
                    : 'Blocked'}
                </Badge>
              ) : null}
              <Badge tone={STATUS_TONE[report.status]}>{STATUS_LABEL[report.status]}</Badge>
            </div>
          </div>

          {accountGone ? (
            <Notice tone="warning">
              This account no longer exists. The report is kept as a record of what happened.
            </Notice>
          ) : null}

          <div>
            <Line label="Reported by">{report.reporter_name || 'A deleted account'}</Line>
            <Line label="Reason">{reasonLabel(report.reason)}</Line>
            <Line label="Sent">{formatDate(report.created_at, lang, {
              day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit',
            })}</Line>
            <Line label="What happened">
              <p style={{ whiteSpace: 'pre-wrap' }}>{report.explanation}</p>
            </Line>
            <Line label="Evidence"><Evidence report={report} /></Line>
          </div>

          {others.length ? (
            <Notice tone="warning" title={`${others.length} other report${others.length > 1 ? 's' : ''} about this account`}>
              <div className="stack gap-1 mt-2">
                {others.map((o) => (
                  <div key={o.id} className="text-sm">
                    {reasonLabel(o.reason)} · {formatDate(o.created_at, lang)} · {STATUS_LABEL[o.status]}
                  </div>
                ))}
              </div>
            </Notice>
          ) : null}

          {history.length ? (
            <div>
              <h3 className="card__title mb-3">What has been done so far</h3>
              {history.map((h, i) => (
                <Line key={i} label={formatDate(h.created_at, lang)}>
                  <div className="strong text-sm">{ACTION_LABEL[h.action] || h.action}</div>
                  {h.message ? <div className="muted text-sm mt-1">{h.message}</div> : null}
                  <div className="muted text-xs mt-1">by {h.admin_name}</div>
                </Line>
              ))}
            </div>
          ) : null}

          <div className="stack gap-4">
            <div className="spread wrap gap-3">
              <h3 className="card__title">Your decision</h3>
              <div className="row gap-2">
                {report.status === 'pending' ? (
                  <Button size="sm" icon="eye" onClick={markUnderReview}>Mark as being checked</Button>
                ) : null}
                {report.suspended ? (
                  <Button size="sm" icon="check" loading={busy} onClick={unblock}>Lift the block</Button>
                ) : null}
              </div>
            </div>

            <div className="chips">
              {ACTIONS.map((a) => (
                <button
                  key={a.value}
                  type="button"
                  className="chip"
                  aria-pressed={action === a.value}
                  disabled={accountGone}
                  onClick={() => {
                    setAction(action === a.value ? '' : a.value);
                    setMessage('');
                    setTypedName('');
                  }}
                >
                  <Icon name={a.icon} size={14} />
                  {a.label}
                </button>
              ))}
            </div>

            {action === 'dismissed' ? (
              <Notice tone="info">
                The report is closed and nothing happens to the account. The record is kept.
              </Notice>
            ) : null}

            {action === 'warning' || action === 'temporary_block' || action === 'permanent_block' ? (
              <>
                {action === 'temporary_block' ? (
                  <SelectField
                    label="How long?"
                    options={DAY_OPTIONS}
                    value={days}
                    onChange={(e) => setDays(e.target.value)}
                    hint="They can log in again by themselves once this time has passed."
                  />
                ) : null}

                <Field
                  label={action === 'warning' ? 'Your message' : 'Your message (optional)'}
                  textarea
                  rows={4}
                  required={action === 'warning'}
                  placeholder="Write in your own words what the problem is and what you expect. Keep it respectful."
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  hint="This goes straight to their account, so they know why."
                />
              </>
            ) : null}

            {action === 'permanent_block' ? (
              <Notice tone="warning">
                They will not be able to log in again. Their records stay in place.
              </Notice>
            ) : null}

            {action === 'deleted' ? (
              <>
                <Notice tone="danger" title="This cannot be undone">
                  The account and everything in it is removed: visits, requests, and messages.
                  Blocking is usually enough. Only delete when there is a clear reason.
                </Notice>
                <Field
                  label={`Type ${report.reported_name} to confirm`}
                  required
                  placeholder={report.reported_name || ''}
                  value={typedName}
                  onChange={(e) => setTypedName(e.target.value)}
                  hint="This is here so no account is deleted by mistake."
                />
              </>
            ) : null}
          </div>
        </div>
      )}
    </Dialog>
  );
}
