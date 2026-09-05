import React, { useState, useMemo } from 'react';
import {
  PageHeader, Card, Badge, Button, Stat, EmptyState, SkeletonRows,
  SearchInput, Icon, Notice,
} from '../../components/ui';
import { useI18n } from '../../lib/i18n';
import { useAsync } from '../../lib/useAsync';
import { patient as patientApi } from '../../lib/services';
import { formatLongDate, relativeDate } from '../../lib/format';
import { useAuth } from '../../lib/auth';

/**
 * Medical record.
 *
 * Presented as a reverse-chronological timeline rather than a flat card list:
 * a medical history is a sequence, and the shape of the page should say so.
 * The page is print-friendly, because patients are still routinely asked for
 * paper copies at facilities that are not on the platform.
 */
export default function Records() {
  const { t, lang } = useI18n();
  const { user } = useAuth();
  const [query, setQuery] = useState('');

  const { data, loading, error, refetch } = useAsync(() => patientApi.consultations(), []);
  const consultations = data || [];

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return consultations;
    return consultations.filter((c) =>
      [c.diagnosis, c.prescription, c.notes, c.doctor_name, c.specialization]
        .filter(Boolean)
        .some((v) => String(v).toLowerCase().includes(q)),
    );
  }, [consultations, query]);

  const diagnoses = consultations.filter((c) => c.diagnosis).length;
  const prescriptions = consultations.filter((c) => c.prescription).length;
  const completed = consultations.filter((c) => c.status === 'completed').length;

  return (
    <>
      <PageHeader
        title={t('records')}
        description="Every consultation recorded for you on Beral Care, newest first."
        actions={
          <Button icon="print" onClick={() => window.print()} className="no-print">
            Print record
          </Button>
        }
      />

      {/* Identifies the printed copy */}
      <div className="mb-6" style={{ display: 'none' }} data-print-header>
        <strong>{user?.full_name}</strong> · {user?.patient_id}
      </div>

      <div className="grid grid--stats mb-6 no-print">
        <Stat label={t('consultations')} value={loading ? '–' : consultations.length} icon="clipboard" />
        <Stat label={t('diagnoses')} value={loading ? '–' : diagnoses} icon="stethoscope" tone="accent" />
        <Stat label={t('prescriptions')} value={loading ? '–' : prescriptions} icon="pill" tone="success" />
        <Stat label={t('completed')} value={loading ? '–' : completed} icon="checkCircle" tone="success" />
      </div>

      {consultations.length > 4 ? (
        <div className="toolbar no-print">
          <div className="toolbar__search">
            <SearchInput
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search diagnoses, medicines, or clinicians…"
            />
          </div>
          {query ? <span className="muted text-sm">{filtered.length} of {consultations.length}</span> : null}
        </div>
      ) : null}

      {error ? (
        <Notice tone="danger" action={<Button size="sm" onClick={refetch}>{t('retry')}</Button>}>{error}</Notice>
      ) : loading ? (
        <SkeletonRows rows={3} height={120} />
      ) : filtered.length === 0 ? (
        <Card>
          <EmptyState
            icon="records"
            title={query ? 'No matching records' : t('noRecords')}
            description={
              query
                ? 'Try a different search term.'
                : 'After a clinician completes a consultation with you, it will appear here with the diagnosis and prescription.'
            }
            action={query ? <Button onClick={() => setQuery('')}>Clear search</Button> : null}
          />
        </Card>
      ) : (
        <div className="timeline">
          {filtered.map((c) => (
            <article className="timeline__item" key={c.id}>
              <span className={`timeline__dot ${c.status !== 'completed' ? 'timeline__dot--muted' : ''}`} />
              <Card>
                <div className="spread wrap gap-3 mb-4">
                  <div>
                    <div className="strong">{formatLongDate(c.consultation_date, lang)}</div>
                    <div className="muted text-sm">
                      {c.doctor_name}
                      {c.specialization ? ` · ${c.specialization}` : ''}
                      {' · '}{relativeDate(c.consultation_date, lang)}
                    </div>
                  </div>
                  <Badge status={c.status} />
                </div>

                <div className="stack gap-3">
                  {c.diagnosis ? <RecordLine icon="stethoscope" label={t('diagnoses')} value={c.diagnosis} /> : null}
                  {c.prescription ? <RecordLine icon="pill" label="Prescription" value={c.prescription} /> : null}
                  {c.notes ? <RecordLine icon="clipboard" label="Clinical notes" value={c.notes} /> : null}
                  {!c.diagnosis && !c.prescription && !c.notes ? (
                    <p className="muted text-sm">
                      This appointment has not been written up yet.
                    </p>
                  ) : null}
                </div>
              </Card>
            </article>
          ))}
        </div>
      )}
    </>
  );
}

function RecordLine({ icon, label, value }) {
  return (
    <div className="row gap-3" style={{ alignItems: 'flex-start' }}>
      <span className="card__icon" style={{ width: 30, height: 30 }}>
        <Icon name={icon} size={15} />
      </span>
      <div className="grow">
        <div className="text-xs strong muted" style={{ textTransform: 'uppercase', letterSpacing: '0.05em' }}>
          {label}
        </div>
        <p style={{ marginTop: 2 }}>{value}</p>
      </div>
    </div>
  );
}
