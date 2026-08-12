import { useGame } from './PublicLayout.jsx'
import { Card, SectionTitle } from '../lib/ui.jsx'

export default function Teams() {
  const { teams, players } = useGame()
  const byTeam = (id) => players.filter((p) => p.team_id === id)

  return (
    <div className="space-y-6">
      <SectionTitle eyebrow="Les combattants" title="Les equipes" />
      {teams.map((t) => (
        <div key={t.id}>
          <div className="mb-2 flex items-center gap-2">
            <span className="h-3 w-3 rounded-full" style={{ background: t.color }} />
            <h3 className="font-display text-2xl uppercase" style={{ color: t.color }}>{t.name}</h3>
          </div>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            {byTeam(t.id).map((p) => (
              <PlayerCard key={p.id} player={p} color={t.color} />
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}

function PlayerCard({ player, color }) {
  const initial = player.first_name?.[0]?.toUpperCase() || '?'
  return (
    <Card className="overflow-hidden">
      <div className="flex aspect-square items-center justify-center"
           style={{ background: `linear-gradient(135deg, ${color}55, ${color}11)` }}>
        {player.image
          ? <img src={player.image} alt={player.first_name} className="h-full w-full object-cover" />
          : <span className="font-display text-5xl text-white/90">{initial}</span>}
      </div>
      <div className="p-2 text-center font-semibold">{player.first_name}</div>
    </Card>
  )
}
