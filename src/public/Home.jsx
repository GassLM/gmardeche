import { Link } from 'react-router-dom'
import { useGame } from './PublicLayout.jsx'
import { Card } from '../lib/ui.jsx'

export default function Home() {
  const game = useGame()
  const { teams, players, clues, timeline, settings } = game

  const marseillais = teams.find((t) => t.slug === 'marseillais')
  const monde = teams.find((t) => t.slug === 'reste-du-monde')
  const foundClues = clues.length // la vue ne renvoie que les indices trouves
  const dateLabel = formatDates(settings?.start_at, settings?.end_at)

  return (
    <div className="space-y-6">
      {/* HERO - panneau VS diagonal (signature) */}
      <section className="relative overflow-hidden rounded-3xl ring-1 ring-white/10">
        <div className="absolute inset-0 grid grid-cols-2">
          <div className="bg-gradient-to-br from-marseille/70 to-marseille/20" />
          <div className="bg-gradient-to-bl from-coral/70 to-coral/20" />
        </div>
        <div className="absolute inset-y-0 left-1/2 -ml-px w-[2px] -skew-x-12 bg-white/40" />

        <div className="relative px-5 py-8 text-center">
          <div className="font-mono text-[11px] uppercase tracking-[.25em] text-cream/80">
            {settings?.event_subtitle || 'Saison 2 - Ardeche 2026'}
          </div>
          <h1 className="mt-2 font-display text-4xl uppercase leading-[.9] text-shimmer">
            La Cuvee<br />des FDP
          </h1>

          <div className="mt-6 grid grid-cols-[1fr_auto_1fr] items-center gap-2">
            <TeamName name="Les Marseillais" color={marseillais?.color} align="right" />
            <div className="font-display text-2xl text-cream/90 animate-floaty">VS</div>
            <TeamName name="Le Reste du Monde" color={monde?.color} align="left" />
          </div>

          <div className="mt-6 inline-block rounded-full bg-black/25 px-4 py-1.5
                          font-mono text-sm font-bold tracking-wide text-sun2">
            {dateLabel}
          </div>
        </div>
      </section>

      {/* Compteurs rapides */}
      <div className="grid grid-cols-3 gap-3">
        <Stat value={teams.length ? '2' : '0'} label="Equipes" />
        <Stat value={players.length} label="Joueurs" />
        <Stat value={foundClues} label="Indices trouves" />
      </div>

      {/* Mystere */}
      <Link to="/mystere" className="block">
        <Card className="p-5">
          <div className="mb-1 font-mono text-xs uppercase tracking-widest text-azur">
            Quete secondaire
          </div>
          <div className="flex items-center justify-between">
            <div className="font-display text-2xl uppercase">🔍 Le Mystere de la Maison</div>
          </div>
          <p className="mt-1 text-sm text-cream/70">
            Une cle est cachee. {foundClues} indice{foundClues > 1 ? 's' : ''} deja decouvert
            {foundClues > 1 ? 's' : ''}.
          </p>
        </Card>
      </Link>

      {/* Dernieres actions */}
      <div>
        <div className="mb-2 flex items-center justify-between">
          <h2 className="font-display text-xl uppercase">📺 Dernieres nouvelles</h2>
          <Link to="/aventure" className="font-mono text-xs text-azur">tout voir</Link>
        </div>
        <div className="space-y-2">
          {timeline.slice(0, 3).map((e) => (
            <Card key={e.id} className="flex items-center gap-3 p-3">
              <span className="text-xl">{eventIcon(e.type)}</span>
              <div className="min-w-0">
                <div className="truncate font-semibold">{e.title}</div>
                <div className="font-mono text-[11px] text-cream/50">{formatTime(e.event_time)}</div>
              </div>
            </Card>
          ))}
          {timeline.length === 0 && (
            <Card className="p-4 text-center text-sm text-cream/50">
              L'aventure n'a pas encore commence.
            </Card>
          )}
        </div>
      </div>
    </div>
  )
}

function TeamName({ name, color, align }) {
  return (
    <div className={`font-display text-lg uppercase leading-tight ${align === 'right' ? 'text-right' : 'text-left'}`}
         style={{ color: color || '#fff' }}>
      {name}
    </div>
  )
}

function Stat({ value, label }) {
  return (
    <Card className="p-3 text-center">
      <div className="font-display text-3xl text-sun2">{value}</div>
      <div className="mt-0.5 text-[11px] uppercase tracking-wide text-cream/60">{label}</div>
    </Card>
  )
}

export function eventIcon(type) {
  return { win: '🏆', live: '🔴', clue: '🔍', challenge: '🎯', mystery: '🗝️', info: '🎬' }[type] || '•'
}

export function formatTime(iso) {
  if (!iso) return ''
  const d = new Date(iso)
  return d.toLocaleString('fr-FR', { weekday: 'short', hour: '2-digit', minute: '2-digit' })
}

function formatDates(start, end) {
  if (!start) return '15 - 18 AOUT 2026'
  const s = new Date(start), e = end ? new Date(end) : s
  const opts = { day: 'numeric' }
  const month = e.toLocaleDateString('fr-FR', { month: 'long' }).toUpperCase()
  return `${s.toLocaleDateString('fr-FR', opts)} - ${e.toLocaleDateString('fr-FR', opts)} ${month} ${e.getFullYear()}`
}
