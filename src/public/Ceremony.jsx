import { usePublicGame } from '../lib/api.js'
import { Loader } from '../lib/ui.jsx'
import { FinalRevealScreen } from './CeremonyFinal.jsx'

// Ecran affiche sur TV / videoprojecteur. Il n'a AUCUN controle : tout est
// pilote depuis l'admin (telephone). Il reagit en temps reel a l'etat public.
export default function Ceremony() {
  const { data, loading } = usePublicGame()
  if (loading || !data) return <div className="min-h-screen"><Loader /></div>

  const { settings, challenges, teams, finalScores } = data
  const teamById = (id) => teams.find((t) => t.id === id)

  // 1) Classement final revele -> tableau final + confettis
  if (settings?.reveal_scores && finalScores.length > 0) {
    return <FinalRevealScreen scores={finalScores} />
  }

  // 2) Mode ceremonie inactif -> ecran d'attente
  if (!settings?.ceremony_mode) {
    return (
      <Fullscreen>
        <div className="text-center">
          <div className="text-6xl animate-floaty">🍷</div>
          <div className="mt-4 font-display text-3xl uppercase text-cream/60">
            En attente de la ceremonie
          </div>
        </div>
      </Fullscreen>
    )
  }

  // 3) Une epreuve est "en focus" -> revelation progressive
  const focus = challenges.find((c) => c.id === settings.ceremony_challenge_id)
  if (focus && focus.public_name) {
    const team = teamById(focus.winning_team_id)
    return (
      <Fullscreen>
        <div className="w-full max-w-3xl text-center">
          <div className="font-mono text-sm uppercase tracking-[.3em] text-azur">L'epreuve</div>
          <h1 className="mt-3 font-display text-6xl uppercase leading-none text-shimmer">
            {focus.public_name}
          </h1>

          {team && (
            <div className="mt-8 animate-popin">
              <div className="font-mono text-sm uppercase tracking-widest text-cream/60">Victoire</div>
              <div className="mt-1 font-display text-5xl uppercase" style={{ color: team.color }}>
                🏆 {team.name}
              </div>
            </div>
          )}

          {focus.points != null && (
            <div className="mt-10 animate-popin">
              <div className="font-mono text-sm uppercase tracking-widest text-cream/60">
                Cette epreuve valait
              </div>
              <div className="mt-1 font-display text-8xl text-sun2">+{focus.points}</div>
              <div className="font-display text-2xl uppercase text-cream/70">points</div>
            </div>
          )}
        </div>
      </Fullscreen>
    )
  }

  // 4) Intro (ecran 1)
  return (
    <Fullscreen>
      <div className="text-center">
        <div className="font-mono text-sm uppercase tracking-[.3em] text-azur">
          La Cuvee des FDP · Saison 2
        </div>
        <h1 className="mt-4 max-w-2xl font-display text-5xl uppercase leading-tight text-shimmer">
          Il est temps de decouvrir les resultats...
        </h1>
      </div>
    </Fullscreen>
  )
}

function Fullscreen({ children }) {
  return (
    <div className="flex min-h-screen items-center justify-center p-8">
      {children}
    </div>
  )
}
