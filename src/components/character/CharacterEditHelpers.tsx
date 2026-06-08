import { useRef } from 'react'
import type { KeyboardEvent } from 'react'

// ─── NumericField ─────────────────────────────────────────────────────────────
interface NumericFieldProps {
  id: string
  label: string
  value: number
  onChange: (v: number) => void
  min?: number
  max?: number
}

export function NumericField({ id, label, value, onChange, min = 0, max }: NumericFieldProps) {
  return (
    <div>
      <label className="pangu-label" htmlFor={id}>{label}</label>
      <input
        id={id}
        type="number"
        className="pangu-input"
        value={value}
        min={min}
        max={max}
        onChange={(e) => {
          const n = parseInt(e.target.value, 10)
          if (!isNaN(n)) onChange(n)
        }}
      />
    </div>
  )
}

// ─── TagInput ─────────────────────────────────────────────────────────────────
interface TagInputProps {
  id: string
  label: string
  values: string[]
  onChange: (v: string[]) => void
  placeholder?: string
  presets?: string[]
}

export function TagInput({ id, label, values, onChange, placeholder, presets }: TagInputProps) {
  const inputRef = useRef<HTMLInputElement>(null)

  function addTag(raw: string) {
    const tag = raw.trim()
    if (!tag || values.includes(tag)) return
    onChange([...values, tag])
    if (inputRef.current) inputRef.current.value = ''
  }

  function removeTag(tag: string) {
    onChange(values.filter(v => v !== tag))
  }

  function handleKeyDown(e: KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault()
      addTag((e.currentTarget as HTMLInputElement).value)
    } else if (e.key === 'Backspace' && (e.currentTarget as HTMLInputElement).value === '') {
      onChange(values.slice(0, -1))
    }
  }

  function togglePreset(preset: string) {
    if (values.includes(preset)) {
      removeTag(preset)
    } else {
      onChange([...values, preset])
    }
  }

  return (
    <div>
      <label className="pangu-label" htmlFor={id}>{label}</label>
      {presets && presets.length > 0 && (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 8 }}>
          {presets.map(preset => {
            const active = values.includes(preset)
            return (
              <button
                key={preset}
                type="button"
                onClick={() => togglePreset(preset)}
                style={{
                  fontSize: 11,
                  padding: '3px 9px',
                  borderRadius: 999,
                  border: active ? '1px solid rgb(var(--violet-rgb) / 0.5)' : '1px solid var(--hairline)',
                  background: active ? 'rgb(var(--violet-rgb) / 0.12)' : 'var(--surface)',
                  color: active ? 'var(--violet)' : 'var(--ink-soft)',
                  cursor: 'pointer',
                  transition: 'background var(--t-fast), border-color var(--t-fast), color var(--t-fast)',
                }}
              >
                {active ? '✓ ' : ''}{preset}
              </button>
            )
          })}
        </div>
      )}
      <div
        onClick={() => inputRef.current?.focus()}
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          gap: 6,
          alignItems: 'center',
          minHeight: 42,
          padding: '6px 10px',
          borderRadius: 8,
          border: '1px solid var(--hairline)',
          background: 'var(--surface)',
          cursor: 'text',
        }}
      >
        {values.map(tag => (
          <span
            key={tag}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 5,
              fontSize: 12,
              padding: '2px 8px',
              borderRadius: 999,
              background: 'rgb(var(--violet-rgb) / 0.1)',
              border: '1px solid rgb(var(--violet-rgb) / 0.25)',
              color: 'var(--ink)',
            }}
          >
            {tag}
            <button
              type="button"
              aria-label={`${tag} verwijderen`}
              onClick={(e) => { e.stopPropagation(); removeTag(tag) }}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: 14, height: 14,
                borderRadius: '50%',
                border: 'none',
                background: 'rgb(var(--violet-rgb) / 0.2)',
                color: 'var(--violet)',
                cursor: 'pointer',
                fontSize: 9,
                lineHeight: 1,
                padding: 0,
              }}
            >
              ✕
            </button>
          </span>
        ))}
        <input
          ref={inputRef}
          id={id}
          type="text"
          placeholder={values.length === 0 ? (placeholder ?? 'Typ en druk op Enter...') : ''}
          onKeyDown={handleKeyDown}
          onBlur={(e) => addTag(e.currentTarget.value)}
          style={{
            flex: 1,
            minWidth: 120,
            border: 'none',
            background: 'transparent',
            outline: 'none',
            fontSize: 14,
            color: 'var(--ink)',
          }}
        />
      </div>
      <p style={{ fontSize: 11, color: 'var(--muted)', marginTop: 4 }}>
        Druk op Enter of komma om toe te voegen, Backspace om te verwijderen.
      </p>
    </div>
  )
}
