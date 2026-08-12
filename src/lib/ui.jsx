import { useState } from 'react'

export function Card({ children, className = '' }) {
  return (
    <div className={`rounded-2xl bg-white/5 ring-1 ring-white/10 backdrop-blur-sm ${className}`}>
      {children}
    </div>
  )
}

export function Button({ children, onClick, variant = 'primary', className = '', disabled, type = 'button' }) {
  const styles = {
    primary: 'bg-azur text-night hover:brightness-110',
    sun: 'bg-sun text-night hover:brightness-110',
    danger: 'bg-coral text-white hover:brightness-110',
    ghost: 'bg-white/8 text-cream hover:bg-white/15 ring-1 ring-white/15',
    live: 'bg-coral text-white',
  }[variant]
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={`inline-flex items-center justify-center gap-2 rounded-xl px-4 py-3
        font-semibold transition active:scale-[.98] disabled:opacity-40
        disabled:pointer-events-none ${styles} ${className}`}
    >
      {children}
    </button>
  )
}

export function Badge({ children, className = '' }) {
  return (
    <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1
      text-xs font-bold uppercase tracking-wide ${className}`}>
      {children}
    </span>
  )
}

export function LiveDot({ label = 'En direct' }) {
  return (
    <Badge className="bg-coral/20 text-coral ring-1 ring-coral/40">
      <span className="h-2 w-2 rounded-full bg-coral animate-livepulse" />
      {label}
    </Badge>
  )
}

export function Lock({ children = 'Secret' }) {
  return (
    <Badge className="bg-white/10 text-cream/70 ring-1 ring-white/15">
      🔒 {children}
    </Badge>
  )
}

export function SectionTitle({ eyebrow, title }) {
  return (
    <div className="mb-4">
      {eyebrow && (
        <div className="mb-1 font-mono text-xs uppercase tracking-[.2em] text-azur">{eyebrow}</div>
      )}
      <h2 className="font-display text-3xl uppercase leading-none tracking-wide">{title}</h2>
    </div>
  )
}

// Dialog de confirmation (pour toute action importante).
export function useConfirm() {
  const [state, setState] = useState(null)
  const confirm = (message) =>
    new Promise((resolve) => setState({ message, resolve }))
  const node = state ? (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 p-4"
         onClick={() => { state.resolve(false); setState(null) }}>
      <div className="w-full max-w-sm rounded-2xl bg-night2 p-5 ring-1 ring-white/15 animate-popin"
           onClick={(e) => e.stopPropagation()}>
        <p className="mb-4 text-cream">{state.message}</p>
        <div className="flex gap-2">
          <Button variant="ghost" className="flex-1"
                  onClick={() => { state.resolve(false); setState(null) }}>Annuler</Button>
          <Button variant="danger" className="flex-1"
                  onClick={() => { state.resolve(true); setState(null) }}>Confirmer</Button>
        </div>
      </div>
    </div>
  ) : null
  return { confirm, node }
}

export function Loader({ label = 'Chargement...' }) {
  return (
    <div className="flex h-64 flex-col items-center justify-center gap-3 text-cream/60">
      <div className="h-8 w-8 animate-spin rounded-full border-2 border-azur border-t-transparent" />
      <span className="font-mono text-sm">{label}</span>
    </div>
  )
}
