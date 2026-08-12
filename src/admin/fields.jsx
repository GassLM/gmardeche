// Champs de formulaire compacts, mobile-first, cohérents avec le thème.

export function Field({ label, children }) {
  return (
    <label className="block">
      <span className="mb-1 block text-xs font-semibold uppercase tracking-wide text-cream/60">{label}</span>
      {children}
    </label>
  )
}

export function Input(props) {
  return (
    <input
      {...props}
      className={`w-full rounded-xl bg-white/5 px-3 py-2.5 text-cream ring-1 ring-white/15
        outline-none focus:ring-azur ${props.className || ''}`}
    />
  )
}

export function Textarea(props) {
  return (
    <textarea
      {...props}
      className={`w-full rounded-xl bg-white/5 px-3 py-2.5 text-cream ring-1 ring-white/15
        outline-none focus:ring-azur ${props.className || ''}`}
    />
  )
}

export function Select(props) {
  return (
    <select
      {...props}
      className={`w-full rounded-xl bg-night2 px-3 py-2.5 text-cream ring-1 ring-white/15
        outline-none focus:ring-azur ${props.className || ''}`}
    />
  )
}

export function Toggle({ checked, onChange, label, hint }) {
  return (
    <button type="button" onClick={() => onChange(!checked)}
      className="flex w-full items-center justify-between gap-3 rounded-xl bg-white/5 px-4 py-3
                 ring-1 ring-white/10 text-left">
      <span>
        <span className="block font-semibold">{label}</span>
        {hint && <span className="block text-xs text-cream/50">{hint}</span>}
      </span>
      <span className={`relative h-6 w-11 shrink-0 rounded-full transition
                        ${checked ? 'bg-azur' : 'bg-white/20'}`}>
        <span className={`absolute top-0.5 h-5 w-5 rounded-full bg-white transition
                          ${checked ? 'left-[22px]' : 'left-0.5'}`} />
      </span>
    </button>
  )
}
