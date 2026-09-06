import React, { createContext, useContext, useState, useCallback, useMemo, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import Icon from './Icon';
import { Button, IconButton } from './primitives';

/* ------------------------------------------------------------------ dialog */

// Open dialogs, newest last. A profile can be opened from inside another
// dialog, and only the one on top should answer Escape or a backdrop click.
const openDialogs = [];

// Traps focus, restores it on close, and closes on Escape or a backdrop click
export function Dialog({ open, onClose, title, subtitle, children, footer, width = 520, dismissable = true }) {
  const panelRef = useRef(null);
  const restoreRef = useRef(null);
  const tokenRef = useRef(null);

  // Held in refs so the effect below depends on `open` alone. Callers pass a
  // fresh onClose on every render, and re-running the effect would move focus
  // back to the top of the dialog after every keystroke in a text field.
  const closeRef = useRef(onClose);
  closeRef.current = onClose;
  const dismissRef = useRef(dismissable);
  dismissRef.current = dismissable;

  useEffect(() => {
    if (!open) return undefined;

    const token = {};
    tokenRef.current = token;
    openDialogs.push(token);
    const onTop = () => openDialogs[openDialogs.length - 1] === token;

    restoreRef.current = document.activeElement;
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    const onKey = (e) => {
      if (!onTop()) return;
      if (e.key === 'Escape' && dismissRef.current) { closeRef.current?.(); return; }
      if (e.key !== 'Tab' || !panelRef.current) return;

      // Keep Tab inside the dialog
      const focusables = panelRef.current.querySelectorAll(
        'a[href], button:not([disabled]), textarea, input, select, [tabindex]:not([tabindex="-1"])',
      );
      if (!focusables.length) return;
      const first = focusables[0];
      const last = focusables[focusables.length - 1];
      if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
      else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
    };

    document.addEventListener('keydown', onKey);
    // Move focus into the dialog on open. A field marked data-autofocus wins,
    // otherwise the first thing that can take focus.
    requestAnimationFrame(() => {
      const panel = panelRef.current;
      const target = panel?.querySelector('[data-autofocus]')
        || panel?.querySelector('button, input, textarea, select, a[href]');
      target?.focus();
    });

    return () => {
      const at = openDialogs.indexOf(token);
      if (at >= 0) openDialogs.splice(at, 1);
      document.removeEventListener('keydown', onKey);
      if (!openDialogs.length) document.body.style.overflow = prevOverflow;
      restoreRef.current?.focus?.();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  if (!open) return null;

  return createPortal(
    <div
      className="overlay"
      onMouseDown={(e) => {
        const onTop = openDialogs[openDialogs.length - 1] === tokenRef.current;
        if (onTop && dismissable && e.target === e.currentTarget) onClose?.();
      }}
    >
      <div
        className="dialog"
        style={{ maxWidth: width }}
        role="dialog"
        aria-modal="true"
        aria-label={title}
        ref={panelRef}
      >
        {title ? (
          <div className="dialog__head">
            <div className="grow">
              <h2 style={{ fontSize: 'var(--fs-lg)' }}>{title}</h2>
              {subtitle ? <p className="muted text-sm mt-2">{subtitle}</p> : null}
            </div>
            {dismissable ? <IconButton icon="x" label="Close" onClick={onClose} /> : null}
          </div>
        ) : null}

        <div className="dialog__body">{children}</div>

        {footer ? <div className="dialog__foot">{footer}</div> : null}
      </div>
    </div>,
    document.body,
  );
}

export function ConfirmDialog({
  open, onClose, onConfirm, title, message,
  confirmLabel = 'Confirm', cancelLabel = 'Cancel', tone = 'primary', loading,
}) {
  const icon = tone === 'danger' ? 'alert' : 'info';
  const bg = tone === 'danger' ? 'var(--red-50)' : 'var(--primary-subtle)';
  const fg = tone === 'danger' ? 'var(--red-600)' : 'var(--primary)';

  return (
    <Dialog
      open={open}
      onClose={onClose}
      width={420}
      footer={
        <>
          <Button onClick={onClose} block>{cancelLabel}</Button>
          <Button variant={tone === 'danger' ? 'danger' : 'primary'} onClick={onConfirm} loading={loading} block data-autofocus>
            {confirmLabel}
          </Button>
        </>
      }
    >
      <div className="stack center gap-3" style={{ textAlign: 'center', paddingTop: 'var(--sp-5)' }}>
        <span
          style={{
            width: 52, height: 52, borderRadius: '50%', background: bg, color: fg,
            display: 'grid', placeItems: 'center',
          }}
        >
          <Icon name={icon} size={24} />
        </span>
        <h2 style={{ fontSize: 'var(--fs-lg)' }}>{title}</h2>
        {message ? <p className="muted text-sm" style={{ maxWidth: '34ch' }}>{message}</p> : null}
      </div>
    </Dialog>
  );
}

/* ------------------------------------------------------------------- toast */

const ToastContext = createContext({ success: () => {}, error: () => {}, info: () => {}, warning: () => {} });
export const useToast = () => useContext(ToastContext);

let seq = 1;

export function ToastProvider({ children }) {
  const [items, setItems] = useState([]);

  const dismiss = useCallback((id) => setItems((l) => l.filter((t) => t.id !== id)), []);

  const push = useCallback((message, tone, opts = {}) => {
    const id = seq++;
    setItems((l) => [...l, { id, message, tone, title: opts.title }]);
    window.setTimeout(() => dismiss(id), opts.duration ?? (tone === 'error' ? 6000 : 4000));
  }, [dismiss]);

  const api = useMemo(() => ({
    success: (m, o) => push(m, 'success', o),
    error:   (m, o) => push(m, 'error', o),
    warning: (m, o) => push(m, 'warning', o),
    info:    (m, o) => push(m, 'info', o),
  }), [push]);

  const icons = { success: 'checkCircle', error: 'alert', warning: 'alert', info: 'info' };

  return (
    <ToastContext.Provider value={api}>
      {children}
      {createPortal(
        <div className="toasts" role="region" aria-label="Notifications">
          {items.map((t) => (
            <div key={t.id} className={`toast toast--${t.tone}`} role="status" aria-live="polite">
              <span className="toast__icon"><Icon name={icons[t.tone]} size={17} /></span>
              <div className="grow">
                {t.title ? <div className="toast__title">{t.title}</div> : null}
                <div className="toast__msg">{t.message}</div>
              </div>
              <IconButton icon="x" label="Dismiss" size={15} onClick={() => dismiss(t.id)} />
            </div>
          ))}
        </div>,
        document.body,
      )}
    </ToastContext.Provider>
  );
}
