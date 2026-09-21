import { CircleCheck, Circle, TriangleAlert, X } from 'lucide-react'
import { fontSans } from '../lib/theme.js'

// ---- Düğme ----
export function Button({
  children,
  onClick,
  variant = 'primary',
  size = 'md',
  icon: Icon,
  disabled,
  title,
  type = 'button',
  style,
}) {
  const base = {
    display: 'inline-flex',
    alignItems: 'center',
    gap: 6,
    borderRadius: 8,
    fontFamily: fontSans,
    fontWeight: 600,
    cursor: disabled ? 'default' : 'pointer',
    border: '1px solid transparent',
    transition: 'background .15s, transform .05s',
    opacity: disabled ? 0.5 : 1,
  }
  const sizes = {
    sm: { padding: '6px 10px', fontSize: 12.5 },
    md: { padding: '9px 14px', fontSize: 14 },
  }
  const variants = {
    primary: { background: 'var(--navy)', color: '#fff' },
    accent: { background: 'var(--amber)', color: '#2A1D00' },
    ghost: { background: 'transparent', color: 'var(--navy)', border: '1px solid var(--line)' },
    danger: { background: 'transparent', color: 'var(--coral)', border: '1px solid transparent' },
  }
  return (
    <button
      type={type}
      title={title}
      disabled={disabled}
      onClick={onClick}
      className="dt-btn"
      style={{ ...base, ...sizes[size], ...variants[variant], ...style }}
    >
      {Icon && <Icon size={size === 'sm' ? 14 : 16} />}
      {children}
    </button>
  )
}

// ---- Filtre çipi ----
export function Chip({ active, onClick, children }) {
  return (
    <button type="button" onClick={onClick} className={`dt-chip${active ? ' dt-chip-active' : ''}`}>
      {children}
    </button>
  )
}

// ---- Kart ----
export function Card({ children, style }) {
  return (
    <div
      className="dt-card-hover"
      style={{
        background: 'var(--paper-card)',
        border: '1px solid var(--line)',
        borderRadius: 12,
        padding: 18,
        ...style,
      }}
    >
      {children}
    </div>
  )
}

// ---- Bölüm başlığı ----
export function SectionHeader({ icon: Icon, children, right }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        {Icon && <Icon size={18} color="var(--navy)" />}
        <h2
          style={{
            fontFamily: 'Newsreader, serif',
            fontSize: 20,
            fontWeight: 600,
            color: 'var(--ink)',
            margin: 0,
          }}
        >
          {children}
        </h2>
      </div>
      {right}
    </div>
  )
}

// ---- Boş durum ----
export function EmptyState({ text }) {
  return (
    <div
      style={{
        padding: '28px 16px',
        textAlign: 'center',
        color: '#8A94A0',
        fontSize: 13.5,
        border: '1px dashed var(--line)',
        borderRadius: 10,
      }}
    >
      {text}
    </div>
  )
}

// ---- İstatistik kutusu ----
export function StatBox({ label, value, accent }) {
  return (
    <div
      style={{
        background: 'var(--paper)',
        border: '1px solid var(--line)',
        borderRadius: 10,
        padding: '8px 14px',
        minWidth: 100,
      }}
    >
      <div
        style={{
          fontSize: 10.5,
          color: '#8A94A0',
          fontWeight: 700,
          letterSpacing: 0.3,
          textTransform: 'uppercase',
        }}
      >
        {label}
      </div>
      <div
        style={{
          fontFamily: 'Newsreader, serif',
          fontSize: 21,
          fontWeight: 700,
          color: accent ? 'var(--amber)' : 'var(--ink)',
        }}
      >
        {value}
      </div>
    </div>
  )
}

// ---- Modal ----
export function Modal({ title, onClose, children, wide }) {
  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(20,26,34,0.45)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 50,
        padding: 16,
      }}
      onClick={onClose}
    >
      <Card
        style={{ width: '100%', maxWidth: wide ? 560 : 440, maxHeight: '90vh', overflowY: 'auto' }}
      >
        <div onClick={(e) => e.stopPropagation()}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
            <h3 style={{ fontFamily: 'Newsreader, serif', fontSize: 18, fontWeight: 600, margin: 0 }}>
              {title}
            </h3>
            <button
              onClick={onClose}
              aria-label="Kapat"
              style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#8A94A0', padding: 4 }}
            >
              <X size={18} />
            </button>
          </div>
          {children}
        </div>
      </Card>
    </div>
  )
}

// ---- Uygulama içi onay (window.confirm yerine) ----
export function ConfirmDialog({ title, message, confirmLabel = 'Evet, devam et', danger, onConfirm, onCancel }) {
  return (
    <Modal title={title} onClose={onCancel}>
      <p style={{ margin: '0 0 18px', fontSize: 14, lineHeight: 1.5, color: 'var(--ink)' }}>{message}</p>
      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
        <Button variant="ghost" onClick={onCancel}>
          Vazgeç
        </Button>
        <Button
          variant={danger ? 'danger' : 'primary'}
          style={danger ? { border: '1px solid var(--coral)' } : undefined}
          onClick={onConfirm}
        >
          {confirmLabel}
        </Button>
      </div>
    </Modal>
  )
}

// ---- Ödev durum etiketi ----
export function StatusPill({ status }) {
  const meta = HOMEWORK_META[status] || HOMEWORK_META.bekliyor
  return (
    <span
      style={{
        background: meta.bg,
        color: meta.fg,
        fontSize: 11.5,
        fontWeight: 700,
        padding: '3px 9px',
        borderRadius: 999,
        whiteSpace: 'nowrap',
      }}
    >
      {meta.label}
    </span>
  )
}

import { homeworkStatusMeta as HOMEWORK_META } from '../lib/theme.js'

// ---- Onay işareti / boş daire ----
export function CheckToggle({ checked, size = 16 }) {
  return checked ? (
    <CircleCheck size={size} color="var(--sage)" />
  ) : (
    <Circle size={size} color="#B7C1CC" />
  )
}

// ---- Uyarı / bilgi satırı ----
export function Banner({ tone = 'info', icon: Icon = TriangleAlert, children, style }) {
  const tones = {
    info: { bg: '#EAF0F7', fg: 'var(--navy)' },
    warn: { bg: '#FFF7E6', fg: '#8A5A00' },
    danger: { bg: '#FBEAE6', fg: '#B23A22' },
    good: { bg: '#EAF6EE', fg: '#1F7A44' },
  }
  const t = tones[tone]
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'flex-start',
        gap: 8,
        background: t.bg,
        color: t.fg,
        borderRadius: 10,
        padding: '10px 14px',
        fontSize: 13,
        lineHeight: 1.45,
        ...style,
      }}
    >
      <Icon size={16} style={{ flexShrink: 0, marginTop: 1 }} />
      <div>{children}</div>
    </div>
  )
}
