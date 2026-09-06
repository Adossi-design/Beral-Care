import React, { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import {
  Button, Card, Dialog, SearchInput, EmptyState, SkeletonRows, Notice, Icon, Avatar,
} from '../components/ui';
import Brand, { BrandMark } from '../components/Brand';
import LanguageToggle from '../components/LanguageToggle';
import { Stars, DoctorRatings } from '../components/Rating';
import { useI18n } from '../lib/i18n';
import { useAsync } from '../lib/useAsync';
import { directory } from '../lib/services';
import { assetUrl } from '../lib/api';

/**
 * The doctors on Beral Care, open to anyone. Someone deciding whether to sign
 * up can read what patients said about a doctor first, which is the whole
 * point of the ratings.
 */
export default function Doctors() {
  const { t } = useI18n();
  const [query, setQuery] = useState('');
  const [open, setOpen] = useState(null);

  const { data, loading, error, refetch } = useAsync(() => directory.doctors(), []);
  const doctors = data || [];

  const list = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return doctors;
    return doctors.filter((d) => [d.full_name, d.specialization, d.hospital]
      .filter(Boolean)
      .some((v) => String(v).toLowerCase().includes(q)));
  }, [doctors, query]);

  return (
    <div className="public">
      <header className="pubnav">
        <Link to="/" className="pubnav__brand">
          <Brand size={32} />
        </Link>
        <nav className="pubnav__links">
          <Link className="pubnav__link" to="/">{t('nav.home')}</Link>
          <Link className="pubnav__link" to="/about">{t('nav.why')}</Link>
          <LanguageToggle />
          <Button to="/login" size="sm">{t('signIn')}</Button>
          <Button to="/register" variant="primary" size="sm">{t('signUp')}</Button>
        </nav>
      </header>

      <main className="section-pad">
        <div className="section-inner">
          <h1 className="section-title">Doctors on Beral Care</h1>
          <p className="section-lede">
            Every doctor here can be rated by the patients they treat, and each rating
            carries the reason behind it. Read them before you decide who to work with.
          </p>

          <div className="toolbar">
            <div className="toolbar__search">
              <SearchInput
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search by name, illness treated, or hospital"
              />
            </div>
            <span className="muted text-sm">{list.length} doctor{list.length === 1 ? '' : 's'}</span>
          </div>

          {error ? (
            <Notice tone="danger" action={<Button size="sm" onClick={refetch}>{t('retry')}</Button>}>{error}</Notice>
          ) : loading ? (
            <SkeletonRows rows={3} height={120} />
          ) : list.length === 0 ? (
            <Card>
              <EmptyState
                icon="search"
                title="No doctors found"
                description="Try another word."
                action={<Button onClick={() => setQuery('')}>Clear</Button>}
              />
            </Card>
          ) : (
            <div className="grid grid--cards">
              {list.map((d) => (
                <Card key={d.id}>
                  <div className="row gap-3 mb-4">
                    <Avatar name={d.full_name} src={assetUrl(d.profile_image_url)} size={44} />
                    <div className="grow">
                      <div className="strong">{d.full_name}</div>
                      <div className="muted text-sm">{d.specialization || 'Doctor'}</div>
                    </div>
                  </div>

                  <div className="row gap-2 mb-4">
                    {Number(d.rating_count) ? (
                      <>
                        <Stars value={Number(d.rating_average)} size={15} />
                        <span className="text-sm strong">{Number(d.rating_average).toFixed(1)}</span>
                        <span className="muted text-xs">
                          from {d.rating_count} patient{Number(d.rating_count) === 1 ? '' : 's'}
                        </span>
                      </>
                    ) : (
                      <span className="muted text-xs">Not rated yet</span>
                    )}
                  </div>

                  {d.hospital ? (
                    <div className="row gap-2 muted text-sm mb-4">
                      <Icon name="hospital" size={15} /> {d.hospital}
                    </div>
                  ) : null}

                  <Button size="sm" iconRight="chevronRight" onClick={() => setOpen(d)}>
                    What patients say
                  </Button>
                </Card>
              ))}
            </div>
          )}
        </div>
      </main>

      <footer className="footer">
        <div className="footer__inner">
          <div className="row gap-3">
            <BrandMark size={30} tone="light" />
            <div>
              <div style={{ color: '#fff', fontWeight: 650 }}>Beral Care</div>
              <div className="text-xs">{t('footer.tagline')}</div>
            </div>
          </div>
          <div className="text-xs">{t('footer.built')}</div>
        </div>
      </footer>

      <Dialog
        open={!!open}
        onClose={() => setOpen(null)}
        title={open?.full_name}
        subtitle={[open?.specialization, open?.hospital].filter(Boolean).join(' · ')}
        width={520}
        footer={
          <>
            <Button onClick={() => setOpen(null)} block>Close</Button>
            <Button to="/register" variant="primary" block>Create a free account</Button>
          </>
        }
      >
        {open ? (
          <div className="stack gap-4">
            <DoctorRatings doctorId={open.id} />
            <p className="muted text-xs">
              Ratings come from patients this doctor has treated. Names are not shown.
            </p>
          </div>
        ) : null}
      </Dialog>
    </div>
  );
}
