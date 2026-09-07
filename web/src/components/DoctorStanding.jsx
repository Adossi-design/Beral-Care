import React, { useState, useRef, useEffect } from 'react';
import { Card, CardHeader, Button, Badge, Notice, Field, Icon, Skeleton, useToast } from './ui';
import { Stars } from './Rating';
import { useAuth } from '../lib/auth';
import { useI18n } from '../lib/i18n';
import { profile as profileApi, reviews as reviewsApi } from '../lib/services';
import { errorMessage } from '../lib/api';
import { formatDate } from '../lib/format';

/**
 * The doctor's own view of two things they cannot change directly: whether an
 * administrator has checked their licence, and what their patients said about
 * them. A rating can be answered once, so the doctor has a right of reply.
 */
export default function DoctorStanding() {
  const { user, patchUser } = useAuth();
  const { lang } = useI18n();
  const toast = useToast();
  const fileRef = useRef(null);

  const [sending, setSending] = useState(false);
  const [data, setData] = useState(null);
  const [replyTo, setReplyTo] = useState(null);
  const [replyText, setReplyText] = useState('');
  const [busy, setBusy] = useState(false);

  const load = () => {
    if (!user?.id) return;
    reviewsApi.forDoctor(user.id).then(setData).catch(() => setData({ count: 0, reviews: [] }));
  };

  useEffect(load, [user?.id]);

  const sendLicence = async (e) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    setSending(true);
    try {
      await profileApi.sendLicence(file);
      patchUser?.({ verification: 'pending' });
      toast.success('Your licence was sent. An administrator will check it.');
    } catch (err) {
      toast.error(errorMessage(err));
    } finally {
      setSending(false);
    }
  };

  const saveReply = async (id) => {
    if (replyText.trim().length < 5) return;
    setBusy(true);
    try {
      await reviewsApi.reply(id, replyText.trim());
      toast.success('Your answer is now under that rating.');
      setReplyTo(null);
      setReplyText('');
      load();
    } catch (err) {
      toast.error(errorMessage(err));
    } finally {
      setBusy(false);
    }
  };

  const verification = user?.verification || 'verified';

  return (
    <div className="stack gap-4">
      {verification !== 'verified' ? (
        <Notice
          tone={verification === 'refused' ? 'danger' : 'warning'}
          title={verification === 'refused'
            ? 'Your licence was not confirmed'
            : 'Your licence is being checked'}
          action={
            <Button size="sm" icon="plus" loading={sending} onClick={() => fileRef.current?.click()}>
              Send the licence
            </Button>
          }
        >
          {verification === 'refused'
            ? 'Patients cannot find you yet. Check your messages for what was missing, then send the document again.'
            : 'Patients cannot find you in the directory until an administrator confirms your licence. Sending a photo of it makes that quicker.'}
        </Notice>
      ) : null}

      <input
        ref={fileRef}
        type="file"
        accept="image/*,application/pdf"
        onChange={sendLicence}
        style={{ display: 'none' }}
        tabIndex={-1}
        aria-hidden="true"
      />

      <Card>
        <CardHeader
          title="What your patients say"
          subtitle="Ratings are public on your profile. You can answer each one once."
          icon="star"
        />

        {!data ? (
          <Skeleton height={80} />
        ) : data.count === 0 ? (
          <p className="muted text-sm">No patient has rated you yet.</p>
        ) : (
          <div className="stack gap-4">
            <div className="row gap-3">
              <span className="rating-score">{data.average?.toFixed(1)}</span>
              <div>
                <Stars value={data.average || 0} size={17} />
                <div className="muted text-xs mt-1">
                  {data.count} patient{data.count === 1 ? '' : 's'} rated you
                </div>
              </div>
            </div>

            <div className="stack gap-3">
              {data.reviews.map((r) => (
                <div className="review" key={r.id}>
                  <div className="row gap-2 wrap">
                    <Stars value={r.rating} size={14} />
                    <span className="muted text-xs">{formatDate(r.updated_at, lang)}</span>
                  </div>
                  <p className="text-sm mt-2" style={{ whiteSpace: 'pre-wrap' }}>{r.comment}</p>

                  {r.reply ? (
                    <div className="mt-3" style={{ borderLeft: '2px solid var(--primary-border)', paddingLeft: 'var(--sp-3)' }}>
                      <div className="text-xs strong row gap-2">
                        <Icon name="stethoscope" size={13} /> Your answer
                      </div>
                      <p className="text-sm mt-1" style={{ whiteSpace: 'pre-wrap' }}>{r.reply}</p>
                    </div>
                  ) : replyTo === r.id ? (
                    <div className="stack gap-2 mt-3">
                      <Field
                        textarea
                        rows={3}
                        placeholder="Answer calmly and without any detail about their health."
                        value={replyText}
                        onChange={(e) => setReplyText(e.target.value)}
                      />
                      <div className="row gap-2">
                        <Button size="sm" variant="primary" loading={busy} onClick={() => saveReply(r.id)}>
                          Post my answer
                        </Button>
                        <Button size="sm" onClick={() => { setReplyTo(null); setReplyText(''); }}>Cancel</Button>
                      </div>
                    </div>
                  ) : (
                    <Button
                      size="sm" variant="ghost" icon="send" className="mt-2"
                      onClick={() => { setReplyTo(r.id); setReplyText(''); }}
                    >
                      Answer this rating
                    </Button>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </Card>
    </div>
  );
}
