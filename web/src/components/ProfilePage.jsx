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

/**
 * Profile and account settings, shared by patients and clinicians.
 *
 * The identifier card and its QR live here rather than on the dashboard, so the
 * overview can stay focused on what needs action today.
 */
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
    if (!form.full_name.trim()) next.full_name = 'Your name cannot be empty.';
    if (!form.phone.trim()) next.phone = 'A phone number is required for notifications.';
    if (isDoctor && !form.specialization.trim()) next.specialization = 'Enter your specialisation.';
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
      toast.success('Profile updated.');
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
      toast.error('Choose an image file.');
      return;
    }
    if (file.size > MAX_IMAGE_BYTES) {
      toast.error('That image is larger than 5 MB. Choose a smaller one.');
      return;
    }

    setUploading(true);
    try {
      const data = await profileApi.uploadImage(file);
      patchUser({ profile_image_url: data.profile_image_url || data.imageUrl });
      toast.success('Photo updated.');
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
        description="Your details, identifier, and account information."
      />

      <div className="grid grid--main">
        <div className="stack gap-6">
          <Card>
            <CardHeader title="Photo" subtitle="Shown to clinicians and patients you work with." icon="user" />
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
                <span className="muted text-xs">JPG or PNG, up to 5 MB.</span>
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
            <CardHeader title="Personal details" icon="idCard" />
            <form className="stack gap-4" onSubmit={save}>
              <Field
                label={t('fullName')} icon="user" required
                value={form.full_name} onChange={set('full_name')} error={errors.full_name}
              />
              <Field
                label={t('phone')} icon="phone" type="tel" required
                hint="Used for SMS notifications and USSD sign-in."
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
            <CardHeader title="Account" icon="lock" />
            <DetailRow label={t('email')} value={user?.email} icon="mail" />
            <DetailRow
              label="Role"
              value={{ patient: 'Patient', doctor: 'Clinician', admin: 'Administrator' }[user?.role]}
              icon="shield"
            />
            <DetailRow label="Member since" value={formatDate(user?.created_at, lang)} icon="clock" />
            <p className="muted text-xs mt-4">
              Your email address is the identifier you sign in with and cannot be changed here.
            </p>
          </Card>
        </div>

        <div className="stack gap-4">
          <div className="idcard">
            <div className="idcard__label">{isDoctor ? t('clinicianId') : t('healthId')}</div>
            <div className="idcard__value">{identifier || '—'}</div>
            <p className="text-xs mt-2" style={{ color: 'var(--pine-200)', position: 'relative' }}>
              {isDoctor
                ? 'Patients scan this to book with you directly.'
                : 'Show this to any clinician to identify yourself.'}
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
                    toast.error('Could not copy automatically.');
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

          <Notice tone="info" title="Who can see your data">
            {isDoctor
              ? 'You can only read the records of patients who have explicitly approved your access request.'
              : 'No clinician can read your records until you approve their request. You can revoke access at any time from your care team.'}
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
        message="Your initials will be shown instead. You can upload a new photo at any time."
        confirmLabel="Remove photo"
      />
    </>
  );
}
