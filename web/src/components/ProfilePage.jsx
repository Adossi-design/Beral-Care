import React, { useState, useRef } from 'react';
import {
  PageHeader, Card, CardHeader, Button, Field, Avatar, DetailRow,
  Notice, useToast, Icon, ConfirmDialog,
} from './ui';
import { QrDialog } from './QrCode';
import { useAuth } from '../lib/auth';
import { useI18n } from '../lib/i18n';
import { profile as profileApi } from '../lib/services';
import { assetUrl, errorMessage } from '../lib/api';
import { formatDate } from '../lib/format';

const MAX_IMAGE_BYTES = 5 * 1024 * 1024;

// Profile and account settings, shared by patients and doctors
export default function ProfilePage({ role }) {
  const { user, patchUser } = useAuth();
  const { t, lang } = useI18n();
  const toast = useToast();
  const fileRef = useRef(null);

  const isDoctor = role === 'doctor';
  const [form, setForm] = useState({
    full_name: user?.full_name || '',
    phone: user?.phone || '',
    specialization: user?.specialization || '',
    hospital: user?.hospital || '',
  });
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [qrOpen, setQrOpen] = useState(false);
  const [confirmRemove, setConfirmRemove] = useState(false);

  const set = (key) => (e) => {
    setForm((f) => ({ ...f, [key]: e.target.value }));
    setErrors((x) => ({ ...x, [key]: undefined }));
  };

  const identifier = isDoctor ? user?.doctor_id : user?.patient_id;
  const avatar = assetUrl(user?.profile_image_url);

  const save = async (e) => {
    e.preventDefault();
    const next = {};
    if (!form.full_name.trim()) next.full_name = 'Please enter your name.';
    if (!form.phone.trim()) next.phone = 'Please enter your phone number.';
    if (isDoctor && !form.specialization.trim()) next.specialization = 'Please say what you treat.';
    setErrors(next);
    if (Object.keys(next).length) return;

    setSaving(true);
    try {
      const payload = {
        full_name: form.full_name.trim(),
        phone: form.phone.trim(),
        ...(isDoctor
          ? { specialization: form.specialization.trim(), hospital: form.hospital.trim() }
          : {}),
      };
      const data = await profileApi.update(payload);
      patchUser(data.user || payload);
      toast.success('Your profile was saved.');
    } catch (err) {
      toast.error(errorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  const pickImage = async (e) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast.error('Please choose a picture file.');
      return;
    }
    if (file.size > MAX_IMAGE_BYTES) {
      toast.error('That picture is too big. Please choose one under 5 MB.');
      return;
    }

    setUploading(true);
    try {
      const data = await profileApi.uploadImage(file);
      // The API answers with image_url, so the photo shows straight away
      patchUser({ profile_image_url: data.image_url || data.profile_image_url });
      toast.success('Your photo was saved.');
    } catch (err) {
      toast.error(errorMessage(err));
    } finally {
      setUploading(false);
    }
  };

  const removeImage = async () => {
    setConfirmRemove(false);
    try {
      await profileApi.removeImage();
      patchUser({ profile_image_url: null });
      toast.success('Photo removed.');
    } catch (err) {
      toast.error(errorMessage(err));
    }
  };

  return (
    <>
      <PageHeader
        title={t('profile')}
        description="Your details, your ID, and your account."
      />

      <div className="grid grid--main">
        <div className="stack gap-6">
          <Card>
            <CardHeader title="Photo" subtitle="People you work with will see this photo." icon="user" />
            <div className="row gap-4 wrap">
              <Avatar name={form.full_name || user?.full_name} src={avatar} size={72} />
              <div className="stack gap-2">
                <div className="row gap-2 wrap">
                  <Button icon="edit" loading={uploading} onClick={() => fileRef.current?.click()}>
                    {avatar ? 'Replace photo' : 'Upload photo'}
                  </Button>
                  {avatar ? (
                    <Button variant="danger-quiet" icon="trash" onClick={() => setConfirmRemove(true)}>
                      Remove
                    </Button>
                  ) : null}
                </div>
                <span className="muted text-xs">A JPG or PNG picture, under 5 MB.</span>
              </div>
              <input
                ref={fileRef}
                type="file"
                accept="image/*"
                onChange={pickImage}
                style={{ display: 'none' }}
                aria-hidden="true"
                tabIndex={-1}
              />
            </div>
          </Card>

          <Card>
            <CardHeader title="Your details" icon="idCard" />
            <form className="stack gap-4" onSubmit={save}>
              <Field
                label={t('fullName')} icon="user" required
                value={form.full_name} onChange={set('full_name')} error={errors.full_name}
              />
              <Field
                label={t('phone')} icon="phone" type="tel" required
                hint="We use this to send you messages, and to log in from a basic phone."
                value={form.phone} onChange={set('phone')} error={errors.phone}
              />

              {isDoctor ? (
                <>
                  <Field
                    label={t('specialization')} icon="stethoscope" required
                    value={form.specialization} onChange={set('specialization')}
                    error={errors.specialization}
                  />
                  <Field
                    label={t('hospital')} icon="hospital"
                    value={form.hospital} onChange={set('hospital')}
                  />
                </>
              ) : null}

              <div className="row gap-2">
                <Button type="submit" variant="primary" loading={saving}>{t('save')}</Button>
              </div>
            </form>
          </Card>

          <Card>
            <CardHeader title="Your account" icon="lock" />
            <DetailRow label={t('email')} value={user?.email} icon="mail" />
            <DetailRow
              label="Role"
              value={{ patient: 'Patient', doctor: 'Doctor', admin: 'Admin' }[user?.role]}
              icon="shield"
            />
            <DetailRow label="Joined" value={formatDate(user?.created_at, lang)} icon="clock" />
            <p className="muted text-xs mt-4">
              You log in with your email address, so it cannot be changed here.
            </p>
          </Card>
        </div>

        <div className="stack gap-4">
          <div className="idcard">
            <div className="idcard__label">{isDoctor ? t('clinicianId') : t('healthId')}</div>
            <div className="idcard__value">{identifier || '-'}</div>
            <p className="text-xs mt-2" style={{ color: 'var(--pine-200)', position: 'relative' }}>
              {isDoctor
                ? 'Patients can scan this to book a visit with you.'
                : 'Show this to your doctor so they can find your file.'}
            </p>
            <div className="idcard__actions">
              <button
                type="button"
                className="idcard__btn"
                onClick={async () => {
                  try {
                    await navigator.clipboard.writeText(identifier || '');
                    toast.success(t('copied'));
                  } catch {
                    toast.error('Copy did not work. Please select the ID and copy it yourself.');
                  }
                }}
              >
                <Icon name="copy" size={15} /> {t('copy')}
              </button>
              <button type="button" className="idcard__btn" onClick={() => setQrOpen(true)}>
                <Icon name="qr" size={15} /> Show code
              </button>
            </div>
          </div>

          <Notice tone="info" title="Who can see your information">
            {isDoctor
              ? 'You can only open records for patients who have said yes to you.'
              : 'No doctor can see your records until you say yes. You can stop sharing at any time from the My doctors page.'}
          </Notice>
        </div>
      </div>

      <QrDialog
        open={qrOpen}
        onClose={() => setQrOpen(false)}
        value={identifier}
        name={user?.full_name}
        label={isDoctor ? t('clinicianId') : t('healthId')}
      />

      <ConfirmDialog
        open={confirmRemove}
        onClose={() => setConfirmRemove(false)}
        onConfirm={removeImage}
        tone="danger"
        title="Remove your photo?"
        message="We will show your initials instead. You can add a new photo at any time."
        confirmLabel="Remove photo"
      />
    </>
  );
}
