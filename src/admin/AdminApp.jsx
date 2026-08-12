import { createContext, useContext, useEffect, useState } from 'react'
import { onAuth, signOut, useAdminGame } from '../lib/api.js'
import { useConfirm, Loader } from '../lib/ui.jsx'
import Login from './Login.jsx'
import Dashboard from './Dashboard.jsx'
import ChallengesAdmin from './ChallengesAdmin.jsx'
import CluesAdmin from './CluesAdmin.jsx'
import BonusAdmin from './BonusAdmin.jsx'
import MysteryAdmin from './MysteryAdmin.jsx'
import EnvelopesAdmin from './EnvelopesAdmin.jsx'
import TimelineAdmin from './TimelineAdmin.jsx'
import SettingsAdmin from './SettingsAdmin.jsx'

const AdminCtx = createContext(null)
export const useAdmin = () => useContext(AdminCtx)

const TABS = [
  { id: 'dashboard',  label: 'Dashboard',  Comp: Dashboard },
  { id: 'challenges', label: 'Epreuves',   Comp: ChallengesAdmin },
  { id: 'clues',      label: 'Indices',    Comp: CluesAdmin },
  { id: 'bonus',      label: 'Bonus',      Comp: BonusAdmin },
  { id: 'mystery',    label: 'Mystere',    Comp: MysteryAdmin },
  { id: 'envelopes',  label: 'Enveloppes', Comp: EnvelopesAdmin },
  { id: 'timeline',   label: 'Aventure',   Comp: TimelineAdmin },
  { id: 'settings',   label: 'Parametres', Comp: SettingsAdmin },
]

export default function AdminApp() {
  const [session, setSession] = useState(undefined) // undefined = en cours
  const [tab, setTab] = useState('dashboard')
  const { data, loading, reload } = useAdminGame()
  const { confirm, node } = useConfirm()

  useEffect(() => onAuth(setSession), [])
  // Une fois la session admin etablie, on (re)charge les donnees de base
  // (le premier fetch a pu se faire avant l'authentification).
  useEffect(() => { if (session) reload() }, [session, reload])

  if (session === undefined) return <div className="min-h-screen"><Loader label="Verification..." /></div>
  if (!session) return <Login />
  if (loading || !data || !data.settings)
    return <div className="min-h-screen"><Loader label="Chargement de l'admin..." /></div>

  const Active = TABS.find((t) => t.id === tab)?.Comp || Dashboard

  return (
    <AdminCtx.Provider value={{ game: data, reload, confirm }}>
      <div className="mx-auto min-h-screen max-w-2xl">
        {/* Barre du haut */}
        <header className="sticky top-0 z-30 flex items-center justify-between border-b
                           border-white/10 bg-night/85 px-4 py-3 backdrop-blur">
          <div className="font-display text-lg uppercase tracking-wide text-shimmer">Admin · Cuvee FDP</div>
          <button onClick={() => signOut()} className="text-sm text-cream/60 hover:text-coral">Deconnexion</button>
        </header>

        {/* Onglets (scroll horizontal) */}
        <nav className="sticky top-[52px] z-20 flex gap-1 overflow-x-auto border-b border-white/10
                        bg-night/70 px-2 py-2 backdrop-blur">
          {TABS.map((t) => (
            <button key={t.id} onClick={() => setTab(t.id)}
              className={`whitespace-nowrap rounded-full px-3 py-1.5 text-sm font-semibold transition
                ${tab === t.id ? 'bg-azur text-night' : 'bg-white/5 text-cream/70 hover:bg-white/10'}`}>
              {t.label}
            </button>
          ))}
        </nav>

        <main className="p-4">
          <Active />
        </main>
      </div>
      {node}
    </AdminCtx.Provider>
  )
}
