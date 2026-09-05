import React, { useEffect, useRef, useState } from 'react';
import QRCode from 'qrcode';
import jsQR from 'jsqr';
import { Dialog, Button, Notice, Icon, Avatar } from './ui';

// Scanning a code replaces typing a name and date of birth by hand, which is
// where duplicate records and spelling errors usually come from.

// Draws a value as a QR code
export function QrImage({ value, size = 200 }) {
  const canvasRef = useRef(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    if (!value || !canvasRef.current) return;
    QRCode.toCanvas(
      canvasRef.current,
      value,
      { width: size, margin: 1, color: { dark: '#0f2c25', light: '#ffffff' } },
      (err) => setFailed(!!err),
    );
  }, [value, size]);

  if (failed) return <p className="muted text-sm">Could not render the code.</p>;
  return <canvas ref={canvasRef} width={size} height={size} style={{ borderRadius: 'var(--r-md)' }} />;
}

// Shows an ID as a scannable code
export function QrDialog({ open, onClose, value, name, label = 'Health ID', caption }) {
  return (
    <Dialog open={open} onClose={onClose} title={label} width={380}>
      <div className="stack center gap-4" style={{ textAlign: 'center' }}>
        <Avatar name={name} size={48} />
        <div>
          <div className="strong">{name}</div>
          <div className="mono muted text-sm">{value}</div>
        </div>

        <div style={{ padding: 'var(--sp-4)', background: '#fff', border: '1px solid var(--border)', borderRadius: 'var(--r-lg)' }}>
          <QrImage value={value || ''} size={200} />
        </div>

        {caption ? <p className="muted text-sm" style={{ maxWidth: '34ch' }}>{caption}</p> : null}

        <Button icon="print" onClick={() => window.print()} block>Print this code</Button>
      </div>
    </Dialog>
  );
}

// Reads frames from the camera with jsQR. Cameras need HTTPS, so the failure
// is explained on screen and typing the ID by hand is always offered.
export function QrScannerDialog({ open, onClose, onResult, title = 'Scan code', pattern }) {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const rafRef = useRef(null);
  const streamRef = useRef(null);
  const [error, setError] = useState('');
  const [manual, setManual] = useState('');

  useEffect(() => {
    if (!open) return undefined;

    let cancelled = false;
    setError('');

    const stop = () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      streamRef.current?.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    };

    const tick = () => {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      if (!video || !canvas || video.readyState !== video.HAVE_ENOUGH_DATA) {
        rafRef.current = requestAnimationFrame(tick);
        return;
      }

      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const ctx = canvas.getContext('2d', { willReadFrequently: true });
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

      const image = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const found = jsQR(image.data, image.width, image.height, { inversionAttempts: 'dontInvert' });

      if (found?.data && (!pattern || pattern.test(found.data.trim()))) {
        stop();
        onResult(found.data.trim());
        return;
      }
      rafRef.current = requestAnimationFrame(tick);
    };

    navigator.mediaDevices
      ?.getUserMedia({ video: { facingMode: 'environment' } })
      .then((stream) => {
        if (cancelled) { stream.getTracks().forEach((t) => t.stop()); return; }
        streamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.play().catch(() => {});
        }
        rafRef.current = requestAnimationFrame(tick);
      })
      .catch(() => {
        if (!cancelled) {
          setError(
            window.isSecureContext
              ? 'We cannot use your camera. Allow it in your browser, or type the ID below.'
              : 'The camera only works on a secure connection. Please type the ID below instead.',
          );
        }
      });

    return () => { cancelled = true; stop(); };
  }, [open, onResult, pattern]);

  return (
    <Dialog
      open={open}
      onClose={onClose}
      title={title}
      width={440}
      footer={
        <>
          <Button onClick={onClose} block>Cancel</Button>
          <Button
            variant="primary"
            block
            disabled={!manual.trim()}
            onClick={() => onResult(manual.trim().toUpperCase())}
          >
            Open this ID
          </Button>
        </>
      }
    >
      <div className="stack gap-4">
        {error ? <Notice tone="warning">{error}</Notice> : null}

        {!error ? (
          <div
            style={{
              position: 'relative', borderRadius: 'var(--r-lg)', overflow: 'hidden',
              background: 'var(--slate-900)', aspectRatio: '4 / 3',
            }}
          >
            <video
              ref={videoRef}
              playsInline
              muted
              style={{ width: '100%', height: '100%', objectFit: 'cover' }}
            />
            {/* Framing guide */}
            <div
              aria-hidden="true"
              style={{
                position: 'absolute', inset: '18%',
                border: '2px solid rgba(255,255,255,0.85)', borderRadius: 'var(--r-md)',
                boxShadow: '0 0 0 100vmax rgba(15,23,42,0.35)',
              }}
            />
          </div>
        ) : null}

        <canvas ref={canvasRef} style={{ display: 'none' }} />

        <div className="row gap-2 muted text-sm">
          <Icon name="info" size={15} />
          Point the camera at the code, or type the ID below.
        </div>

        <div className="input-wrap">
          <span className="input-icon"><Icon name="idCard" size={17} /></span>
          <input
            className="input mono"
            placeholder="BC-2026-00001"
            value={manual}
            onChange={(e) => setManual(e.target.value)}
            aria-label="Type the ID"
          />
        </div>
      </div>
    </Dialog>
  );
}
