import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  PageHeader, Card, Button, Avatar, SearchInput, EmptyState,
  SkeletonRows, Notice, Icon,
} from '../../components/ui';
import { QrScannerDialog } from '../../components/QrCode';
import { useI18n } from '../../lib/i18n';
import { useAsync } from '../../lib/useAsync';
import { clinic as clinicApi } from '../../lib/services';
import { formatDate, relativeDate } from '../../lib/format';

// A table on wider screens because it is faster to scan than cards. The same
// markup reflows into stacked rows on phones instead of scrolling sideways.
export default function Patients() {
  const { t, lang } = useI18n();
  const navigate = useNavigate();
  const [query, setQuery] = useState('');
  const [scanning, setScanning] = useState(false);

  const { data, loading, error, refetch } = useAsync(() => clinicApi.patients(), []);
  const patients = data || [];

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return patients;
    return patients.filter((p) =>
      [p.full_name, p.patient_id].filter(Boolean).some((v) => String(v).toLowerCase().includes(q)),
    );
  }, [patients, query]);

  const open = (patientId) => navigate(`/clinic/patients/${encodeURIComponent(patientId)}`);

  return (
    <>
      <PageHeader
        title={t('patients')}
        description="Patients who have allowed you to see their records."
        actions={<Button variant="primary" icon="scan" onClick={() => setScanning(true)}>Scan patient</Button>}
      />

      {patients.length > 0 ? (
        <div className="toolbar">
          <div className="toolbar__search">
            <SearchInput
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search by name or health ID"
            />
          </div>
          <span className="muted text-sm">
            {filtered.length} of {patients.length}
          </span>
        </div>
      ) : null}

      {error ? (
        <Notice tone="danger" action={<Button size="sm" onClick={refetch}>{t('retry')}</Button>}>{error}</Notice>
      ) : loading ? (
        <SkeletonRows rows={4} height={56} />
      ) : filtered.length === 0 ? (
        <Card>
          <EmptyState
            icon="users"
            title={query ? 'No patients found' : 'No patients yet'}
            description={
              query
                ? 'Try another name or health ID.'
                : 'Patients show up here after they allow you to see their records. You can also scan a patient code to open a file.'
            }
            action={
              query
                ? <Button onClick={() => setQuery('')}>Clear</Button>
                : <Button variant="primary" icon="scan" onClick={() => setScanning(true)}>Scan a patient code</Button>
            }
          />
        </Card>
      ) : (
        <div className="table-wrap">
          <div className="table-scroll">
            <table className="table table--responsive">
              <thead>
                <tr>
                  <th>Patient</th>
                  <th>Health ID</th>
                  <th>Last visit</th>
                  <th aria-label="Actions" />
                </tr>
              </thead>
              <tbody>
                {filtered.map((p) => (
                  <tr key={p.id}>
                    <td data-label="Patient">
                      <span className="row gap-3">
                        <Avatar name={p.full_name} size={32} />
                        <span className="strong">{p.full_name}</span>
                      </span>
                    </td>
                    <td data-label="Health ID"><span className="mono">{p.patient_id}</span></td>
                    <td data-label="Last visit">
                      {p.last_consultation ? (
                        <span>
                          {formatDate(p.last_consultation, lang)}
                          <span className="muted"> · {relativeDate(p.last_consultation, lang)}</span>
                        </span>
                      ) : (
                        <span className="muted">No visit yet</span>
                      )}
                    </td>
                    <td data-label="">
                      <span className="table__actions">
                        <Button size="sm" iconRight="chevronRight" onClick={() => open(p.patient_id)}>
                          Open
                        </Button>
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <QrScannerDialog
        open={scanning}
        onClose={() => setScanning(false)}
        onResult={(value) => {
          const match = String(value).match(/BC-\d{4}-\d+/i);
          setScanning(false);
          open(match ? match[0] : value);
        }}
        title="Scan patient code"
        pattern={/BC-\d{4}-\d+/i}
      />
    </>
  );
}
