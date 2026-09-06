import React, { useState, useEffect, useRef } from 'react';
import { Dialog, Button, Field, Notice, Icon, Skeleton, useToast } from './ui';
import { useI18n } from '../lib/i18n';
import { reviews as reviewsApi } from '../lib/services';
import { errorMessage } from '../lib/api';
import { formatDate } from '../lib/format';

const MAX_FILE = 5 * 1024 * 1024;

/** A row of stars. Read only unless onChange is given. */
export function Stars({ value = 0, size = 16, onChange, label }) {
  const rounded = Math.round(value);

  if (!onChange) {
    return (
      <span className="stars" role="img" aria-label={label || `${value} out of 5`}>
        {[1, 2, 3, 4, 5].map((n) => (
          <Icon key={n} name={n <= rounded ? 'starFilled' : 'star'} size={size} />
        ))}
      </span>
    );
  }

  return (
    <span className="stars stars--input">
      {[1, 2, 3, 4, 5].map((n) => (
        <button
          key={n}
          type="button"
          onClick={() => onChange(n)}
          aria-label={`${n} star${n === 1 ? '' : 's'}`}
          aria-pressed={n === value}
          className={n <= value ? 'star-btn star-btn--on' : 'star-btn'}
        >
          <Icon name={n <= value ? 'starFilled' : 'star'} size={size} />
        </button>
      ))}
    </span>
  );
}

const WORDS = {
  1: 'Poor', 2: 'Not good', 3: 'Fair', 4: 'Good', 5: 'Very good',
};

/**
 * What patients said about a doctor. The comments are open to anyone, because
 * the point of a rating is to help someone decide before they commit to a
 * doctor. A file attached to a rating is not shown here: it can hold personal
 * details, so only the person who attached it and an administrator can open it.
 */
export function DoctorRatings({ doctorId, canRate, onRate, reload = 0 }) {
  const { lang } = useI18n();
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    let alive = true;
    if (!doctorId) return undefined;
    setData(null);
    reviewsApi.forDoctor(doctorId)
      .then((d) => { if (alive) setData(d); })
      .catch((e) => { if (alive) setError(errorMessage(e)); });
    return () => { alive = false; };
  }, [doctorId, reload]);

  if (error) return <Notice tone="danger">{error}</Notice>;
  if (!data) return <Skeleton height={64} />;

  return (
    <div className="stack gap-4">
      <div className="spread wrap gap-3">
        <div className="row gap-3">
          <span className="rating-score">{data.average ? data.average.toFixed(1) : '-'}</span>
          <div>
            <Stars value={data.average || 0} size={17} />
            <div className="muted text-xs mt-1">
              {data.count === 0
                ? 'No ratings yet'
                : `${data.count} patient${data.count === 1 ? '' : 's'} rated this doctor`}
            </div>
          </div>
        </div>
        {canRate ? (
          <Button size="sm" icon="star" onClick={onRate}>
            {data.reviews.some((r) => r.mine) ? 'Change my rating' : 'Rate this doctor'}
          </Button>
        ) : null}
      </div>

      {data.reviews.length === 0 ? (
        <p className="muted text-sm">
          When patients rate this doctor, what they wrote appears here.
        </p>
      ) : (
        <div className="stack gap-3">
          {data.reviews.map((r) => (
            <div className="review" key={r.id}>
              <div className="row gap-2 wrap">
                <Stars value={r.rating} size={14} />
                <span className="muted text-xs">{WORDS[r.rating]}</span>
                <span className="muted text-xs">· {formatDate(r.updated_at, lang)}</span>
                {r.mine ? <span className="badge badge--info">Your rating</span> : null}
              </div>
              <p className="text-sm mt-2" style={{ whiteSpace: 'pre-wrap' }}>{r.comment}</p>
              {r.has_evidence ? (
                <div className="row gap-2 muted text-xs mt-2">
                  <Icon name="clipboard" size={13} />
                  You attached a file. Only you and an administrator can open it.
                </div>
              ) : null}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

/** The form a patient uses to rate a doctor. */
export function RatingDialog({ open, onClose, doctor, existing, onSaved }) {
  const toast = useToast();
  const fileRef = useRef(null);

  const [rating, setRating] = useState(existing?.rating || 0);
  const [comment, setComment] = useState(existing?.comment || '');
  const [evidence, setEvidence] = useState(null);
  const [errors, setErrors] = useState({});
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (open) {
      setRating(existing?.rating || 0);
      setComment(existing?.comment || '');
      setEvidence(null);
      setErrors({});
    }
  }, [open, existing]);

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
    if (!rating) next.rating = 'Please choose a rating.';
    if (comment.trim().length < 15) next.comment = 'Please say why you chose that rating.';
    setErrors(next);
    if (Object.keys(next).length) return;

    setBusy(true);
    try {
      await reviewsApi.save({
        doctorId: doctor.id,
        rating,
        comment: comment.trim(),
        evidence,
      });
      toast.success('Thank you. Your rating is now on this doctor’s profile.');
      onSaved?.();
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
      onClose={onClose}
      title={`Rate ${doctor?.full_name || 'this doctor'}`}
      subtitle="Your rating and your reason are shown on their profile, without your name."
      width={520}
      footer={
        <>
          <Button onClick={onClose} block>Cancel</Button>
          <Button variant="primary" onClick={submit} loading={busy} block>
            {existing ? 'Save my rating' : 'Send my rating'}
          </Button>
        </>
      }
    >
      <div className="stack gap-5">
        <div className="field">
          <div className="field__label"><span>How was your experience?</span></div>
          <div className="row gap-3">
            <Stars value={rating} size={30} onChange={(n) => { setRating(n); setErrors((e) => ({ ...e, rating: undefined })); }} />
            {rating ? <span className="muted text-sm">{WORDS[rating]}</span> : null}
          </div>
          {errors.rating ? <p className="field__msg field__msg--error">{errors.rating}</p> : null}
        </div>

        <Field
          label="Why did you choose that?"
          textarea
          rows={4}
          required
          placeholder="For example: she explained my treatment clearly and answered all my questions."
          hint="Other people read this before choosing a doctor, so please be fair and specific."
          value={comment}
          onChange={(e) => { setComment(e.target.value); setErrors((x) => ({ ...x, comment: undefined })); }}
          error={errors.comment}
        />

        <div className="field">
          <div className="field__label"><span>Attach a file (optional)</span></div>
          {evidence ? (
            <div className="row gap-3 evidence-picked">
              <Icon name="clipboard" size={17} />
              <span className="grow truncate text-sm">{evidence.name}</span>
              <Button size="sm" variant="ghost" icon="x" onClick={() => setEvidence(null)} aria-label="Remove file" />
            </div>
          ) : (
            <Button icon="plus" onClick={() => fileRef.current?.click()}>Add a picture or PDF</Button>
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
            Use this when something serious needs proof. The file is not shown on the
            profile. Only you and an administrator can open it, and an administrator can
            act on the account if it is serious.
          </p>
        </div>
      </div>
    </Dialog>
  );
}
