import { useGame } from './PublicLayout.jsx'
import { Card, SectionTitle, LiveDot, Lock } from '../lib/ui.jsx'

export default function Challenges() {
  const { challenges, teams } = useGame()
  const teamById = (id) => teams.find((t) => t.id === id)

  return (
    <div className="space-y-5">
      <SectionTitle eyebrow="Le tableau des defis" title="Les epreuves" />
      <div className="space-y-3">
        {challenges.map((c, i) => (
          <ChallengeCard key={c.id} c={c} index={i + 1} team={teamById(c.winning_team_id)} />
        ))}
        {challenges.length === 0 && (
          <Card className="p-5 text-center text-cream/60">Aucune epreuve pour le moment.</Card>
        )}
      </div>
      <p className="pt-2 text-center font-mono text-[11px] text-cream/40">
        Les valeurs en points restent secretes jusqu'a la ceremonie finale.
      </p>
    </div>
  )
}

function ChallengeCard({ c, index, team }) {
  const isLive = c.status === 'live'
  return (
    <Card className={`p-4 ${isLive ? 'ring-2 ring-coral/60' : ''}`}>
      <div className="flex items-center justify-between">
        <span className="font-mono text-xs uppercase tracking-widest text-cream/50">
          Epreuve #{index}
        </span>
        {c.status === 'hidden'    && <Lock>A venir</Lock>}
        {c.status === 'revealed'  && <span className="rounded-full bg-azur/20 px-2.5 py-1 text-xs font-bold text-azur">A venir</span>}
        {isLive                   && <LiveDot />}
        {c.status === 'completed' && <span className="rounded-full bg-sun2/20 px-2.5 py-1 text-xs font-bold text-sun2">✅ Terminee</span>}
      </div>

      <div className="mt-2 font-display text-2xl uppercase leading-tight">
        {c.status === 'hidden' ? '🔒 Epreuve secrete' : c.public_name}
      </div>

      {c.description && c.status !== 'hidden' && (
        <p className="mt-1 text-sm text-cream/70">{c.description}</p>
      )}

      {c.status === 'completed' && team && (
        <div className="mt-3 flex items-center gap-2 rounded-xl bg-white/5 px-3 py-2">
          <span className="text-lg">🏆</span>
          <span className="font-semibold">Victoire :</span>
          <span className="font-display uppercase" style={{ color: team.color }}>{team.name}</span>
        </div>
      )}
      {c.status === 'completed' && !team && (
        <div className="mt-3 text-sm text-cream/50">Resultat garde secret pour l'instant.</div>
      )}
    </Card>
  )
}
