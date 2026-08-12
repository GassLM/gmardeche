import { Outlet, NavLink, useOutletContext } from 'react-router-dom'
import { usePublicGame } from '../lib/api.js'
import { Loader } from '../lib/ui.jsx'

const NAV = [
  { to: '/',            label: 'Accueil',   icon: '🏝️' },
  { to: '/equipes',     label: 'Equipes',   icon: '⚔️' },
  { to: '/epreuves',    label: 'Epreuves',  icon: '🎯' },
  { to: '/mystere',     label: 'Mystere',   icon: '🔍' },
  { to: '/aventure',    label: 'Aventure',  icon: '📺' },
  { to: '/classement',  label: 'Classement',icon: '🏆' },
]

// Accessible depuis les pages via useOutletContext()
export function useGame() { return useOutletContext() }

function eventStatus(settings) {
  if (!settings?.start_at) return { label: 'Bientot', tone: 'sun' }
  const now = Date.now()
  const start = new Date(settings.start_at).getTime()
  const end = settings.end_at ? new Date(settings.end_at).getTime() : start
  if (now < start) {
    const days = Math.ceil((start - now) / 86400000)
    return { label: `J-${days} avant le debut`, tone: 'sun' }
  }
  if (now <= end) return { label: '🔴 Jeu en cours', tone: 'live' }
  return { label: '🏆 Jeu termine', tone: 'gold' }
}

export default function PublicLayout() {
  const { data, loading } = usePublicGame()

  if (loading) {
    return <div className="mx-auto max-w-lg"><Loader /></div>
  }

  const settings = data?.settings
  const status = eventStatus(settings)

  return (
    <div className="mx-auto min-h-screen max-w-lg pb-safe">
      {/* En-tete */}
      <header className="sticky top-0 z-30 border-b border-white/10 bg-night/80 px-4 py-3 backdrop-blur">
        <div className="flex items-center justify-between">
          <div className="font-display text-lg uppercase tracking-wide text-shimmer">
            {settings?.event_title || 'La Cuvee des FDP'}
          </div>
          <StatusPill status={status} />
        </div>
      </header>

      {settings?.site_paused && (
        <div className="bg-sun/20 px-4 py-2 text-center font-semibold text-sun">
          ⏸️ Le suivi est momentanement en pause.
        </div>
      )}

      <main className="px-4 py-5">
        <Outlet context={{ ...data, status }} />
      </main>

      {/* Navigation basse */}
      <nav className="fixed inset-x-0 bottom-0 z-40 mx-auto max-w-lg border-t border-white/10
                      bg-night/90 backdrop-blur nav-safe">
        <div className="grid grid-cols-6">
          {NAV.map((n) => (
            <NavLink key={n.to} to={n.to} end={n.to === '/'}
              className={({ isActive }) =>
                `flex flex-col items-center gap-0.5 py-2 text-[10px] font-semibold transition
                 ${isActive ? 'text-azur' : 'text-cream/50 hover:text-cream/80'}`}>
              <span className="text-lg leading-none">{n.icon}</span>
              {n.label}
            </NavLink>
          ))}
        </div>
      </nav>
    </div>
  )
}

function StatusPill({ status }) {
  const tone = {
    sun:  'bg-sun/20 text-sun ring-sun/40',
    live: 'bg-coral/20 text-coral ring-coral/40',
    gold: 'bg-sun2/20 text-sun2 ring-sun2/40',
  }[status.tone]
  return (
    <span className={`rounded-full px-3 py-1 text-xs font-bold ring-1 ${tone}`}>
      {status.label}
    </span>
  )
}
