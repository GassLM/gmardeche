import { useGame } from './PublicLayout.jsx'
import { Card, SectionTitle, Lock } from '../lib/ui.jsx'

export default function Mystery() {
  const { clues, teams, mystery } = useGame()
  const teamById = (id) => teams.find((t) => t.id === id)

  const total = clues.length
  const countByTeam = (tid) => clues.filter((c) => c.found_by_team_id === tid).length

  // Barre "decorative" basee uniquement sur le nombre d'indices decouverts.
  // Volontairement PAS un pourcentage vers la solution (paliers de 12 segments).
  const segments = 12
  const filled = Math.min(segments, total)

  return (
    <div className="space-y-6">
      <SectionTitle eyebrow="Quete secondaire" title="🔍 Le Mystere de la Maison" />

      <Card className="p-5">
        <p className="text-sm text-cream/75">
          Une cle est cachee quelque part dans la maison. Trouvez les indices pour la localiser.
        </p>
        <div className="mt-4 flex gap-1">
          {Array.from({ length: segments }).map((_, i) => (
            <div key={i}
              className={`h-3 flex-1 rounded-full ${i < filled ? 'bg-sun' : 'bg-white/10'}`} />
          ))}
        </div>
        <div className="mt-2 text-center font-display text-3xl text-sun2">
          {total} <span className="text-base font-normal text-cream/60">indice{total > 1 ? 's' : ''} decouvert{total > 1 ? 's' : ''}</span>
        </div>
      </Card>

      {/* Compteurs par equipe */}
      <div className="grid grid-cols-2 gap-3">
        {teams.map((t) => (
          <Card key={t.id} className="p-4 text-center">
            <div className="mb-1 font-display text-lg uppercase" style={{ color: t.color }}>{t.name}</div>
            <div className="font-display text-4xl">🔍 {countByTeam(t.id)}</div>
            <div className="text-[11px] uppercase tracking-wide text-cream/60">indices trouves</div>
          </Card>
        ))}
      </div>

      {mystery?.solved && (
        <Card className="p-4 text-center ring-2 ring-sun/50">
          <div className="font-display text-2xl text-sun2">🗝️ Mystere resolu !</div>
          {teamById(mystery.solved_by_team_id) && (
            <div className="mt-1">
              Par <span className="font-display uppercase"
                style={{ color: teamById(mystery.solved_by_team_id).color }}>
                {teamById(mystery.solved_by_team_id).name}
              </span>
            </div>
          )}
        </Card>
      )}

      {/* Indices decouverts */}
      <div>
        <h3 className="mb-2 font-display text-xl uppercase">Indices decouverts</h3>
        <div className="space-y-2">
          {[...clues].sort((a, b) => a.number - b.number).map((c) => (
            <ClueCard key={c.id} clue={c} team={teamById(c.found_by_team_id)} />
          ))}
          {clues.length === 0 && (
            <Card className="p-4 text-center text-sm text-cream/50">
              Aucun indice decouvert pour l'instant.
            </Card>
          )}
        </div>
      </div>
    </div>
  )
}

function ClueCard({ clue, team }) {
  return (
    <Card className="p-4">
      <div className="flex items-center justify-between">
        <span className="font-mono text-xs uppercase tracking-widest text-cream/50">
          Indice #{clue.number} · Niveau {clue.level}
        </span>
        {team && (
          <span className="rounded-full px-2.5 py-1 text-xs font-bold"
            style={{ background: `${team.color}33`, color: team.color }}>
            {team.name}
          </span>
        )}
      </div>
      {clue.text
        ? <p className="mt-2 text-cream">"{clue.text}"</p>
        : <div className="mt-2 flex items-center gap-2 text-cream/50"><Lock>Contenu non publie</Lock></div>}
      {clue.location && <p className="mt-1 text-xs text-cream/50">📍 {clue.location}</p>}
    </Card>
  )
}
