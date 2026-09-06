import React, { useState, useEffect } from 'react';
import { Dialog, Button, Badge, Avatar, Notice, Skeleton, DetailRow, Icon } from './ui';
import { DoctorRatings } from './Rating';
import { useI18n } from '../lib/i18n';
import { people } from '../lib/services';
import { assetUrl, errorMessage } from '../lib/api';
import { formatDate } from '../lib/format';

// Whole years, so a card can say "32 years" without the doctor working it out
const ageFrom = (dob) => {
  if (!dob) return null;
  const born = new Date(dob);
  if (Number.isNaN(born.getTime())) return null;
  const now = new Date();
  let years = now.getFullYear() - born.getFullYear();
  const month = now.getMonth() - born.getMonth();
  if (month < 0 || (month === 0 && now.getDate() < born.getDate())) years -= 1;
  return years >= 0 && years < 130 ? years : null;
};

/**
 * The profile card behind every picture in the app. It says who someone is,
 * never what is in their records. A patient's details only load for the
 * patient themselves, an administrator, and doctors they have allowed.
 */
export function PersonDialog({ id, open, onClose }) {
  const { lang } = useI18n();
  const [card, setCard] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    let alive = true;
    if (!open || !id) { setCard(null); setError(null); return undefined; }

    people.card(id)
      .then((data) => { if (alive) setCard(data); })
      .catch((err) => { if (alive) setError(errorMessage(err)); });

    return () => { alive = false; };
  }, [id, open]);

  const isDoctor = card?.role === 'doctor';
  const age = ageFrom(card?.date_of_birth);

  return (
    <Dialog open={open} onClose={onClose} title="Profile" width={460}>
      {error ? (
        <Notice tone="danger">{error}</Notice>
      ) : !card ? (
        <div className="stack center gap-3">
          <Skeleton height={72} width={72} radius="50%" />
          <Skeleton height={18} width={180} />
          <Skeleton height={90} />
        </div>
      ) : (
        <div className="stack gap-5">
          <div className="stack center gap-3" style={{ textAlign: 'center' }}>
            <Avatar name={card.full_name} src={assetUrl(card.profile_image_url)} size={76} />
            <div>
              <div className="strong" style={{ fontSize: 'var(--fs-md)' }}>{card.full_name}</div>
              <div className="row gap-2 center mt-2" style={{ justifyContent: 'center' }}>
                <Badge tone={isDoctor ? 'brand' : 'neutral'}>{isDoctor ? 'Doctor' : 'Patient'}</Badge>
                {card.identifier ? <span className="mono muted text-sm">{card.identifier}</span> : null}
                {card.suspended ? <Badge tone="suspended">Blocked</Badge> : null}
              </div>
            </div>
          </div>

          <div>
            {isDoctor ? (
              <>
                <DetailRow label="Treats" value={card.specialization} icon="stethoscope" />
                <DetailRow label="Works at" value={card.hospital} icon="hospital" />
                <DetailRow
                  label="Rating"
                  icon="star"
                  value={
                    card.rating_count
                      ? `${card.rating_average.toFixed(1)} out of 5, from ${card.rating_count} patient${card.rating_count === 1 ? '' : 's'}`
                      : 'Not rated yet'
                  }
                />
              </>
            ) : card.full ? (
              <>
                <DetailRow label="Age" value={age != null ? `${age} years` : null} icon="user" />
                <DetailRow label="Born" value={card.date_of_birth ? formatDate(card.date_of_birth, lang) : null} icon="calendar" />
                <DetailRow label="Gender" value={card.gender} icon="user" />
                <DetailRow label="Lives in" value={card.address} icon="location" />
              </>
            ) : null}

            {card.email || card.phone ? (
              <>
                <DetailRow label="Email" value={card.email} icon="mail" />
                <DetailRow label="Phone" value={card.phone} icon="phone" />
              </>
            ) : null}

            {card.member_since ? (
              <DetailRow label="On Beral Care since" value={formatDate(card.member_since, lang)} icon="clock" />
            ) : null}
          </div>

          {/* What patients said, so anyone can judge a doctor before choosing them */}
          {isDoctor ? (
            <div>
              <h3 className="card__title mb-3">What patients say</h3>
              <DoctorRatings doctorId={card.id} />
            </div>
          ) : null}

          {!card.full && !isDoctor ? (
            <Notice tone="info">
              The rest of this profile is private. Ask this person to allow you, and their
              details open here once they say yes.
            </Notice>
          ) : null}

          <p className="muted text-xs row gap-2">
            <Icon name="lock" size={14} />
            This card shows who a person is. Medical records are never part of it.
          </p>
        </div>
      )}
    </Dialog>
  );
}

/**
 * A picture you can click. Used everywhere a person appears, so opening
 * someone's profile always works the same way.
 */
export default function PersonAvatar({ id, name, src, size = 40, square }) {
  const [open, setOpen] = useState(false);

  if (!id) return <Avatar name={name} src={src} size={size} square={square} />;

  return (
    <>
      <button
        type="button"
        className="avatar-btn"
        onClick={(e) => { e.stopPropagation(); setOpen(true); }}
        aria-label={`Open the profile of ${name || 'this person'}`}
        title={`Open the profile of ${name || 'this person'}`}
      >
        <Avatar name={name} src={src} size={size} square={square} />
      </button>

      <PersonDialog id={id} open={open} onClose={() => setOpen(false)} />
    </>
  );
}
