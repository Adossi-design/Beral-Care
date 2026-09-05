import React, { useId, useState } from 'react';
import Icon from './Icon';

/**
 * Form controls.
 *
 * Real <label for> / <input id> pairs, real <fieldset>/<legend> for groups, and
 * errors wired with aria-describedby + aria-invalid. That is what makes the
 * forms usable with a screen reader and with the keyboard alone.
 */

export function Field({
  label, hint, error, required, icon, type = 'text', textarea, rows = 4,
  value, onChange, id: idProp, children, ...rest
}) {
  const autoId = useId();
  const id = idProp || autoId;
  const msgId = `${id}-msg`;
  const [reveal, setReveal] = useState(false);

  const isPassword = type === 'password';
  const inputType = isPassword && reveal ? 'text' : type;

  return (
    <div className="field">
      {label ? (
        <label className="field__label" htmlFor={id}>
          <span>{label}</span>
          {required ? <span className="field__req">Required</span> : null}
        </label>
      ) : null}

      <div className={`input-wrap ${error ? 'input-wrap--error' : ''} ${textarea ? 'input-wrap--textarea' : ''}`}>
        {icon ? <span className="input-icon"><Icon name={icon} size={17} /></span> : null}

        {children || (textarea ? (
          <textarea
            id={id}
            className="input input--area"
            rows={rows}
            value={value}
            onChange={onChange}
            aria-invalid={!!error}
            aria-describedby={error || hint ? msgId : undefined}
            {...rest}
          />
        ) : (
          <input
            id={id}
            className="input"
            type={inputType}
            value={value}
            onChange={onChange}
            aria-invalid={!!error}
            aria-describedby={error || hint ? msgId : undefined}
            {...rest}
          />
        ))}

        {isPassword ? (
          <button
            type="button"
            className="input-icon"
            onClick={() => setReveal((r) => !r)}
            aria-label={reveal ? 'Hide password' : 'Show password'}
            style={{ background: 'none' }}
          >
            <Icon name={reveal ? 'eyeOff' : 'eye'} size={17} />
          </button>
        ) : null}
      </div>

      {error ? (
        <p className="field__msg field__msg--error" id={msgId} role="alert">
          <Icon name="alert" size={13} /> {error}
        </p>
      ) : hint ? (
        <p className="field__msg" id={msgId}>{hint}</p>
      ) : null}
    </div>
  );
}

export function SelectField({ label, hint, error, required, options, id: idProp, ...rest }) {
  const autoId = useId();
  const id = idProp || autoId;
  return (
    <div className="field">
      {label ? (
        <label className="field__label" htmlFor={id}>
          <span>{label}</span>
          {required ? <span className="field__req">Required</span> : null}
        </label>
      ) : null}
      <select id={id} className="select" aria-invalid={!!error} {...rest}>
        {options.map((o) => {
          const val = typeof o === 'string' ? o : o.value;
          const lab = typeof o === 'string' ? o : o.label;
          return <option key={val} value={val}>{lab}</option>;
        })}
      </select>
      {error ? <p className="field__msg field__msg--error" role="alert">{error}</p>
        : hint ? <p className="field__msg">{hint}</p> : null}
    </div>
  );
}

/** Short option lists as chips — faster to scan and click than a dropdown. */
export function ChipGroup({ label, options, value, onChange, hint }) {
  return (
    <fieldset className="field" style={{ border: 'none', padding: 0, margin: 0 }}>
      {label ? <legend className="field__label" style={{ padding: 0 }}>{label}</legend> : null}
      <div className="chips">
        {options.map((o) => {
          const val = typeof o === 'string' ? o : o.value;
          const lab = typeof o === 'string' ? o : o.label;
          const on = val === value;
          return (
            <button
              key={val}
              type="button"
              className="chip"
              aria-pressed={on}
              onClick={() => onChange(val)}
            >
              {on ? <Icon name="check" size={14} /> : null}
              {lab}
            </button>
          );
        })}
      </div>
      {hint ? <p className="field__msg">{hint}</p> : null}
    </fieldset>
  );
}

export function SearchInput({ value, onChange, placeholder = 'Search…', className = '' }) {
  return (
    <div className={`input-wrap ${className}`}>
      <span className="input-icon"><Icon name="search" size={17} /></span>
      <input
        className="input"
        type="search"
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        aria-label={placeholder}
      />
      {value ? (
        <button type="button" className="input-icon" onClick={() => onChange({ target: { value: '' } })} aria-label="Clear search">
          <Icon name="x" size={15} />
        </button>
      ) : null}
    </div>
  );
}

export function Switch({ checked, onChange, label, description }) {
  return (
    <div className="switch-row">
      <div>
        <div className="strong text-sm">{label}</div>
        {description ? <div className="muted text-xs">{description}</div> : null}
      </div>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        aria-label={label}
        className="switch"
        onClick={() => onChange(!checked)}
      />
    </div>
  );
}
